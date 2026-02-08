/**
 * GTD Data Adapter
 * 
 * Преобразует данные из формы ГТД в формат, используемый PDF генератором.
 */

import type { TD1Data, ItemData } from './gtd-pdf-template.service';

/**
 * Справочник кодов стран для преобразования в названия
 */
const COUNTRY_NAMES: Record<string, string> = {
  'AU': 'АВСТРАЛИЯ', 'AT': 'АВСТРИЯ', 'AZ': 'АЗЕРБАЙДЖАН', 'AL': 'АЛБАНИЯ',
  'DZ': 'АЛЖИР', 'AO': 'АНГОЛА', 'AD': 'АНДОРРА', 'AR': 'АРГЕНТИНА',
  'AM': 'АРМЕНИЯ', 'AF': 'АФГАНИСТАН', 'BD': 'БАНГЛАДЕШ', 'BY': 'БЕЛАРУСЬ',
  'BE': 'БЕЛЬГИЯ', 'BG': 'БОЛГАРИЯ', 'BO': 'БОЛИВИЯ', 'BA': 'БОСНИЯ И ГЕРЦЕГОВИНА',
  'BR': 'БРАЗИЛИЯ', 'BN': 'БРУНЕЙ', 'GB': 'ВЕЛИКОБРИТАНИЯ', 'HU': 'ВЕНГРИЯ',
  'VE': 'ВЕНЕСУЭЛА', 'VN': 'ВЬЕТНАМ', 'DE': 'ГЕРМАНИЯ', 'GH': 'ГАНА',
  'GT': 'ГВАТЕМАЛА', 'GN': 'ГВИНЕЯ', 'HK': 'ГОНКОНГ', 'GR': 'ГРЕЦИЯ',
  'GE': 'ГРУЗИЯ', 'DK': 'ДАНИЯ', 'DO': 'ДОМИНИКАНСКАЯ РЕСПУБЛИКА', 'EG': 'ЕГИПЕТ',
  'ZM': 'ЗАМБИЯ', 'ZW': 'ЗИМБАБВЕ', 'IL': 'ИЗРАИЛЬ', 'IN': 'ИНДИЯ',
  'ID': 'ИНДОНЕЗИЯ', 'JO': 'ИОРДАНИЯ', 'IQ': 'ИРАК', 'IR': 'ИРАН',
  'IE': 'ИРЛАНДИЯ', 'IS': 'ИСЛАНДИЯ', 'ES': 'ИСПАНИЯ', 'IT': 'ИТАЛИЯ',
  'YE': 'ЙЕМЕН', 'KZ': 'КАЗАХСТАН', 'KH': 'КАМБОДЖА', 'CM': 'КАМЕРУН',
  'CA': 'КАНАДА', 'QA': 'КАТАР', 'KE': 'КЕНИЯ', 'CY': 'КИПР',
  'KG': 'КЫРГЫЗСТАН', 'CN': 'КИТАЙ', 'KP': 'КНДР', 'KR': 'РЕСПУБЛИКА КОРЕЯ',
  'CO': 'КОЛУМБИЯ', 'CU': 'КУБА', 'KW': 'КУВЕЙТ', 'LA': 'ЛАОС',
  'LV': 'ЛАТВИЯ', 'LB': 'ЛИВАН', 'LY': 'ЛИВИЯ', 'LT': 'ЛИТВА',
  'LU': 'ЛЮКСЕМБУРГ', 'MK': 'СЕВЕРНАЯ МАКЕДОНИЯ', 'MY': 'МАЛАЙЗИЯ', 'MV': 'МАЛЬДИВЫ',
  'MT': 'МАЛЬТА', 'MA': 'МАРОККО', 'MX': 'МЕКСИКА', 'MZ': 'МОЗАМБИК',
  'MD': 'МОЛДОВА', 'MN': 'МОНГОЛИЯ', 'MM': 'МЬЯНМА', 'NP': 'НЕПАЛ',
  'NE': 'НИГЕР', 'NG': 'НИГЕРИЯ', 'NL': 'НИДЕРЛАНДЫ', 'NZ': 'НОВАЯ ЗЕЛАНДИЯ',
  'NO': 'НОРВЕГИЯ', 'AE': 'ОАЭ', 'OM': 'ОМАН', 'PK': 'ПАКИСТАН',
  'PA': 'ПАНАМА', 'PG': 'ПАПУА-НОВАЯ ГВИНЕЯ', 'PY': 'ПАРАГВАЙ', 'PE': 'ПЕРУ',
  'PL': 'ПОЛЬША', 'PT': 'ПОРТУГАЛИЯ', 'PR': 'ПУЭРТО-РИКО', 'RU': 'РОССИЯ',
  'RO': 'РУМЫНИЯ', 'SA': 'САУДОВСКАЯ АРАВИЯ', 'SG': 'СИНГАПУР', 'SY': 'СИРИЯ',
  'SK': 'СЛОВАКИЯ', 'SI': 'СЛОВЕНИЯ', 'SO': 'СОМАЛИ', 'SD': 'СУДАН',
  'US': 'США', 'TJ': 'ТАДЖИКИСТАН', 'TH': 'ТАИЛАНД', 'TW': 'ТАЙВАНЬ',
  'TZ': 'ТАНЗАНИЯ', 'TN': 'ТУНИС', 'TM': 'ТУРКМЕНИСТАН', 'TR': 'ТУРЦИЯ',
  'UG': 'УГАНДА', 'UZ': 'УЗБЕКИСТАН', 'UA': 'УКРАИНА', 'UY': 'УРУГВАЙ',
  'PH': 'ФИЛИППИНЫ', 'FI': 'ФИНЛЯНДИЯ', 'FR': 'ФРАНЦИЯ', 'HR': 'ХОРВАТИЯ',
  'CF': 'ЦАР', 'TD': 'ЧАД', 'CZ': 'ЧЕХИЯ', 'CL': 'ЧИЛИ',
  'CH': 'ШВЕЙЦАРИЯ', 'SE': 'ШВЕЦИЯ', 'LK': 'ШРИ-ЛАНКА', 'EC': 'ЭКВАДОР',
  'GQ': 'ЭКВАТОРИАЛЬНАЯ ГВИНЕЯ', 'EE': 'ЭСТОНИЯ', 'ET': 'ЭФИОПИЯ', 'ZA': 'ЮАР',
  'JM': 'ЯМАЙКА', 'JP': 'ЯПОНИЯ',
};

