/**
 * Утилиты автозаполнения для режима ЭКСПОРТ (код 10)
 * Согласно Инструкции ГТК РУз №2773
 */

import type { ExportDeclarationDraft, ExportCommodityItem } from '../schemas/export-10.schema';
import {
  EXPORT_DIRECTION,
  EXPORT_REGIME_CODE,
  TRANSPORT_TYPE_MAP,
  INCOTERMS_MAP,
  PAYMENT_FORM_MAP,
  formatProcedureCode,
  roundValue,
  roundWeight,
  calculateStatisticalValue,
} from '../constants/export-constants';

// ===========================================
// ТИПЫ
// ===========================================

export interface AutofillContext {
  /** Курс USD к UZS */
  usdExchangeRate: number;
  /** Курс валюты контракта к UZS */
  contractCurrencyRate: number;
  /** Дата курса */
  exchangeRateDate: string;
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 1
// ===========================================

/**
 * Автозаполнение графы 1 для экспорта
 */
export function autofillGraph1(): ExportDeclarationDraft['graph1'] {
  return {
    direction: EXPORT_DIRECTION,
    regimeCode: EXPORT_REGIME_CODE,
    subCode: '',
  };
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 3
// ===========================================

/**
 * Автозаполнение графы 3 на основе количества товаров
 */
export function autofillGraph3(itemCount: number): ExportDeclarationDraft['graph3'] {
  // Один лист = до 3 товаров (основной)
  // Добавочный лист = до 3 товаров каждый
  const totalSheets = itemCount <= 3 ? 1 : Math.ceil((itemCount - 3) / 3) + 1;
  
  return {
    currentSheet: 1,
    totalSheets,
  };
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 11
// ===========================================

/**
 * Автозаполнение графы 11 из данных графы 9
 */
export function autofillGraph11(
  financialPartyCountryCode: string,
  isOffshore: boolean = false
): ExportDeclarationDraft['graph11'] {
  return {
    countryCode: financialPartyCountryCode,
    offshoreIndicator: isOffshore ? '1' : '2',
  };
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 12
// ===========================================

/**
 * Автозаполнение общей таможенной стоимости из товарных позиций
 */
export function autofillTotalCustomsValue(
  items: Partial<ExportCommodityItem>[]
): number {
  return roundValue(
    items.reduce((sum, item) => sum + (item?.customsValue || 0), 0)
  );
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 20
// ===========================================

/**
 * Автозаполнение условий поставки
 */
export function autofillGraph20(
  incotermsAlpha: string,
  deliveryPlace: string,
  paymentFormCode: string = '10',
  shippingFormCode: string = '01'
): ExportDeclarationDraft['graph20'] {
  // Найти цифровой код по буквенному
  const incoterm = Object.values(INCOTERMS_MAP).find(i => i.alpha === incotermsAlpha);
  
  return {
    incotermsCode: incoterm?.code || '',
    incotermsAlpha,
    deliveryPlace,
    paymentFormCode: paymentFormCode as '10' | '20' | '30' | '40' | '50' | '60' | '70' | '80',
    shippingFormCode: shippingFormCode as '01' | '02',
  };
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 22
// ===========================================

/**
 * Автозаполнение общей фактурной стоимости из товарных позиций
 */
export function autofillTotalInvoiceValue(
  items: Partial<ExportCommodityItem>[]
): number {
  return roundValue(
    items.reduce((sum, item) => sum + (item?.invoiceValue || 0), 0)
  );
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 23
// ===========================================

/**
 * Автозаполнение курса валюты
 */
export function autofillExchangeRate(
  currencyCode: string,
  rate: number,
  quantity: number = 1
): string {
  // Для некоторых валют курс указывается за 10, 100 или 1000 единиц
  const formattedRate = rate.toFixed(2).replace('.', ',');
  return `${quantity}/${formattedRate}`;
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 26
// ===========================================

/**
 * Автозаполнение вида транспорта внутри страны (= графа 18)
 */
export function autofillInlandTransportType(
  departureTransportType: string
): string {
  return departureTransportType;
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 37
// ===========================================

/**
 * Автозаполнение кода процедуры для товара
 */
export function autofillGraph37(
  previousRegime: string = '00',
  movementSpecific: string = '000'
): ExportCommodityItem['graph37'] {
  return {
    procedureCode: formatProcedureCode('10', previousRegime, movementSpecific),
    currentRegime: '10',
    previousRegime,
    movementSpecific,
  };
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 45
// ===========================================

/**
 * Автозаполнение таможенной стоимости (для экспорта обычно = фактурная)
 */
export function autofillCustomsValue(invoiceValue: number): number {
  return roundValue(invoiceValue);
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ГРАФЫ 46
// ===========================================

/**
 * Автозаполнение статистической стоимости
 */
export function autofillStatisticalValue(
  customsValue: number,
  context: AutofillContext
): number {
  return calculateStatisticalValue(
    customsValue,
    context.contractCurrencyRate,
    context.usdExchangeRate
  );
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ТОВАРНОЙ ПОЗИЦИИ
// ===========================================

/**
 * Автозаполнение полей товарной позиции
 */
export function autofillCommodityItem(
  item: Partial<ExportCommodityItem>,
  context: AutofillContext
): Partial<ExportCommodityItem> {
  const result = { ...item };
  
  // Автозаполнение графы 37
  if (!result.graph37) {
    result.graph37 = autofillGraph37();
  }
  
  // Автозаполнение графы 45 (таможенная стоимость)
  if (result.invoiceValue && !result.customsValue) {
    result.customsValue = autofillCustomsValue(result.invoiceValue);
  }
  
  // Автозаполнение графы 46 (статистическая стоимость)
  if (result.customsValue && !result.statisticalValue) {
    result.statisticalValue = autofillStatisticalValue(result.customsValue, context);
  }
  
  // Округление весов
  if (result.grossWeight) {
    result.grossWeight = roundWeight(result.grossWeight);
  }
  if (result.netWeight) {
    result.netWeight = roundWeight(result.netWeight);
  }
  
  return result;
}

// ===========================================
// АВТОЗАПОЛНЕНИЕ ВСЕЙ ДЕКЛАРАЦИИ
// ===========================================

/**
 * Автозаполнение всей декларации на экспорт
 */
export function autofillExportDeclaration(
  draft: ExportDeclarationDraft,
  context: AutofillContext
): ExportDeclarationDraft {
  const result = { ...draft };
  
  // Графа 1
  if (!result.graph1) {
    result.graph1 = autofillGraph1();
  }
  
  // Графа 3
  if (result.items?.length) {
    result.graph3 = autofillGraph3(result.items.length);
    result.totalItems = result.items.length;
  }
  
  // Графа 11 (из графы 9)
  if (result.graph9?.inn && !result.graph11) {
    // TODO: получить код страны по ИНН из справочника
    // Пока используем код Узбекистана
    result.graph11 = autofillGraph11('860', false);
  }
  
  // Автозаполнение товарных позиций
  if (result.items) {
    result.items = result.items.map((item, index) => {
      if (!item) return item;
      return {
        ...autofillCommodityItem(item, context),
        itemNumber: index + 1,
      } as ExportCommodityItem;
    });
  }
  
  // Графа 12 (общая таможенная стоимость)
  if (result.items) {
    result.totalCustomsValue = autofillTotalCustomsValue(result.items);
  }
  
  // Графа 22 (общая фактурная стоимость)
  if (result.items) {
    result.totalInvoiceValue = autofillTotalInvoiceValue(result.items);
  }
  
  // Графа 26 (вид транспорта внутри страны)
  if (result.graph18?.transportType && !result.inlandTransportType) {
    result.inlandTransportType = autofillInlandTransportType(result.graph18.transportType) as typeof result.inlandTransportType;
  }
  
  return result;
}

// ===========================================
// КОПИРОВАНИЕ ДАННЫХ
// ===========================================

/**
 * Копирование данных отправителя (графа 2) в декларанта (графа 14)
 * Используется новая структура графы 2 с senderName, senderAddress и т.д.
 */
export function copyExporterToDeclarant(
  draft: ExportDeclarationDraft
): ExportDeclarationDraft {
  if (!draft.graph2) return draft;
  
  return {
    ...draft,
    declarantName: draft.graph2.exporterName,
    declarantAddress: draft.graph2.exporterAddress,
    declarantInn: draft.graph2.exporterInn,
    declarantPhone: draft.graph2.exporterPhone,
    declarantEmail: draft.graph2.exporterEmail,
    isBroker: false,
  };
}

/**
 * Копирование данных экспортера (графа 2) в лицо, ответственное за финансовое урегулирование (графа 9)
 * Используется новая структура графы 2 с exporterName, exporterAddress и т.д.
 */
export function copyExporterToFinancial(
  draft: ExportDeclarationDraft
): ExportDeclarationDraft {
  if (!draft.graph2) return draft;
  
  return {
    ...draft,
    graph9: {
      name: draft.graph2.exporterName,
      address: draft.graph2.exporterAddress,
      inn: draft.graph2.exporterInn,
      regionCode: draft.graph2.regionCode,
      phone: draft.graph2.exporterPhone,
      email: draft.graph2.exporterEmail,
      statusCode: undefined, // ОКПО не является статусом лица
    },
  };
}

/**
 * Копирование данных отправителя (графа 2) в плательщика (графа 28)
 * Используется новая структура графы 2 с senderInn
 */
export function copyExporterToPayer(
  draft: ExportDeclarationDraft
): ExportDeclarationDraft {
  if (!draft.graph2) return draft;
  
  return {
    ...draft,
    payerInn: draft.graph2.exporterInn,
  };
}

// ===========================================
// РАСЧЁТ ПЛАТЕЖЕЙ
// ===========================================

/**
 * Расчёт таможенного сбора за оформление
 */
export function calculateCustomsFee(
  totalCustomsValue: number,
  baseRate: number = 1250000 // Базовая расчётная величина
): number {
  // Сбор = 50% от БРВ для основного листа + 20% БРВ за каждый добавочный
  return roundValue(baseRate * 0.5);
}

/**
 * Расчёт экспортной пошлины (если применимо)
 */
export function calculateExportDuty(
  customsValue: number,
  dutyRate: number
): number {
  return roundValue(customsValue * dutyRate / 100);
}

// ===========================================
// ГЕНЕРАЦИЯ НОМЕРА ГТД
// ===========================================

/**
 * Генерация номера ГТД для графы 54
 */
export function generateGtdNumber(
  declarantPinfl: string,
  date: Date,
  sequenceNumber: number
): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const seq = String(sequenceNumber).padStart(7, '0');
  
  return `${declarantPinfl}/${day}.${month}.${year}/${seq}`;
}

// ===========================================
// ФОРМАТИРОВАНИЕ ДЛЯ ПЕЧАТИ
// ===========================================

/**
 * Форматирование адреса для граф 2, 8, 9
 */
export function formatAddress(
  country: string,
  city: string,
  street: string,
  building: string,
  apartment?: string
): string {
  let address = `${country}, ${city}, ${street}, дом ${building}`;
  if (apartment) {
    address += `, квартира ${apartment}`;
  }
  return address;
}

/**
 * Форматирование данных для графы 18
 */
export function formatGraph18(
  vehicleCount: number,
  transportType: string,
  vehicleNumbers: string[],
  trailerNumbers?: string[]
): string {
  const transport = TRANSPORT_TYPE_MAP[transportType];
  const shortName = transport?.shortName || transportType;
  
  let numbers = vehicleNumbers[0];
  if (trailerNumbers && trailerNumbers[0]) {
    numbers += `/${trailerNumbers[0]}`;
  }
  
  if (vehicleNumbers.length > 1) {
    numbers = vehicleNumbers.map((num, i) => {
      const trailer = trailerNumbers?.[i];
      return trailer ? `${num}/${trailer}` : num;
    }).join('; ');
  }
  
  return `${vehicleCount} ${shortName}: ${numbers}`;
}

/**
 * Форматирование документа для графы 44
 */
export function formatDocument(
  code: string,
  abbreviation: string,
  number: string,
  date: string,
  validUntil?: string
): string {
  let result = `${code} ${abbreviation} № ${number} от ${date}`;
  if (validUntil) {
    result += ` Срок действия — ${validUntil}`;
  }
  return result;
}
