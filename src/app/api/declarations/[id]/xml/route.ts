import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/declarations/[id]/xml
 * Export declaration to XML format for customs systems
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find declaration with all related data
    const declaration = await prisma.declaration.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
        organization: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!declaration) {
      return NextResponse.json({ error: 'Декларация не найдена' }, { status: 404 });
    }

    // Check access rights
    const hasAccess =
      session.user.role === 'ADMIN' ||
      declaration.userId === session.user.id ||
      (session.user.organizationId &&
        declaration.organizationId === session.user.organizationId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к декларации' }, { status: 403 });
    }

    // Generate XML
    const xml = generateDeclarationXML(declaration);
    const filename = `GTD-${declaration.declarationNumber || 'DRAFT'}-${format(new Date(), 'yyyy-MM-dd')}.xml`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('XML export error:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта в XML' },
      { status: 500 }
    );
  }
}

/**
 * Generate XML for customs declaration
 * Following a simplified customs XML schema
 */
function generateDeclarationXML(declaration: {
  id: string;
  declarationNumber: string | null;
  type: string;
  status: string;
  exporterName: string | null;
  exporterAddress: string | null;
  exporterCountryCode: string | null;
  consigneeName: string | null;
  consigneeAddress: string | null;
  consigneeInn: string | null;
  consigneeCountryCode: string | null;
  declarantName: string | null;
  declarantAddress: string | null;
  declarantInn: string | null;
  totalCustomsValue: unknown;
  invoiceCurrencyCode: string | null;
  totalInvoiceAmount: unknown;
  exchangeRate: unknown;
  deliveryTermsCode: string | null;
  deliveryTermsPlace: string | null;
  departureCountryCode: string | null;
  originCountryCode: string | null;
  tradingCountryCode: string | null;
  totalGrossWeight: unknown;
  totalNetWeight: unknown;
  totalPackages: number | null;
  containerNumbers: string[];
  totalDutyAmount: unknown;
  totalVatAmount: unknown;
  totalExciseAmount: unknown;
  totalFeeAmount: unknown;
  totalPaymentAmount: unknown;
  declarationDate: Date | null;
  declarationPlace: string | null;
  entryCustomsOffice: string | null;
  goodsLocation: string | null;
  createdAt: Date;
  items: Array<{
    itemNumber: number;
    goodsDescription: string | null;
    hsCode: string | null;
    originCountryCode: string | null;
    grossWeight: unknown;
    netWeight: unknown;
    customsValue: unknown;
    itemPrice: unknown;
    dutyRate: unknown;
    dutyAmount: unknown;
    vatRate: unknown;
    vatAmount: unknown;
    exciseAmount: unknown;
    totalPayment: unknown;
    packagingQuantity: number | null;
    packagingType: string | null;
  }>;
  organization: { name: string; inn: string; address: string | null } | null;
}): string {
  const escapeXml = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatDecimal = (value: unknown): string => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'object' ? Number(value) : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatWeight = (value: unknown): string => {
    if (value === null || value === undefined) return '0.000';
    const num = typeof value === 'object' ? Number(value) : Number(value);
    return isNaN(num) ? '0.000' : num.toFixed(3);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  const itemsXml = declaration.items
    .map(
      (item) => `
    <Item>
      <ItemNumber>${item.itemNumber}</ItemNumber>
      <Description>${escapeXml(item.goodsDescription)}</Description>
      <HSCode>${escapeXml(item.hsCode)}</HSCode>
      <OriginCountry>${escapeXml(item.originCountryCode)}</OriginCountry>
      <GrossWeight unit="KG">${formatWeight(item.grossWeight)}</GrossWeight>
      <NetWeight unit="KG">${formatWeight(item.netWeight)}</NetWeight>
      <CustomsValue>${formatDecimal(item.customsValue)}</CustomsValue>
      <ItemPrice>${formatDecimal(item.itemPrice)}</ItemPrice>
      <Duties>
        <DutyRate>${formatDecimal(item.dutyRate)}</DutyRate>
        <DutyAmount>${formatDecimal(item.dutyAmount)}</DutyAmount>
        <VATRate>${formatDecimal(item.vatRate)}</VATRate>
        <VATAmount>${formatDecimal(item.vatAmount)}</VATAmount>
        <ExciseAmount>${formatDecimal(item.exciseAmount)}</ExciseAmount>
        <TotalPayment>${formatDecimal(item.totalPayment)}</TotalPayment>
      </Duties>
      <Packaging>
        <Quantity>${item.packagingQuantity || 0}</Quantity>
        <Type>${escapeXml(item.packagingType)}</Type>
      </Packaging>
    </Item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomsDeclaration xmlns="http://customs.uz/gtd/v1" version="1.0">
  <Header>
    <DeclarationNumber>${escapeXml(declaration.declarationNumber)}</DeclarationNumber>
    <DeclarationType>${declaration.type}</DeclarationType>
    <Status>${declaration.status}</Status>
    <CreatedAt>${formatDate(declaration.createdAt)}</CreatedAt>
    <DeclarationDate>${formatDate(declaration.declarationDate)}</DeclarationDate>
    <DeclarationPlace>${escapeXml(declaration.declarationPlace)}</DeclarationPlace>
  </Header>
  
  <Exporter>
    <Name>${escapeXml(declaration.exporterName)}</Name>
    <Address>${escapeXml(declaration.exporterAddress)}</Address>
    <Country>${escapeXml(declaration.exporterCountryCode)}</Country>
  </Exporter>
  
  <Consignee>
    <Name>${escapeXml(declaration.consigneeName)}</Name>
    <Address>${escapeXml(declaration.consigneeAddress)}</Address>
    <TIN>${escapeXml(declaration.consigneeInn)}</TIN>
    <Country>${escapeXml(declaration.consigneeCountryCode)}</Country>
  </Consignee>
  
  <Declarant>
    <Name>${escapeXml(declaration.declarantName || declaration.organization?.name)}</Name>
    <Address>${escapeXml(declaration.declarantAddress || declaration.organization?.address)}</Address>
    <TIN>${escapeXml(declaration.declarantInn || declaration.organization?.inn)}</TIN>
  </Declarant>
  
  <Financial>
    <TotalCustomsValue currency="${escapeXml(declaration.invoiceCurrencyCode) || 'USD'}">${formatDecimal(declaration.totalCustomsValue)}</TotalCustomsValue>
    <TotalInvoiceAmount currency="${escapeXml(declaration.invoiceCurrencyCode) || 'USD'}">${formatDecimal(declaration.totalInvoiceAmount)}</TotalInvoiceAmount>
    <ExchangeRate>${formatDecimal(declaration.exchangeRate)}</ExchangeRate>
    <DeliveryTerms>
      <Code>${escapeXml(declaration.deliveryTermsCode)}</Code>
      <Place>${escapeXml(declaration.deliveryTermsPlace)}</Place>
    </DeliveryTerms>
  </Financial>
  
  <Countries>
    <Departure>${escapeXml(declaration.departureCountryCode)}</Departure>
    <Origin>${escapeXml(declaration.originCountryCode)}</Origin>
    <Trading>${escapeXml(declaration.tradingCountryCode)}</Trading>
  </Countries>
  
  <Totals>
    <GrossWeight unit="KG">${formatWeight(declaration.totalGrossWeight)}</GrossWeight>
    <NetWeight unit="KG">${formatWeight(declaration.totalNetWeight)}</NetWeight>
    <Packages>${declaration.totalPackages || 0}</Packages>
    <ItemsCount>${declaration.items.length}</ItemsCount>
  </Totals>
  
  <Containers>
    ${declaration.containerNumbers.map((num) => `<Container>${escapeXml(num)}</Container>`).join('\n    ')}
  </Containers>
  
  <Customs>
    <EntryOffice>${escapeXml(declaration.entryCustomsOffice)}</EntryOffice>
    <GoodsLocation>${escapeXml(declaration.goodsLocation)}</GoodsLocation>
  </Customs>
  
  <Payments>
    <Duty>${formatDecimal(declaration.totalDutyAmount)}</Duty>
    <VAT>${formatDecimal(declaration.totalVatAmount)}</VAT>
    <Excise>${formatDecimal(declaration.totalExciseAmount)}</Excise>
    <Fee>${formatDecimal(declaration.totalFeeAmount)}</Fee>
    <Total>${formatDecimal(declaration.totalPaymentAmount)}</Total>
  </Payments>
  
  <Items>
    ${itemsXml}
  </Items>
</CustomsDeclaration>`;
}
