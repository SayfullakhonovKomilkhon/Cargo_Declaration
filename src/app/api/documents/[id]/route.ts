import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import { StorageService } from '@/server/services/storage.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]
 * Get a single document with signed URL
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        declaration: {
          select: {
            id: true,
            declarationNumber: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Check access rights (owner or admin)
    if (session.user.role !== 'ADMIN' && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: 'Нет доступа к документу' }, { status: 403 });
    }

    // Get signed URL
    const signedUrl = await StorageService.getSignedUrl(document.fileUrl);

    return NextResponse.json({
      document: {
        ...document,
        url: signedUrl,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения документа' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Check access rights (owner or admin)
    if (session.user.role !== 'ADMIN' && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав на удаление документа' }, { status: 403 });
    }

    // Delete from storage
    try {
      await StorageService.deleteFile(document.fileUrl);
    } catch (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with DB deletion even if storage fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Документ удален',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления документа' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update document metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Check access rights
    if (session.user.role !== 'ADMIN' && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
    }

    // Get update data
    const body = await request.json();
    const { documentType, declarationId } = body;

    // Update document
    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(documentType && { documentType }),
        ...(declarationId !== undefined && { declarationId }),
      },
    });

    return NextResponse.json({
      success: true,
      document: updated,
    });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления документа' },
      { status: 500 }
    );
  }
}
