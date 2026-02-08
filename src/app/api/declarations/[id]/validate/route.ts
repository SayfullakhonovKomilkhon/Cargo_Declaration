import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { PDFGeneratorService } from '@/server/services/pdf-generator.service';

/**
 * GET /api/declarations/[id]/validate
 * Валидация декларации по правилам таможни Узбекистана
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Валидация декларации
    const validation = await PDFGeneratorService.validateDeclaration(id);

    // Форматируем ответ
    return NextResponse.json({
      success: true,
      declarationId: id,
      isValid: validation.isValid,
      summary: {
        totalErrors: validation.errors.filter(e => e.severity === 'error').length,
        totalWarnings: validation.errors.filter(e => e.severity === 'warning').length,
        totalCorrections: validation.corrections.length,
      },
      errors: validation.errors.filter(e => e.severity === 'error').map(e => ({
        field: e.field,
        message: e.message,
      })),
      warnings: validation.errors.filter(e => e.severity === 'warning').map(e => ({
        field: e.field,
        message: e.message,
      })),
      corrections: validation.corrections.map(c => ({
        field: c.field,
        original: c.originalValue,
        corrected: c.correctedValue,
        reason: c.reason,
      })),
    });
  } catch (error) {
    console.error('Validation error:', error);
    
    if (error instanceof Error && error.message === 'Декларация не найдена') {
      return NextResponse.json(
        { error: 'Declaration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