/**
 * Получить название страны по ISO коду
 */
function getCountryName(code: string | null | undefined): string | undefined {
  if (!code) return undefined;
  const upperCode = code.toUpperCase().trim();
  return COUNTRY_NAMES[upperCode] || upperCode;
}

/**
 * Данные формы GTD (из базы данных или формы)
 */
export interface GTDFormData {
  // Общие сведения
  id?: string;
  declarationNumber?: string;
  declarationType?: string;
  customsRegimeCode?: string;
  
  // Экспортёр (блок 2)
  exporterName?: string;
  exporterAddress?: string;
  exporterTin?: string;
  exporterCountry?: string;
  
  // Получатель (блок 8)
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeTin?: string;
  
  // Финансово ответственный (блок 9)
  financialResponsibleName?: string;
  financialResponsibleTin?: string;
  
  // Декларант (блок 14)
  declarantName?: string;
  declarantAddress?: string;
  declarantTin?: string;
  
  // Страны
  dispatchCountry?: string;
  dispatchCountryCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  tradingCountry?: string;
  tradingCountryCode?: string;
  
  // Транспорт
  transportCount?: number;
  departureTransportType?: string;
  departureTransportNumber?: string;
  transportNationality?: string;
  borderTransportMode?: string;
  inlandTransportMode?: string;
  containerIndicator?: string;
  
  // Условия поставки
  incotermsCode?: string;
  deliveryPlace?: string;
  loadingPlace?: string;
  
  // Финансы
  currency?: string;
  totalInvoiceAmount?: number;
  exchangeRate?: number;
  totalCustomsValue?: number;
  transactionNature?: string;
  transactionCurrencyCode?: string;
  
  // Таможенные посты
  entryCustomsOffice?: string;
  exitCustomsOffice?: string;
  goodsLocation?: string;
  
  // Банк
  bankDetails?: string;
  
  // Итоги
  totalItems?: number;
  totalPackages?: number;
  totalGrossWeight?: number;
  totalNetWeight?: number;
  
  // Товары
  items?: GTDItemData[];
  
  // Подпись
  declarationPlace?: string;
  declarationDate?: string | Date;
  signatoryName?: string;
  signatoryPhone?: string;
  
  // Прочее
  additionalSheets?: number;
  principalName?: string;
}

/**
 * Данные товарной позиции из формы
 */
export interface GTDItemData {
  itemNumber?: number;
  hsCode?: string;
  goodsDescription?: string;
  marksNumbers?: string;
  packageType?: string;
  packageQuantity?: number;
  originCountry?: string;
  originCountryCode?: string;
  grossWeight?: number;
  netWeight?: number;
  supplementaryQuantity?: number;
  supplementaryUnit?: string;
  
