import { NextResponse } from 'next/server';

import { prisma } from '@/server/db/client';

export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
      select: {
        code: true,
        name: true,
        symbol: true,
      },
    });

    return NextResponse.json(currencies, {
      headers: {
        // Кешируем на 1 час (стабильные данные)
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ error: 'Ошибка загрузки валют' }, { status: 500 });
  }
}

// API для получения текущего курса валюты
export async function POST(request: Request) {
  try {
    const { currencyCode } = await request.json();

    if (!currencyCode) {
      return NextResponse.json({ error: 'Код валюты обязателен' }, { status: 400 });
    }

    // Получаем последний курс из БД
    const latestRate = await prisma.exchangeRate.findFirst({
      where: {
        currencyCode: currencyCode,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        rate: true,
        date: true,
      },
    });

    if (!latestRate) {
      // Если курса нет в БД, пробуем получить от ЦБ Узбекистана
      const cbuRate = await fetchCBURate(currencyCode);
      if (cbuRate) {
        return NextResponse.json({
          rate: cbuRate.rate,
          date: cbuRate.date,
          source: 'cbu',
        });
      }

      return NextResponse.json({ error: 'Курс валюты не найден' }, { status: 404 });
    }

    return NextResponse.json({
      rate: latestRate.rate,
      date: latestRate.date,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ error: 'Ошибка получения курса валюты' }, { status: 500 });
  }
}

// Функция для получения курса от ЦБ Узбекистана
async function fetchCBURate(currencyCode: string): Promise<{ rate: number; date: Date } | null> {
  try {
    const response = await fetch(
      `https://cbu.uz/ru/arkhiv-kursov-valyut/json/${currencyCode}/`,
      {
        next: { revalidate: 3600 }, // Кешируем на 1 час
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        rate: parseFloat(data[0].Rate),
        date: new Date(data[0].Date),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching CBU rate:', error);
    return null;
  }
}
