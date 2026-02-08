import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const regionCode = searchParams.get('region');

    const whereClause: {
      isActive: boolean;
      regionCode?: string;
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; code?: { startsWith: string } }>;
    } = {
      isActive: true,
    };

    if (regionCode) {
      whereClause.regionCode = regionCode;
    }

    if (search && search.length >= 2) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { startsWith: search } },
      ];
    }

    const customsOffices = await prisma.customsOffice.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        code: true,
        name: true,
        nameUz: true,
        address: true,
        regionCode: true,
      },
    });

    return NextResponse.json(customsOffices, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching customs offices:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки таможенных органов' },
      { status: 500 }
    );
  }
}