  // Процедура
  procedureCode?: string;
  previousProcedureCode?: string;
  movementCode?: string;
  previousDocument?: string;
  quotaNumber?: string;
  preferenceCode?: string;
  
  // Стоимость
  itemPrice?: number;
  customsValue?: number;
  statisticalValue?: number;
  valuationMethodCode?: string;
  additionalInfo?: string;
  
  // Платежи
  dutyType?: string;
  dutyBase?: number;
  dutyRate?: number | string;
  dutyAmount?: number;
  vatType?: string;
  vatBase?: number;
  vatRate?: number | string;
  vatAmount?: number;
  feeType?: string;
  feeBase?: number;
  feeRate?: number | string;
  feeAmount?: number;
  totalPayment?: number;
}

/**
 * Справочник кодов типов деклараций
 */
const DECLARATION_TYPE_CODES: Record<string, string> = {
  'ИМ': 'Импорт',
  'ЭК': 'Экспорт',
  'ТР': 'Транзит',
  'ВТ': 'Внутренний транзит',
  'ПВ': 'Переработка вне таможенной территории',
  'ПП': 'Переработка на таможенной территории',
};

/**
 * Форматирование даты
 */
function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Форматирование ставки пошлины
 */
function formatRate(rate: number | string | undefined): string {
  if (rate === undefined || rate === null) return '';
  
  if (typeof rate === 'string') return rate;
  
  if (rate === 0) return '0%';
  
  return `${rate}%`;
}

/**
 * Преобразование данных товара
 */
function adaptItemData(item: GTDItemData, index: number): ItemData {
  return {
    itemNumber: item.itemNumber || index + 1,
    hsCode: item.hsCode,
    goodsDescription: item.goodsDescription,
    marksNumbers: item.marksNumbers,
    packageType: item.packageType,
    packageQuantity: item.packageQuantity,
    originCountryCode: item.originCountryCode || item.originCountry,
    grossWeight: item.grossWeight,
    netWeight: item.netWeight,
    supplementaryQuantity: item.supplementaryQuantity,
    supplementaryUnit: item.supplementaryUnit,
    
    procedureCode: item.procedureCode,
    previousProcedureCode: item.previousProcedureCode,
    movementCode: item.movementCode,
    previousDocument: item.previousDocument,
    quotaNumber: item.quotaNumber,
    preferenceCode: item.preferenceCode,
    
    itemPrice: item.itemPrice,
    customsValue: item.customsValue,
    statisticalValue: item.statisticalValue,
    valuationMethodCode: item.valuationMethodCode || '1',
    additionalInfo: item.additionalInfo,
    
    // Платежи
    dutyType: item.dutyType || '20',
    dutyBase: item.dutyBase || item.customsValue,
    dutyRate: formatRate(item.dutyRate),
    dutyAmount: item.dutyAmount,
    dutyPaymentMethod: 'НТ',
    
    vatType: item.vatType || '70',
    vatBase: item.vatBase || (item.customsValue && item.dutyAmount 
      ? item.customsValue + item.dutyAmount 
      : item.customsValue),
    vatRate: formatRate(item.vatRate || 12),
    vatAmount: item.vatAmount,
    vatPaymentMethod: 'НТ',
    
    feeType: item.feeType || '10',
    feeBase: item.feeBase,
    feeRate: formatRate(item.feeRate),
    feeAmount: item.feeAmount,
    feePaymentMethod: 'НТ',
    
    totalPayment: item.totalPayment || 
      ((item.dutyAmount || 0) + (item.vatAmount || 0) + (item.feeAmount || 0)),
  };
}

/**
 * Преобразование данных формы в формат TD1Data для PDF генератора
 */
