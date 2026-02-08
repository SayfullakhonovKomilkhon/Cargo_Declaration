import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { getAnthropicService } from '@/server/services/anthropic.service';

/**
 * POST /api/ai/suggest-hs-code
 * Get AI suggestions for HS code based on product description
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Необходимо указать описание товара' },
        { status: 400 }
      );
    }

    if (description.length < 3) {
      return NextResponse.json(
        { error: 'Описание товара слишком короткое' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Описание товара слишком длинное (макс. 2000 символов)' },
        { status: 400 }
      );
    }

    // Get Anthropic service
    const anthropicService = getAnthropicService();

    // Get HS code suggestions
    const result = await anthropicService.suggestHSCode(description);

    // Log AI processing (if AIProcessingLog model exists)
    // This is optional and can be implemented later

    return NextResponse.json({
      success: true,
      suggestedCodes: result.data.suggestedCodes,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Suggest HS code API error:', error);

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'AI сервис не настроен. Обратитесь к администратору.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Ошибка получения рекомендаций по HS коду' },
      { status: 500 }
    );
  }
}
