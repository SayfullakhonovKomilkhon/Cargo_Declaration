import { prisma } from '@/server/db/client';

// Типы для расчета пошлин
export interface DutyCalculationInput {
  hsCode: string;
  customsValue: number;
  quantity: number;
  originCountry: string;
  weight?: number; // Вес в кг (для некоторых товаров)
}

export interface DutyCalculationResult {
  dutyAmount: number;
  vatAmount: number;
  exciseAmount: number;
  customsFee: number;
  totalPayment: number;
  breakdown: {
    dutyRate: number;
    vatRate: number;
    exciseRate: number;
    customsValue: number;
    vatBase: number;
  };
}

export interface DeclarationTotalResult {
  totalCustomsValue: number;
  totalDuty: number;
  totalVat: number;
  totalExcise: number;
  totalFee: number;
  grandTotal: number;
  itemCount: number;
}

// Функция округления до 2 знаков
function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// Преференциальные страны (пример - могут быть разные ставки)
const PREFERENTIAL_COUNTRIES = ['KZ', 'KG', 'TJ', 'AM', 'BY', 'RU']; // СНГ
const FREE_TRADE_COUNTRIES = ['KZ', 'KG', 'AM', 'BY', 'RU']; // ЕАЭС

export class DutyCalculationService {
  /**
   * Рассчитывает таможенные платежи для одной товарной позиции
   */
  static async calculateDuties(input: DutyCalculationInput): Promise<DutyCalculationResult> {
    const { hsCode, customsValue, originCountry } = input;

    // 1. Находим HS код в БД
    const hsCodeData = await prisma.hSCode.findFirst({
      where: {
        code: hsCode,
        isActive: true,
      },
    });

    // Получаем ставки из БД или используем значения по умолчанию
    // Конвертируем Decimal в number
    let dutyRate = hsCodeData?.dutyRate ? Number(hsCodeData.dutyRate) : 15; // По умолчанию 15%
    const vatRate = hsCodeData?.vatRate ? Number(hsCodeData.vatRate) : 12; // По умолчанию 12% НДС в Узбекистане
    const exciseRate = hsCodeData?.exciseRate ? Number(hsCodeData.exciseRate) : 0;

    // 2. Применяем преференции если применимо
    if (FREE_TRADE_COUNTRIES.includes(originCountry)) {
      // Товары из стран ЕАЭС - нулевая пошлина
      dutyRate = 0;
    } else if (PREFERENTIAL_COUNTRIES.includes(originCountry)) {
      // Товары из СНГ - сниженная ставка (75% от базовой)
      dutyRate = dutyRate * 0.75;
    }

    // 3. Рассчитываем таможенную пошлину
    const dutyAmount = roundTo2Decimals((customsValue * dutyRate) / 100);

    // 4. Рассчитываем базу для НДС (таможенная стоимость + пошлина + акциз)
    const exciseAmount = roundTo2Decimals((customsValue * exciseRate) / 100);
    const vatBase = customsValue + dutyAmount + exciseAmount;

    // 5. Рассчитываем НДС
    const vatAmount = roundTo2Decimals((vatBase * vatRate) / 100);

    // 6. Рассчитываем таможенный сбор (0.2% от таможенной стоимости, мин 50000 UZS, макс 1000000 UZS)
    let customsFee = roundTo2Decimals(customsValue * 0.002);
    customsFee = Math.max(50000, Math.min(customsFee, 1000000)); // В сумах

    // 7. Итого платежей
    const totalPayment = roundTo2Decimals(dutyAmount + vatAmount + exciseAmount + customsFee);

    return {
      dutyAmount,
      vatAmount,
      exciseAmount,
      customsFee,
      totalPayment,
      breakdown: {
        dutyRate,
        vatRate,
        exciseRate,
        customsValue,
        vatBase,
      },
    };
  }

