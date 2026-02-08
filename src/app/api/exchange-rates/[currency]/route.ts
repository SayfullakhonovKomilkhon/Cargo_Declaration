import { NextRequest, NextResponse } from 'next/server';

import { ExchangeRateService } from '@/server/services/exchange-rate.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;

    if (!currency || currency.length !== 3) {
      return NextResponse.json(
        { error: 'Неверный код валюты. Должен быть 3 символа (например: USD)' },
        { status: 400 }
      );
    }

    // Получаем дату из query params (опционально)
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : undefined;

    const rate = await ExchangeRateService.fetchExchangeRate(currency.toUpperCase(), date);

    if (!rate) {
      return NextResponse.json(
        { error: `Курс валюты ${currency.toUpperCase()} не найден` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      currency: rate.currency,
      rate: rate.rate,
      date: rate.date.toISOString().split('T')[0],
      source: rate.source,
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { error: 'Ошибка получения курса валюты' },
      { status: 500 }
    );
  }
}
