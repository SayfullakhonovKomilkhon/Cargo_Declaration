import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { GTDPDFTemplateService } from '@/server/services/gtd-pdf-template.service';
import { adaptFormDataToTD1, type GTDFormData } from '@/server/services/gtd-data-adapter';

/**
 * POST /api/declarations/preview-pdf
 * 
 * Генерация превью PDF непосредственно из данных формы
 * (без сохранения в базу данных)
 * 
 * Body: GTDFormData
 * Query params:
 * - debug: 'true' to show coordinate grid
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const debug = searchParams.get('debug') === 'true';

    // Parse form data from request body
    const formData: GTDFormData = await request.json();

    // Create PDF service
    const pdfService = new GTDPDFTemplateService({
      showDebugGrid: debug,
    });

    // Convert form data to TD1 format
    const { td1Data, additionalItems } = adaptFormDataToTD1(formData);

    // Generate PDF
    const pdfBuffer = await pdfService.generateGTD(td1Data, additionalItems);

    // Return PDF
    const filename = `GTD_preview_${formData.declarationNumber || Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF preview generation error:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации превью PDF' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/declarations/preview-pdf
 * 
 * Генерация тестового PDF с отладочной сеткой
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const debug = searchParams.get('debug') === 'true';

    // Create PDF service with debug mode
    const pdfService = new GTDPDFTemplateService({
      showDebugGrid: debug,
    });

    // Generate debug PDF with sample data
    const pdfBuffer = await pdfService.generateDebugPDF();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="GTD_debug.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Debug PDF generation error:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации отладочного PDF' },
      { status: 500 }
    );
  }
}
