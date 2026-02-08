import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';

/**
 * GET /api/user/ai-settings
 * Get current user's AI settings
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.userAISettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userAISettings.create({
        data: {
          userId: session.user.id,
          autoProcessDocuments: false,
          minConfidenceForAutofill: 0.7,
          allowedAutofillFields: null,
          documentLanguage: 'ru',
          showAISuggestions: true,
          showConfidenceIndicators: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get AI settings error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения настроек' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/ai-settings
 * Update current user's AI settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const body = await request.json();
    const {
      autoProcessDocuments,
      minConfidenceForAutofill,
      allowedAutofillFields,
      documentLanguage,
      showAISuggestions,
      showConfidenceIndicators,
    } = body;

    // Validate minConfidenceForAutofill
    if (
      minConfidenceForAutofill !== undefined &&
      (minConfidenceForAutofill < 0 || minConfidenceForAutofill > 1)
    ) {
      return NextResponse.json(
        { error: 'minConfidenceForAutofill должен быть от 0 до 1' },
        { status: 400 }
      );
    }

    // Validate documentLanguage
    const validLanguages = ['ru', 'en', 'uz'];
    if (documentLanguage && !validLanguages.includes(documentLanguage)) {
      return NextResponse.json(
        { error: 'Неверный язык документа' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.userAISettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        autoProcessDocuments: autoProcessDocuments ?? false,
        minConfidenceForAutofill: minConfidenceForAutofill ?? 0.7,
        allowedAutofillFields: allowedAutofillFields ?? null,
        documentLanguage: documentLanguage ?? 'ru',
        showAISuggestions: showAISuggestions ?? true,
        showConfidenceIndicators: showConfidenceIndicators ?? true,
      },
      update: {
        ...(autoProcessDocuments !== undefined && { autoProcessDocuments }),
        ...(minConfidenceForAutofill !== undefined && { minConfidenceForAutofill }),
        ...(allowedAutofillFields !== undefined && { allowedAutofillFields }),
        ...(documentLanguage !== undefined && { documentLanguage }),
        ...(showAISuggestions !== undefined && { showAISuggestions }),
        ...(showConfidenceIndicators !== undefined && { showConfidenceIndicators }),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update AI settings error:', error);
    return NextResponse.json(
      { error: 'Ошибка сохранения настроек' },
      { status: 500 }
    );
  }
}