  /**
   * Рассчитывает общую сумму платежей по декларации
   */
  static calculateDeclarationTotal(
    items: Array<{
      customsValue?: number;
      dutyAmount?: number;
      vatAmount?: number;
      exciseAmount?: number;
      feeAmount?: number;
    }>
  ): DeclarationTotalResult {
    const result: DeclarationTotalResult = {
      totalCustomsValue: 0,
      totalDuty: 0,
      totalVat: 0,
      totalExcise: 0,
      totalFee: 0,
      grandTotal: 0,
      itemCount: items.length,
    };

    for (const item of items) {
      result.totalCustomsValue += item.customsValue ?? 0;
      result.totalDuty += item.dutyAmount ?? 0;
      result.totalVat += item.vatAmount ?? 0;
      result.totalExcise += item.exciseAmount ?? 0;
      result.totalFee += item.feeAmount ?? 0;
    }

    result.totalCustomsValue = roundTo2Decimals(result.totalCustomsValue);
    result.totalDuty = roundTo2Decimals(result.totalDuty);
    result.totalVat = roundTo2Decimals(result.totalVat);
    result.totalExcise = roundTo2Decimals(result.totalExcise);
    result.totalFee = roundTo2Decimals(result.totalFee);
    result.grandTotal = roundTo2Decimals(
      result.totalDuty + result.totalVat + result.totalExcise + result.totalFee
    );

    return result;
  }

  /**
   * Получает ставки пошлин для HS кода
   */
  static async getDutyRates(hsCode: string): Promise<{
    dutyRate: number;
    vatRate: number;
    exciseRate: number;
  } | null> {
    const hsCodeData = await prisma.hSCode.findFirst({
      where: {
        code: hsCode,
        isActive: true,
      },
    });

    if (!hsCodeData) {
      return null;
    }

    return {
      dutyRate: hsCodeData.dutyRate ? Number(hsCodeData.dutyRate) : 15,
      vatRate: hsCodeData.vatRate ? Number(hsCodeData.vatRate) : 12,
      exciseRate: hsCodeData.exciseRate ? Number(hsCodeData.exciseRate) : 0,
    };
  }

  /**
   * Проверяет преференциальный режим для страны
   */
  static getPreferentialRate(
    originCountry: string,
    baseRate: number
  ): { rate: number; preferenceType: string } {
    if (FREE_TRADE_COUNTRIES.includes(originCountry)) {
      return { rate: 0, preferenceType: 'EAEU' };
    }
    if (PREFERENTIAL_COUNTRIES.includes(originCountry)) {
      return { rate: baseRate * 0.75, preferenceType: 'CIS' };
    }
    return { rate: baseRate, preferenceType: 'MFN' }; // Most Favored Nation
  }

  /**
   * Конвертирует сумму в сумы по текущему курсу
   */
  static async convertToUZS(amount: number, currency: string): Promise<number> {
    if (currency === 'UZS') {
      return amount;
    }

    // Получаем курс из БД
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        currencyCode: currency,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (!exchangeRate) {
      // Если курс не найден, возвращаем примерные значения
      const fallbackRates: Record<string, number> = {
        USD: 12500,
        EUR: 13500,
        RUB: 140,
        CNY: 1750,
        GBP: 15800,
        JPY: 85,
        KZT: 28,
      };
      const rate = fallbackRates[currency] ?? 12500;
      return roundTo2Decimals(amount * rate);
    }

    return roundTo2Decimals(amount * Number(exchangeRate.rate));
  }

  /**
   * Рассчитывает статистическую стоимость
   */
  static calculateStatisticalValue(
    customsValue: number,
    transportCosts?: number,
    insuranceCosts?: number
  ): number {
    // Статистическая стоимость = таможенная стоимость + транспорт + страховка
    const transport = transportCosts ?? 0;
    const insurance = insuranceCosts ?? 0;
    return roundTo2Decimals(customsValue + transport + insurance);
  }
}
