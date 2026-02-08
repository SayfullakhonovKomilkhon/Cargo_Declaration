import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Если нет поискового запроса, возвращаем популярные коды
    if (!search || search.length < 2) {
      const popularCodes = await prisma.hSCode.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { code: 'asc' },
        select: {
          code: true,
          description: true,
          descriptionUz: true,
          unit: true,
          dutyRate: true,
          vatRate: true,
        },
      });

      return NextResponse.json(popularCodes);
    }

    // Поиск по коду или описанию
    const hsCodes = await prisma.hSCode.findMany({
      where: {
        isActive: true,
        OR: [
          {
            code: {
              startsWith: search,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            descriptionUz: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: limit,
      orderBy: [
        // Сначала точные совпадения по коду
        {
          code: 'asc',
        },
      ],
      select: {
        code: true,
        description: true,
        descriptionUz: true,
        unit: true,
        supplementaryUnit: true,
        dutyRate: true,
        vatRate: true,
        exciseRate: true,
      },
    });

    return NextResponse.json(hsCodes, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error searching HS codes:', error);
    return NextResponse.json(
      { error: 'Ошибка поиска кодов ТН ВЭД' },
      { status: 500 }
    );
  }
}

// Получение конкретного HS кода по полному коду
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: 'Укажите код ТН ВЭД (минимум 4 цифры)' },
        { status: 400 }
      );
    }

    const hsCode = await prisma.hSCode.findUnique({
      where: { code },
      select: {
        code: true,
        description: true,
        descriptionUz: true,
        unit: true,
        supplementaryUnit: true,
        dutyRate: true,
        vatRate: true,
        exciseRate: true,
      },
    });

    if (!hsCode) {
      return NextResponse.json(
        { error: `Код ТН ВЭД ${code} не найден` },
        { status: 404 }
      );
    }

    return NextResponse.json(hsCode);
  } catch (error) {
    console.error('Error fetching HS code:', error);
    return NextResponse.json(
      { error: 'Ошибка получения кода ТН ВЭД' },
      { status: 500 }
    );
  }
}
