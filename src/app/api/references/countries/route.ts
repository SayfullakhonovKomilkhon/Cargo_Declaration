import { NextResponse } from 'next/server';

import { prisma } from '@/server/db/client';

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        nameRu: 'asc',
      },
      select: {
        code: true,
        nameEn: true,
        nameRu: true,
        nameUz: true,
      },
    });

    return NextResponse.json(countries, {
      headers: {
        // Кешируем на 1 час (стабильные данные)
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ error: 'Ошибка загрузки стран' }, { status: 500 });
  }
}