export function adaptFormDataToTD1(formData: GTDFormData): { td1Data: TD1Data; additionalItems: ItemData[] } {
  const items = formData.items || [];
  const firstItem = items[0];
  const additionalItems = items.slice(1).map((item, idx) => adaptItemData(item, idx + 1));
  
  // Определяем тип декларации
  let declarationType = formData.declarationType || 'ИМ';
  if (formData.customsRegimeCode) {
    // Извлекаем аббревиатуру из кода режима
    const typeAbbr = Object.keys(DECLARATION_TYPE_CODES).find(key => 
      formData.declarationType?.includes(key) || formData.customsRegimeCode?.startsWith(key)
    );
    if (typeAbbr) {
      declarationType = typeAbbr;
    }
  }
  
  const td1Data: TD1Data = {
    // Блок 1 - Тип декларации
    declarationType: declarationType,
    declarationTypeCode: formData.customsRegimeCode,
    
    // Блок 2 - Экспортер
    exporterName: formData.exporterName,
    exporterAddress: formData.exporterAddress,
    exporterTin: formData.exporterTin,
    exporterCountryCode: formData.exporterCountry,
    
    // Блоки 3-7
    additionalSheets: additionalItems.length > 0 ? Math.ceil(additionalItems.length / 3) : 0,
    totalItems: formData.totalItems || items.length,
    totalPackages: formData.totalPackages,
    declarationNumber: formData.declarationNumber,
    declarationDate: formatDate(formData.declarationDate),
    
    // Блок 8 - Получатель
    consigneeName: formData.consigneeName,
    consigneeAddress: formData.consigneeAddress,
    consigneeTin: formData.consigneeTin,
    
    // Блок 9
    financialResponsibleName: formData.financialResponsibleName,
    financialResponsibleTin: formData.financialResponsibleTin,
    
    // Блоки 10-13
    tradingCountry: formData.tradingCountry,
    tradingCountryCode: formData.tradingCountryCode,
    totalCustomsValue: formData.totalCustomsValue,
    totalCustomsValueCurrency: formData.currency,
    
    // Блок 14 - Декларант
    declarantName: formData.declarantName,
    declarantAddress: formData.declarantAddress,
    declarantTin: formData.declarantTin,
    
    // Блоки 15-17
    dispatchCountry: formData.dispatchCountry,
    dispatchCountryCode: formData.dispatchCountryCode,
    originCountry: formData.originCountry,
    destinationCountry: formData.destinationCountry,
    destinationCountryCode: formData.destinationCountryCode,
    
    // Блок 18 - Транспорт
    transportCount: formData.transportCount || 1,
    departureTransportType: formData.departureTransportType,
    departureTransportNumber: formData.departureTransportNumber,
    transportNationality: formData.transportNationality,
    
    // Блоки 19-28
    containerIndicator: formData.containerIndicator,
    incotermsCode: formData.incotermsCode,
    deliveryPlace: formData.deliveryPlace,
    currency: formData.currency,
    totalInvoiceAmount: formData.totalInvoiceAmount,
    exchangeRate: formData.exchangeRate,
    transactionNature: formData.transactionNature,
    transactionCurrencyCode: formData.transactionCurrencyCode,
    borderTransportMode: formData.borderTransportMode,
    inlandTransportMode: formData.inlandTransportMode,
    loadingPlace: formData.loadingPlace,
    bankDetails: formData.bankDetails,
    
    // Блоки 29-30
    entryCustomsOffice: formData.entryCustomsOffice,
    goodsLocation: formData.goodsLocation,
    
    // Первый товар
    firstItem: firstItem ? adaptItemData(firstItem, 0) : undefined,
    
    // Блоки 50-54
    principalName: formData.principalName,
    exitCustomsOffice: formData.exitCustomsOffice,
    declarationPlace: formData.declarationPlace,
    signatoryName: formData.signatoryName,
    signatoryPhone: formData.signatoryPhone,
  };
  
  return { td1Data, additionalItems };
}

/**
 * Преобразование данных из Prisma модели в GTDFormData
 * Берёт данные напрямую из колонок таблицы Declaration
 */
