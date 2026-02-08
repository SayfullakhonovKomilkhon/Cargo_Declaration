import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DutyCalculationService } from '@/server/services/duty-calculation.service';

// Схема валидации запроса
const calculateDutiesSchema = z.object({
  hsCode: z.string().length(10, 'HS код должен быть 10 символов'),
  customsValue: z.number().positive('Таможенная стоимость должна быть больше 0'),
  quantity: z.number().positive('Количество должно быть больше 0'),
  originCountry: z.string().length(2, 'Код страны должен быть 2 символа'),
  weight: z.number().positive().optional(),
  currency: z.string().length(3).optional(), // Для конвертации
});

/**
 * POST /api/declarations/calculate-duties
 * Расчет таможенных платежей для товарной позиции
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация входных данных
    const validationResult = calculateDutiesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Некорректные данные',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { hsCode, customsValue, quantity, originCountry, weight, currency } = validationResult.data;

    // Конвертируем в сумы если нужно
    let customsValueUZS = customsValue;
    if (currency && currency !== 'UZS') {
      customsValueUZS = await DutyCalculationService.convertToUZS(customsValue, currency);
    }

    // Рассчитываем пошлины
    const result = await DutyCalculationService.calculateDuties({
      hsCode,
      customsValue: customsValueUZS,
      quantity,
      originCountry,
      weight,
    });

    // Добавляем информацию о преференциях
    const preferenceInfo = DutyCalculationService.getPreferentialRate(
      originCountry,
      result.breakdown.dutyRate
    );

    return NextResponse.json({
      ...result,
      preferenceType: preferenceInfo.preferenceType,
      originalCurrency: currency,
      convertedCustomsValue: customsValueUZS,
    });
  } catch (error) {
    console.error('Duty calculation error:', error);
    return NextResponse.json(
      { error: 'Ошибка расчета таможенных платежей' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/declarations/calculate-duties?hsCode=1234567890
 * Получение ставок пошлин для HS кода
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get('hsCode');

    if (!hsCode) {
      return NextResponse.json(
        { error: 'Укажите HS код' },
        { status: 400 }
      );
    }

    if (hsCode.length !== 10) {
      return NextResponse.json(
        { error: 'HS код должен быть 10 символов' },
        { status: 400 }
      );
    }

    const rates = await DutyCalculationService.getDutyRates(hsCode);

    if (!rates) {
      // Возвращаем значения по умолчанию
      return NextResponse.json({
        dutyRate: 15,
        vatRate: 12,
        exciseRate: 0,
        found: false,
        message: 'HS код не найден в базе, используются стандартные ставки',
      });
    }

    return NextResponse.json({
      ...rates,
      found: true,
    });
  } catch (error) {
    console.error('Get duty rates error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения ставок' },
      { status: 500 }
    );
  }
}
