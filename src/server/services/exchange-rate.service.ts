import { prisma } from '@/server/db/client';
import { format } from 'date-fns';

interface CBURate {
  id: string;
  Code: string;
  Ccy: string;
  CcyNm_RU: string;
  CcyNm_UZ: string;
  CcyNm_UZC: string;
  CcyNm_EN: string;
  Nominal: string;
  Rate: string;
  Diff: string;
  Date: string;
}

interface ExchangeRateResult {
  currency: string;
  rate: number;
  date: Date;
  source: 'database' | 'cbu';
}

/**
 * Сервис для работы с курсами валют ЦБ Узбекистана
 */
export class ExchangeRateService {
  /**
   * Получить курс валюты на указанную дату
   */
  static async fetchExchangeRate(
    currencyCode: string,
    date?: Date
  ): Promise<ExchangeRateResult | null> {
    const targetDate = date || new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // 1. Проверяем кеш в БД
    const cachedRate = await prisma.exchangeRate.findFirst({
      where: {
        currencyCode: currencyCode.toUpperCase(),
        date: {
          equals: new Date(dateStr),
        },
      },
    });

    if (cachedRate) {
      return {
        currency: cachedRate.currencyCode,
        rate: Number(cachedRate.rate),
        date: cachedRate.date,
        source: 'database',
      };
    }

    // 2. Запрос к API ЦБ Узбекистана
    try {
      const cbuRate = await this.fetchFromCBU(currencyCode, targetDate);

      if (cbuRate) {
        // 3. Сохраняем в кеш
        await prisma.exchangeRate.upsert({
          where: {
            currencyCode_date: {
              currencyCode: currencyCode.toUpperCase(),
              date: new Date(dateStr),
            },
          },
          update: {
            rate: cbuRate.rate,
          },
          create: {
            currencyCode: currencyCode.toUpperCase(),
            rate: cbuRate.rate,
            date: new Date(dateStr),
          },
        });

        return {
          currency: currencyCode.toUpperCase(),
          rate: cbuRate.rate,
          date: new Date(dateStr),
          source: 'cbu',
        };
      }
    } catch (error) {
      console.error('Error fetching from CBU:', error);
    }

    // 4. Если не удалось получить текущий курс, ищем последний известный
    const latestRate = await prisma.exchangeRate.findFirst({
      where: {
        currencyCode: currencyCode.toUpperCase(),
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (latestRate) {
      return {
        currency: latestRate.currencyCode,
        rate: Number(latestRate.rate),
        date: latestRate.date,
        source: 'database',
      };
    }

    return null;
  }

  /**
   * Получить последний курс валюты (на сегодня)
   */
  static async getLatestRate(currencyCode: string): Promise<ExchangeRateResult | null> {
    return this.fetchExchangeRate(currencyCode);
  }

  /**
   * Запрос к API ЦБ Узбекистана
   */
  private static async fetchFromCBU(
    currencyCode: string,
    date: Date
  ): Promise<{ rate: number; date: Date } | null> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const url = `https://cbu.uz/uz/arkhiv-kursov-valyut/json/${currencyCode.toUpperCase()}/${dateStr}/`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        next: { revalidate: 3600 }, // Кешируем на 1 час
      });

      if (!response.ok) {
        // Попробуем без даты (текущий курс)
        const fallbackUrl = `https://cbu.uz/uz/arkhiv-kursov-valyut/json/${currencyCode.toUpperCase()}/`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!fallbackResponse.ok) {
          return null;
        }

        const data = (await fallbackResponse.json()) as CBURate[];
        const firstItem = data?.[0];
        if (firstItem) {
          return {
            rate: parseFloat(firstItem.Rate),
            date: new Date(firstItem.Date),
          };
        }
        return null;
      }

      const data = (await response.json()) as CBURate[];
      const firstItem = data?.[0];

      if (firstItem) {
        return {
          rate: parseFloat(firstItem.Rate),
          date: new Date(firstItem.Date),
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching CBU rate:', error);
      return null;
    }
  }

  /**
   * Получить курсы для нескольких валют
   */
  static async fetchMultipleRates(
    currencies: string[]
  ): Promise<Map<string, ExchangeRateResult>> {
    const results = new Map<string, ExchangeRateResult>();

    await Promise.all(
      currencies.map(async (currency) => {
        const rate = await this.getLatestRate(currency);
        if (rate) {
          results.set(currency.toUpperCase(), rate);
        }
      })
    );

    return results;
  }

  /**
   * Обновить все курсы валют в БД
   */
  static async updateAllRates(): Promise<number> {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      select: { code: true },
    });

    let updated = 0;

    for (const { code } of currencies) {
      try {
        const rate = await this.fetchFromCBU(code, new Date());
        if (rate) {
          await prisma.exchangeRate.upsert({
            where: {
              currencyCode_date: {
                currencyCode: code,
                date: new Date(format(new Date(), 'yyyy-MM-dd')),
              },
            },
            update: {
              rate: rate.rate,
            },
            create: {
              currencyCode: code,
              rate: rate.rate,
              date: new Date(format(new Date(), 'yyyy-MM-dd')),
            },
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error updating rate for ${code}:`, error);
      }
    }

    return updated;
  }
}

export default ExchangeRateService;
