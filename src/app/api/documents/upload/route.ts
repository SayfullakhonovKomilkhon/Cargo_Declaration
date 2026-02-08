import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import {
  StorageService,
  FileValidationError,
} from '@/server/services/storage.service';
import { DocumentType, DocumentProcessingStatus } from '@prisma/client';

/**
 * POST /api/documents/upload
 * Upload a new document
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const declarationId = formData.get('declarationId') as string | null;
    const documentType = formData.get('documentType') as DocumentType | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage (validation happens inside)
    const { key } = await StorageService.uploadFile(
      buffer,
      file.name,
      file.type,
      session.user.id
    );

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: key,
        documentType: documentType || DocumentType.OTHER,
        processingStatus: DocumentProcessingStatus.PENDING,
        uploadedById: session.user.id,
        declarationId: declarationId || null,
      },
    });

    // Get signed URL for immediate access
    const signedUrl = await StorageService.getSignedUrl(key);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        processingStatus: document.processingStatus,
        createdAt: document.createdAt,
        url: signedUrl,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);

    // Handle validation errors
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generic error
    return NextResponse.json(
      { error: 'Ошибка загрузки документа' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/upload
 * Get list of documents for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const declarationId = searchParams.get('declarationId');
    const documentType = searchParams.get('documentType') as DocumentType | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: {
      uploadedById?: string;
      declarationId?: string | null;
      documentType?: DocumentType;
      fileName?: { contains: string; mode: 'insensitive' };
    } = {};

    // Filter by user (unless admin)
    if (session.user.role !== 'ADMIN') {
      where.uploadedById = session.user.id;
    }

    // Filter by declaration
    if (declarationId) {
      where.declarationId = declarationId;
    }

    // Filter by document type
    if (documentType) {
      where.documentType = documentType;
    }

    // Search by filename
    if (search) {
      where.fileName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения документов' },
      { status: 500 }
    );
  }
}
