import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import { PDFGeneratorService } from '@/server/services/pdf-generator.service';
import { GTDPDFTemplateService } from '@/server/services/gtd-pdf-template.service';
import { adaptPrismaToFormData, adaptFormDataToTD1 } from '@/server/services/gtd-data-adapter';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/declarations/[id]/pdf
 * Generate and download PDF for a declaration
 * 
 * Query params:
 * - method: 'template' (pixel-perfect) | 'html' (legacy) - default: 'template'
 * - debug: 'true' to show coordinate grid
 * - background: 'true' to use image background (requires blank form images)
 * - borders: 'true' to show field borders for calibration
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const method = searchParams.get('method') || 'template';
    const debug = searchParams.get('debug') === 'true';
    const useBackground = searchParams.get('background') === 'true';
    const showBorders = searchParams.get('borders') === 'true';

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find declaration and check access (include items for PDF generation)
    const declaration = await prisma.declaration.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
      },
    });

    if (!declaration) {
      return NextResponse.json({ error: 'Декларация не найдена' }, { status: 404 });
    }

    // Check access rights
    const hasAccess =
      session.user.role === 'ADMIN' ||
      declaration.userId === session.user.id ||
      (session.user.organizationId &&
        declaration.organizationId === session.user.organizationId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к декларации' }, { status: 403 });
    }

    let pdfBuffer: Buffer;
    let filename: string;

    if (method === 'template') {
      // New pixel-perfect template-based PDF generation
      const pdfService = new GTDPDFTemplateService({
        showDebugGrid: debug,
        useImageBackground: useBackground,
        showFieldBorders: showBorders,
      });

      // Convert Prisma data to form data, then to TD1 format
      const formData = adaptPrismaToFormData(declaration as unknown as Record<string, unknown>);
      const { td1Data, additionalItems } = adaptFormDataToTD1(formData);

      // Debug logging
      console.log('=== PDF Generation Debug ===');
      console.log('Declaration ID:', declaration.id);
      console.log('Items count:', declaration.items?.length || 0);
      console.log('FormData keys:', Object.keys(formData).filter(k => formData[k as keyof typeof formData]));
      console.log('TD1Data sample:', {
        exporterName: td1Data.exporterName,
        consigneeName: td1Data.consigneeName,
        dispatchCountry: td1Data.dispatchCountry,
        destinationCountry: td1Data.destinationCountry,
        tradingCountry: td1Data.tradingCountry,
        totalCustomsValue: td1Data.totalCustomsValue,
        firstItem: td1Data.firstItem ? {
          description: td1Data.firstItem.goodsDescription?.substring(0, 50),
          hsCode: td1Data.firstItem.hsCode,
        } : null,
      });
      console.log('Additional items count:', additionalItems.length);
      console.log('============================');

      pdfBuffer = await pdfService.generateGTD(td1Data, additionalItems);
      filename = `GTD_${declaration.declarationNumber || declaration.id}.pdf`;
    } else {
      // Legacy HTML-based PDF generation
      pdfBuffer = await PDFGeneratorService.generateDeclarationPDF(id);
      filename = PDFGeneratorService.getFilename(declaration.declarationNumber);

      // Check if it's HTML (fallback when Puppeteer not available)
      const isHTML = pdfBuffer.toString('utf-8', 0, 15).includes('<!DOCTYPE');

      if (isHTML) {
        // Return HTML for browser preview/print
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="${filename.replace('.pdf', '.html')}"`,
          },
        });
      }
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации PDF' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/declarations/[id]/pdf
 * Generate PDF and return as base64 (for preview)
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find declaration and check access
    const declaration = await prisma.declaration.findUnique({
      where: { id },
      select: {
        id: true,
        declarationNumber: true,
        userId: true,
        organizationId: true,
      },
    });

    if (!declaration) {
      return NextResponse.json({ error: 'Декларация не найдена' }, { status: 404 });
    }

    // Check access rights
    const hasAccess =
      session.user.role === 'ADMIN' ||
      declaration.userId === session.user.id ||
      (session.user.organizationId &&
        declaration.organizationId === session.user.organizationId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к декларации' }, { status: 403 });
    }

    // Generate HTML preview
    const html = await PDFGeneratorService.generateDeclarationHTML(id);

    return NextResponse.json({
      success: true,
      html,
      declarationNumber: declaration.declarationNumber,
    });
  } catch (error) {
    console.error('PDF preview error:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации превью' },
      { status: 500 }
    );
  }
}