export function adaptPrismaToFormData(prismaData: Record<string, unknown>): GTDFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = prismaData as any;
  
  // Debug: log incoming Prisma data
  console.log('=== adaptPrismaToFormData DEBUG ===');
  console.log('Prisma data keys:', Object.keys(data));
  console.log('Key values:', {
    exporterName: data.exporterName,
    consigneeName: data.consigneeName,
    departureCountryCode: data.departureCountryCode,
    destinationCountryCode: data.destinationCountryCode,
    tradingCountryCode: data.tradingCountryCode,
    totalCustomsValue: data.totalCustomsValue,
    itemsCount: data.items?.length || 0,
  });
  console.log('===================================');
  
  // Товарные позиции из связанной таблицы DeclarationItem
  const declarationItems = data.items || [];
  const items: GTDItemData[] = declarationItems.map((item: Record<string, unknown>) => ({
    itemNumber: item.itemNumber,
    description: item.goodsDescription,
    goodsDescription: item.goodsDescription,
    marksNumbers: item.marksAndNumbers,
    packageType: item.packagingType,
    packageQuantity: item.packagingQuantity,
    hsCode: item.hsCode,
    hsDescription: item.hsCodeDescription,
    originCountryCode: item.originCountryCode,
    grossWeight: item.grossWeight,
    netWeight: item.netWeight,
    preferenceCode: item.preferenceCode,
    procedureCode: item.procedureCode,
    previousProcedureCode: item.previousProcedureCode,
    quotaNumber: item.quotaNumber,
    supplementaryUnit: item.supplementaryUnit,
    supplementaryQuantity: item.supplementaryQuantity,
    itemPrice: item.itemPrice,
    itemCurrencyCode: item.itemCurrencyCode,
    valuationMethodCode: item.valuationMethodCode,
    additionalInfo: item.additionalInfo,
    customsValue: item.customsValue,
    statisticalValue: item.statisticalValue,
    dutyRate: item.dutyRate,
    dutyAmount: item.dutyAmount,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    exciseRate: item.exciseRate,
    exciseAmount: item.exciseAmount,
    feeAmount: item.feeAmount,
    totalPayment: item.totalPayment,
  }));

  // Вычисляем общий вес из товаров
  const totalGrossWeight = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalNetWeight = items.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
  
  return {
    id: data.id,
    declarationNumber: data.declarationNumber,
    declarationType: data.type,
    customsRegimeCode: data.customsRegimeCode,
    
    // Блок 2: Экспортер
    exporterName: data.exporterName,
    exporterAddress: data.exporterAddress,
    exporterTin: data.exporterInn,
    exporterCountry: data.exporterCountryCode,
    
    // Блок 8: Получатель
    consigneeName: data.consigneeName,
    consigneeAddress: data.consigneeAddress,
    consigneeTin: data.consigneeInn,
    
    // Блок 9: Финансово ответственный
    financialResponsibleName: data.financialResponsible,
    financialResponsibleTin: null, // Не хранится отдельно
    
    // Блок 14: Декларант
    declarantName: data.declarantName,
    declarantAddress: data.declarantAddress,
    declarantTin: data.declarantInn,
    
    // Блоки 15-17: Страны (преобразуем коды в названия)
    dispatchCountry: getCountryName(data.departureCountryCode) || data.departureCountryName,
    dispatchCountryCode: data.departureCountryCode,
    originCountry: getCountryName(data.originCountryCode),
    destinationCountry: getCountryName(data.destinationCountryCode),
    destinationCountryCode: data.destinationCountryCode,
    tradingCountry: getCountryName(data.tradingCountryCode),
    tradingCountryCode: data.tradingCountryCode,
    
    // Блок 18: Транспорт
    transportCount: 1,
    departureTransportType: data.departureTransportMode,
    departureTransportNumber: data.departureTransportNumber,
    transportNationality: data.departureTransportCountry,
    borderTransportMode: data.borderTransportMode,
    inlandTransportMode: data.inlandTransportModeCode,
    containerIndicator: data.containerIndicator,
    
    // Блок 20: Условия поставки
    incotermsCode: data.deliveryTermsCode,
    deliveryPlace: data.deliveryTermsPlace,
    loadingPlace: data.loadingPlace,
    
    // Блоки 22-24: Валюта и стоимость
    currency: data.invoiceCurrencyCode,
    totalInvoiceAmount: data.totalInvoiceAmount ? Number(data.totalInvoiceAmount) : undefined,
    exchangeRate: data.exchangeRate ? Number(data.exchangeRate) : undefined,
    totalCustomsValue: data.totalCustomsValue ? Number(data.totalCustomsValue) : undefined,
    transactionNature: data.transactionNatureCode,
    transactionCurrencyCode: data.transactionCurrencyCode,
    
    // Блоки 29-30: Таможенные органы
    entryCustomsOffice: data.entryCustomsOffice,
    exitCustomsOffice: data.exitCustomsOffice,
    goodsLocation: data.goodsLocation,
    
    // Другие поля
    bankDetails: data.bankDetails,
    
    // Итоговые значения
    totalItems: data.totalItems || items.length,
    totalPackages: data.totalPackages,
    totalGrossWeight: totalGrossWeight || undefined,
    totalNetWeight: totalNetWeight || undefined,
    
    // Товарные позиции
    items: items,
    
    // Блоки 54: Подпись
    declarationPlace: data.declarationPlace,
    declarationDate: data.declarationDate || data.createdAt,
    signatoryName: data.signatoryName,
    signatoryPhone: data.signatoryPhone,
    
    additionalSheets: data.additionalSheets,
    principalName: data.principalName,
  };
}

export default {
  adaptFormDataToTD1,
  adaptPrismaToFormData,
};
