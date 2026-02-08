/**
 * GTD Generator Service
 * Формирование данных для таможенной декларации с валидацией
 * согласно таможенным правилам Узбекистана
 * 
 * Источник: Постановление ГТК РУз от 29.02.2016 №01-02/15-07
 * "Инструкция о порядке заполнения грузовой таможенной декларации"
 * Зарегистрировано МЮ 06.04.2016 г. №2773
 */

import {
  DELIVERY_TERMS,
  DOCUMENT_CODES,
  INCOTERMS_GROUPS,
  CUSTOMS_PAYMENTS,
  CUSTOMS_REGIMES,
  TRANSPORT_TYPES,
  VALIDATION_RULES,
  type IncotermsGroup,
} from '@/shared/constants/gtd-reference';

// ==========================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ==========================================

export interface GTDItem {
  itemNumber: number;
  hsCode: string;                    // Графа 33 - Код товара
  description: string;               // Графа 31 - Описание
  originCountryCode: string;         // Графа 34 - Страна происхождения
  grossWeight: number;               // Графа 35 - Вес брутто
  netWeight: number;                 // Графа 38 - Вес нетто
  quantity: number;                  // Количество
  unitCode: string;                  // Единица измерения
  invoiceValue: number;              // Графа 42 - Фактурная стоимость
  customsValue: number;              // Графа 45 - Таможенная стоимость
  statisticalValue: number;          // Графа 46 - Статистическая стоимость
  procedureCode: string;             // Графа 37 - Код процедуры
  previousProcedureCode?: string;
  packageType: string;               // Тип упаковки
  packageQuantity: number;           // Количество мест
  containerNumbers?: string[];       // Номера контейнеров
  additionalDocuments?: string[];    // Графа 44 - Документы
  quotaNumber?: string;              // Графа 39 - Квота
}

export interface GTDData {
  // Общие данные декларации
  declarationType: string;           // Графа 1 - Тип декларации
  declarationTypeCode: string;
  additionalSheets: number;          // Графа 3 - Добавочные листы
  referenceNumber?: string;          // Графа 4 - Отгрузочные спецификации
  totalItems: number;                // Графа 5 - Всего наименований
  totalPackages: number;             // Графа 6 - Всего мест
  registrationNumber?: string;       // Графа 7 - Регистрационный номер

  // Стороны сделки
  exporter: {
    name: string;
    address: string;
    tin: string;
    countryCode: string;
  };
  consignee: {
    name: string;
    address: string;
    tin: string;
    countryCode: string;
  };
  declarant: {
    name: string;
    tin: string;
    status: 'DECLARANT' | 'REPRESENTATIVE';
  };

  // Страны
  dispatchCountryCode: string;       // Графа 15 - Страна отправления
  destinationCountryCode: string;    // Графа 17 - Страна назначения
  originCountryCode: string;         // Графа 16 - Страна происхождения

  // Транспорт
  borderTransportMode: string;       // Графа 21/25 - Вид транспорта
  departureTransportType: string;    // Графа 18 - Транспорт при отправлении
  departureTransportNumber: string;
  inlandTransportMode?: string;      // Графа 26 - Внутренний транспорт

  // Условия поставки
  incotermsCode: string;             // Графа 20 - Инкотермс
  incotermsPlace: string;
  
  // Финансы
  currency: string;                  // Графа 22 - Валюта
  totalInvoiceAmount: number;        // Графа 22 - Общая фактурная стоимость
  exchangeRate: number;              // Графа 23 - Курс валюты
  transactionNatureCode: string;     // Графа 24 - Характер сделки

  // Транспортные расходы (для расчета таможенной стоимости)
  transportCosts?: number;
  insuranceCosts?: number;
  loadingCosts?: number;

  // Товарные позиции
  items: GTDItem[];

  // Таможенные органы
  entryCustomsOffice?: string;       // Графа 29
  exitCustomsOffice?: string;
  goodsLocation?: string;            // Графа 30

  // Платежи
  totalDutyAmount?: number;          // Графа 47 - Итого платежей
  guaranteeType?: string;
  guaranteeAmount?: number;

  // Подписант
  signatoryName?: string;            // Графа 54
  signatoryPhone?: string;
  declarationPlace?: string;
  declarationDate?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CorrectionLog {
  field: string;
  originalValue: unknown;
  correctedValue: unknown;
  reason: string;
  timestamp: Date;
}

// ==========================================
// КОДЫ ТОВАРОВ, ТРЕБУЮЩИЕ ОСОБОЙ ПРОВЕРКИ
// ==========================================

// Коды ТН ВЭД, требующие акцизных документов
const EXCISE_REQUIRED_HS_CODES = [
  '2203', '2204', '2205', '2206', '2207', '2208', // Алкоголь
  '2402', '2403',                                   // Табак
  '8703',                                           // Автомобили
  '2710',                                           // Нефтепродукты
];

// Коды ТН ВЭД с льготной ставкой НДС
const VAT_EXEMPT_HS_CODES = [
  '0201', '0202', '0203', '0204', '0207',          // Мясо
  '0401', '0402', '0403', '0405', '0406',          // Молочные продукты
  '1001', '1002', '1003', '1004', '1005', '1006', // Зерновые
  '3004',                                          // Лекарства
];

/**
 * Коды документов для графы 44
 * Используются локальные коды для обратной совместимости
 * Полный справочник: DOCUMENT_CODES из gtd-reference.ts
 */
const LOCAL_DOCUMENT_CODES = {
  EXCISE_PERMIT: '101',       // Лицензия (акцизное разрешение)
  VAT_EXEMPT_CERT: '601',     // Документ-основание для льготы
  ORIGIN_CERT: '503',         // Сертификат происхождения
  QUALITY_CERT: '102',        // Сертификат соответствия
  PHYTO_CERT: '103',          // Фитосанитарный сертификат
  VET_CERT: '104',            // Ветеринарный сертификат
  CONTRACT: '301',            // Контракт
  INVOICE: '220',             // Инвойс
  CMR: '202',                 // CMR накладная
  RAILWAY: '207',             // ЖД накладная СМГС
  AIR_WAYBILL: '205',         // Авианакладная
};

/**
 * Определение группы Incoterms для расчета таможенной стоимости
 * Согласно инструкции, для условий группы E и F нужно добавить транспортные расходы
 */
function getIncotermsGroup(code: string): IncotermsGroup | null {
  const term = DELIVERY_TERMS.find(t => t.abbr === code.toUpperCase());
  if (!term) return null;
  return term.group as IncotermsGroup;
}

/**
 * Проверка, требует ли Incoterms добавления транспортных расходов
 */
function shouldAddTransportCosts(incotermsCode: string): boolean {
  const group = getIncotermsGroup(incotermsCode);
  if (!group || !INCOTERMS_GROUPS[group]) return false;
  return INCOTERMS_GROUPS[group].addTransportToCustomsValue;
}

// Старая константа оставлена для обратной совместимости
const INCOTERMS_ADD_TRANSPORT = ['EXW', 'FCA', 'FAS', 'FOB'];

// ==========================================
// КЛАСС ВАЛИДАТОРА GTD
// ==========================================

export class GTDValidator {
  private errors: ValidationError[] = [];
  private corrections: CorrectionLog[] = [];

  constructor(private data: GTDData) {}

  /**
   * Полная валидация декларации
   */
  validate(): { isValid: boolean; errors: ValidationError[]; corrections: CorrectionLog[] } {
    this.errors = [];
    this.corrections = [];

    // Валидация веса
    this.validateWeights();

    // Валидация таможенной стоимости
    this.validateCustomsValue();

    // Валидация кодов товаров и документов
    this.validateHsCodesAndDocuments();

    // Валидация агрегированных данных
    this.validateAggregations();

    // Валидация обязательных полей
    this.validateRequiredFields();

    return {
      isValid: this.errors.filter(e => e.severity === 'error').length === 0,
      errors: this.errors,
      corrections: this.corrections,
    };
  }

  /**
   * Валидация веса: Нетто не может быть больше Брутто
   */
  private validateWeights(): void {
    for (const item of this.data.items) {
      if (item.netWeight > item.grossWeight) {
        this.errors.push({
          field: `items[${item.itemNumber}].netWeight`,
          message: `Вес нетто (${item.netWeight} кг) не может превышать вес брутто (${item.grossWeight} кг) для товара №${item.itemNumber}`,
          severity: 'error',
        });
      }

      if (item.netWeight <= 0) {
        this.errors.push({
          field: `items[${item.itemNumber}].netWeight`,
          message: `Вес нетто должен быть больше 0 для товара №${item.itemNumber}`,
          severity: 'error',
        });
      }

      if (item.grossWeight <= 0) {
        this.errors.push({
          field: `items[${item.itemNumber}].grossWeight`,
          message: `Вес брутто должен быть больше 0 для товара №${item.itemNumber}`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Валидация таможенной стоимости согласно Инкотермс
   * Графа 45 = Графа 42 + транспортные расходы (для F и E терминов)
   * Согласно инструкции ГТК РУз
   */
  private validateCustomsValue(): void {
    const incoterm = this.data.incotermsCode?.toUpperCase() || '';
    const shouldAddTransport = shouldAddTransportCosts(incoterm);

    for (const item of this.data.items) {
      let expectedCustomsValue = item.invoiceValue;

      if (shouldAddTransport) {
        // Для F и E терминов добавляем транспортные расходы
        const transportShare = this.calculateTransportShare(item);
        expectedCustomsValue = item.invoiceValue + transportShare;
      }

      // Проверяем соответствие
      const tolerance = 0.01; // Допуск 1%
      const difference = Math.abs(item.customsValue - expectedCustomsValue);
      const percentDiff = (difference / expectedCustomsValue) * 100;

      if (percentDiff > tolerance && difference > 1) {
        this.errors.push({
          field: `items[${item.itemNumber}].customsValue`,
          message: `Таможенная стоимость (${item.customsValue}) не соответствует расчетной (${expectedCustomsValue.toFixed(2)}) для товара №${item.itemNumber}. Инкотермс: ${incoterm}`,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Расчет доли транспортных расходов для товара
   */
  private calculateTransportShare(item: GTDItem): number {
    const totalInvoice = this.data.items.reduce((sum, i) => sum + i.invoiceValue, 0);
    if (totalInvoice === 0) return 0;

    const totalTransport = (this.data.transportCosts || 0) + 
                          (this.data.insuranceCosts || 0) + 
                          (this.data.loadingCosts || 0);
    
    // Распределяем пропорционально стоимости товара
    return (item.invoiceValue / totalInvoice) * totalTransport;
  }

  /**
   * Валидация кодов товаров и наличия документов в графе 44
   */
  private validateHsCodesAndDocuments(): void {
    for (const item of this.data.items) {
      const hsCode4 = item.hsCode?.substring(0, 4) || '';
      const documents = item.additionalDocuments || [];

      // Проверка акцизных товаров
      if (EXCISE_REQUIRED_HS_CODES.some(code => hsCode4.startsWith(code.substring(0, 4)))) {
        const hasExciseDoc = documents.some(doc => doc.startsWith(LOCAL_DOCUMENT_CODES.EXCISE_PERMIT));
        if (!hasExciseDoc) {
          this.errors.push({
            field: `items[${item.itemNumber}].additionalDocuments`,
            message: `Для товара с кодом ${item.hsCode} (подакцизный) требуется акцизное разрешение (код ${LOCAL_DOCUMENT_CODES.EXCISE_PERMIT}) в графе 44`,
            severity: 'warning',
          });
        }
      }

      // Проверка товаров с льготным НДС
      if (VAT_EXEMPT_HS_CODES.some(code => hsCode4.startsWith(code.substring(0, 4)))) {
        const hasVatDoc = documents.some(doc => doc.startsWith(LOCAL_DOCUMENT_CODES.VAT_EXEMPT_CERT));
        if (!hasVatDoc) {
          this.errors.push({
            field: `items[${item.itemNumber}].additionalDocuments`,
            message: `Для товара с кодом ${item.hsCode} рекомендуется документ-основание для льготы (код ${LOCAL_DOCUMENT_CODES.VAT_EXEMPT_CERT}) в графе 44`,
            severity: 'warning',
          });
        }
      }
    }
  }

  /**
   * Валидация агрегированных данных (графы 5, 35, 38)
   */
  private validateAggregations(): void {
    // Графа 5 - Всего наименований товаров
    const actualTotalItems = this.data.items.length;
    if (this.data.totalItems !== actualTotalItems) {
      this.errors.push({
        field: 'totalItems',
        message: `Графа 5: указано ${this.data.totalItems} наименований, фактически ${actualTotalItems}`,
        severity: 'error',
      });
    }

    // Сумма весов по всем позициям
    const totalGrossWeight = this.data.items.reduce((sum, item) => sum + item.grossWeight, 0);
    const totalNetWeight = this.data.items.reduce((sum, item) => sum + item.netWeight, 0);
    const totalPackages = this.data.items.reduce((sum, item) => sum + item.packageQuantity, 0);

    // Графа 6 - Всего мест
    if (this.data.totalPackages !== totalPackages) {
      this.errors.push({
        field: 'totalPackages',
        message: `Графа 6: указано ${this.data.totalPackages} мест, сумма по товарам ${totalPackages}`,
        severity: 'warning',
      });
    }

    // Общий вес нетто не может быть больше брутто
    if (totalNetWeight > totalGrossWeight) {
      this.errors.push({
        field: 'totalWeight',
        message: `Общий вес нетто (${totalNetWeight} кг) превышает общий вес брутто (${totalGrossWeight} кг)`,
        severity: 'error',
      });
    }
  }

  /**
   * Валидация обязательных полей
   */
  private validateRequiredFields(): void {
    const requiredFields: { field: keyof GTDData; name: string }[] = [
      { field: 'declarationType', name: 'Тип декларации (гр.1)' },
      { field: 'currency', name: 'Валюта (гр.22)' },
      { field: 'incotermsCode', name: 'Условия поставки (гр.20)' },
    ];

    for (const { field, name } of requiredFields) {
      if (!this.data[field]) {
        this.errors.push({
          field,
          message: `Не заполнено обязательное поле: ${name}`,
          severity: 'error',
        });
      }
    }

    // Проверка экспортера
    if (!this.data.exporter?.name) {
      this.errors.push({
        field: 'exporter.name',
        message: 'Не указан экспортер (гр.2)',
        severity: 'error',
      });
    }

    // Проверка получателя
    if (!this.data.consignee?.name) {
      this.errors.push({
        field: 'consignee.name',
        message: 'Не указан получатель (гр.8)',
        severity: 'error',
      });
    }

    // Проверка товаров
    if (!this.data.items || this.data.items.length === 0) {
      this.errors.push({
        field: 'items',
        message: 'Не указаны товарные позиции',
        severity: 'error',
      });
    }
  }

  /**
   * Добавить запись в лог коррекций
   */
  logCorrection(field: string, originalValue: unknown, correctedValue: unknown, reason: string): void {
    this.corrections.push({
      field,
      originalValue,
      correctedValue,
      reason,
      timestamp: new Date(),
    });
    console.log(`[GTD Correction] ${field}: ${originalValue} → ${correctedValue} (${reason})`);
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  getCorrections(): CorrectionLog[] {
    return this.corrections;
  }
}

// ==========================================
// КЛАСС ГЕНЕРАТОРА GTD
// ==========================================

export class GTDGenerator {
  private data: GTDData;
  private validator: GTDValidator;
  private corrections: CorrectionLog[] = [];

  constructor(rawData: Partial<GTDData>) {
    this.data = this.normalizeData(rawData);
    this.validator = new GTDValidator(this.data);
  }

  /**
   * Нормализация и подготовка данных
   */
  private normalizeData(rawData: Partial<GTDData>): GTDData {
    const items = (rawData.items || []).map((item, index) => ({
      ...item,
      itemNumber: index + 1,
      grossWeight: item.grossWeight || 0,
      netWeight: item.netWeight || 0,
      invoiceValue: item.invoiceValue || 0,
      customsValue: item.customsValue || 0,
      statisticalValue: item.statisticalValue || 0,
      packageQuantity: item.packageQuantity || 1,
    })) as GTDItem[];

    return {
      declarationType: rawData.declarationType || 'IMPORT',
      declarationTypeCode: rawData.declarationTypeCode || '40',
      additionalSheets: Math.max(0, items.length - 1),
      totalItems: items.length,
      totalPackages: items.reduce((sum, item) => sum + item.packageQuantity, 0),
      exporter: rawData.exporter || { name: '', address: '', tin: '', countryCode: '' },
      consignee: rawData.consignee || { name: '', address: '', tin: '', countryCode: '' },
      declarant: rawData.declarant || { name: '', tin: '', status: 'DECLARANT' },
      dispatchCountryCode: rawData.dispatchCountryCode || '',
      destinationCountryCode: rawData.destinationCountryCode || 'UZ',
      originCountryCode: rawData.originCountryCode || '',
      borderTransportMode: rawData.borderTransportMode || '30',
      departureTransportType: rawData.departureTransportType || '30',
      departureTransportNumber: rawData.departureTransportNumber || '',
      incotermsCode: rawData.incotermsCode || 'DAP',
      incotermsPlace: rawData.incotermsPlace || '',
      currency: rawData.currency || 'USD',
      totalInvoiceAmount: rawData.totalInvoiceAmount || 0,
      exchangeRate: rawData.exchangeRate || 1,
      transactionNatureCode: rawData.transactionNatureCode || '11',
      transportCosts: rawData.transportCosts,
      insuranceCosts: rawData.insuranceCosts,
      loadingCosts: rawData.loadingCosts,
      items,
      entryCustomsOffice: rawData.entryCustomsOffice,
      exitCustomsOffice: rawData.exitCustomsOffice,
      goodsLocation: rawData.goodsLocation,
      signatoryName: rawData.signatoryName,
      signatoryPhone: rawData.signatoryPhone,
      declarationPlace: rawData.declarationPlace,
      declarationDate: rawData.declarationDate,
    };
  }

  /**
   * Генерация данных с автоматическими корректировками
   */
  generate(): { data: GTDData; validation: ReturnType<GTDValidator['validate']> } {
    // Автоматические корректировки
    this.autoCalculateAggregations();
    this.autoCalculateCustomsValue();
    this.autoCorrectWeights();

    // Валидация
    const validation = this.validator.validate();

    // Добавляем наши коррекции
    validation.corrections.push(...this.corrections);

    return {
      data: this.data,
      validation,
    };
  }

  /**
   * Автоматический расчет агрегированных данных (графы 5, 6, 35, 38)
   */
  private autoCalculateAggregations(): void {
    const originalTotalItems = this.data.totalItems;
    const originalTotalPackages = this.data.totalPackages;

    // Графа 5 - Всего наименований
    this.data.totalItems = this.data.items.length;
    if (originalTotalItems !== this.data.totalItems) {
      this.logCorrection('totalItems', originalTotalItems, this.data.totalItems, 'Автоматический подсчет товарных позиций');
    }

    // Графа 3 - Добавочные листы (ТД-2)
    this.data.additionalSheets = Math.max(0, this.data.items.length - 1);

    // Графа 6 - Всего мест
    const calculatedPackages = this.data.items.reduce((sum, item) => sum + item.packageQuantity, 0);
    if (originalTotalPackages !== calculatedPackages) {
      this.logCorrection('totalPackages', originalTotalPackages, calculatedPackages, 'Автоматический подсчет мест');
      this.data.totalPackages = calculatedPackages;
    }

    // Общая фактурная стоимость
    const calculatedInvoice = this.data.items.reduce((sum, item) => sum + item.invoiceValue, 0);
    if (Math.abs(this.data.totalInvoiceAmount - calculatedInvoice) > 0.01) {
      this.logCorrection('totalInvoiceAmount', this.data.totalInvoiceAmount, calculatedInvoice, 'Сумма фактурных стоимостей товаров');
      this.data.totalInvoiceAmount = calculatedInvoice;
    }
  }

  /**
   * Автоматический расчет таможенной стоимости по Инкотермс
   * Графа 45 = Графа 42 + транспортные расходы (для F и E терминов)
   * Согласно инструкции ГТК РУз
   */
  private autoCalculateCustomsValue(): void {
    const incoterm = this.data.incotermsCode?.toUpperCase() || '';
    const shouldAddTransport = shouldAddTransportCosts(incoterm);

    const totalTransport = (this.data.transportCosts || 0) + 
                          (this.data.insuranceCosts || 0) + 
                          (this.data.loadingCosts || 0);
    const totalInvoice = this.data.items.reduce((sum, i) => sum + i.invoiceValue, 0);

    for (const item of this.data.items) {
      let calculatedCustomsValue = item.invoiceValue;

      if (shouldAddTransport && totalTransport > 0 && totalInvoice > 0) {
        // Распределяем транспортные расходы пропорционально стоимости
        const transportShare = (item.invoiceValue / totalInvoice) * totalTransport;
        calculatedCustomsValue = item.invoiceValue + transportShare;
      }

      // Корректируем если отличается
      if (item.customsValue === 0 || Math.abs(item.customsValue - calculatedCustomsValue) > 1) {
        const original = item.customsValue;
        item.customsValue = Math.round(calculatedCustomsValue * 100) / 100;
        if (original !== item.customsValue) {
          this.logCorrection(
            `items[${item.itemNumber}].customsValue`,
            original,
            item.customsValue,
            `Расчет по Инкотермс ${incoterm}: фактурная ${item.invoiceValue} + транспорт ${(calculatedCustomsValue - item.invoiceValue).toFixed(2)}`
          );
        }
      }

      // Статистическая стоимость (обычно = таможенной в UZS)
      if (item.statisticalValue === 0) {
        item.statisticalValue = Math.round(item.customsValue * this.data.exchangeRate * 100) / 100;
      }
    }
  }

  /**
   * Автоматическая корректировка весов
   */
  private autoCorrectWeights(): void {
    for (const item of this.data.items) {
      // Если нетто больше брутто - меняем местами
      if (item.netWeight > item.grossWeight && item.grossWeight > 0) {
        this.logCorrection(
          `items[${item.itemNumber}].weights`,
          { gross: item.grossWeight, net: item.netWeight },
          { gross: item.netWeight, net: item.grossWeight },
          'Вес нетто был больше брутто - значения поменяны местами'
        );
        [item.grossWeight, item.netWeight] = [item.netWeight, item.grossWeight];
      }

      // Если нетто = 0, а брутто указан - считаем нетто как 95% от брутто
      if (item.netWeight === 0 && item.grossWeight > 0) {
        const estimatedNet = Math.round(item.grossWeight * 0.95 * 1000) / 1000;
        this.logCorrection(
          `items[${item.itemNumber}].netWeight`,
          0,
          estimatedNet,
          'Вес нетто рассчитан как 95% от брутто'
        );
        item.netWeight = estimatedNet;
      }
    }
  }

  /**
   * Форматирование графы 31 - Описание товара
   */
  formatField31(item: GTDItem, maxLength: number = 500): string {
    const parts: string[] = [];

    // 1) Описание товара
    if (item.description) {
      parts.push(item.description.trim());
    }

    // 2) Количество и единица измерения
    if (item.quantity && item.unitCode) {
      parts.push(`Кол-во: ${item.quantity} ${item.unitCode}`);
    }

    // 3) Номера контейнеров
    if (item.containerNumbers && item.containerNumbers.length > 0) {
      parts.push(`Контейнер: ${item.containerNumbers.join(', ')}`);
    }

    // 4) Упаковка
    if (item.packageQuantity && item.packageType) {
      parts.push(`Упаковка: ${item.packageQuantity} ${item.packageType}`);
    }

    // Склеиваем и обрезаем
    let result = parts.join('; ');
    if (result.length > maxLength) {
      result = result.substring(0, maxLength - 3) + '...';
    }

    return result;
  }

  /**
   * Логирование коррекции
   */
  private logCorrection(field: string, originalValue: unknown, correctedValue: unknown, reason: string): void {
    const log: CorrectionLog = {
      field,
      originalValue,
      correctedValue,
      reason,
      timestamp: new Date(),
    };
    this.corrections.push(log);
    console.log(`[GTD Auto-Correction] ${field}: ${JSON.stringify(originalValue)} → ${JSON.stringify(correctedValue)} (${reason})`);
  }

  /**
   * Получить структуру данных для ReportLab PDF
   */
  getPdfData(): GTDPdfData {
    return {
      // Заголовок
      header: {
        declarationType: `${this.data.declarationType} ${this.data.declarationTypeCode}`,
        additionalSheets: this.data.additionalSheets,
        totalItems: this.data.totalItems,
        totalPackages: this.data.totalPackages,
        registrationNumber: this.data.registrationNumber || '',
      },

      // Блоки 2, 8 - Стороны
      parties: {
        exporter: {
          name: this.data.exporter.name,
          address: this.data.exporter.address,
          tin: this.data.exporter.tin,
          country: this.data.exporter.countryCode,
        },
        consignee: {
          name: this.data.consignee.name,
          address: this.data.consignee.address,
          tin: this.data.consignee.tin,
          country: this.data.consignee.countryCode,
        },
        declarant: {
          name: this.data.declarant.name,
          tin: this.data.declarant.tin,
          status: this.data.declarant.status,
        },
      },

      // Страны
      countries: {
        dispatch: this.data.dispatchCountryCode,
        destination: this.data.destinationCountryCode,
        origin: this.data.originCountryCode,
      },

      // Транспорт
      transport: {
        borderMode: this.data.borderTransportMode,
        departureType: this.data.departureTransportType,
        departureNumber: this.data.departureTransportNumber,
        inlandMode: this.data.inlandTransportMode,
      },

      // Условия поставки
      delivery: {
        incoterms: this.data.incotermsCode,
        place: this.data.incotermsPlace,
      },

      // Финансы
      finance: {
        currency: this.data.currency,
        totalAmount: this.data.totalInvoiceAmount,
        exchangeRate: this.data.exchangeRate,
        transactionNature: this.data.transactionNatureCode,
      },

      // Товары с форматированной графой 31
      items: this.data.items.map(item => ({
        number: item.itemNumber,
        description: this.formatField31(item),
        hsCode: item.hsCode,
        origin: item.originCountryCode,
        grossWeight: item.grossWeight,
        netWeight: item.netWeight,
        procedure: `${item.procedureCode}/${item.previousProcedureCode || '00'}`,
        invoiceValue: item.invoiceValue,
        customsValue: item.customsValue,
        statisticalValue: item.statisticalValue,
        packages: `${item.packageQuantity} ${item.packageType}`,
        documents: item.additionalDocuments?.join('\n') || '',
      })),

      // Таможенные органы
      customs: {
        entry: this.data.entryCustomsOffice,
        exit: this.data.exitCustomsOffice,
        location: this.data.goodsLocation,
      },

      // Подпись
      signature: {
        name: this.data.signatoryName,
        phone: this.data.signatoryPhone,
        place: this.data.declarationPlace,
        date: this.data.declarationDate,
      },

      // Координаты полей для PDF (в мм от левого верхнего угла)
      fieldCoordinates: GTD_FIELD_COORDINATES,
    };
  }

  getData(): GTDData {
    return this.data;
  }
}

// ==========================================
// СТРУКТУРА ДАННЫХ ДЛЯ PDF
// ==========================================

export interface GTDPdfData {
  header: {
    declarationType: string;
    additionalSheets: number;
    totalItems: number;
    totalPackages: number;
    registrationNumber: string;
  };
  parties: {
    exporter: { name: string; address: string; tin: string; country: string };
    consignee: { name: string; address: string; tin: string; country: string };
    declarant: { name: string; tin: string; status: string };
  };
  countries: {
    dispatch: string;
    destination: string;
    origin: string;
  };
  transport: {
    borderMode: string;
    departureType: string;
    departureNumber: string;
    inlandMode?: string;
  };
  delivery: {
    incoterms: string;
    place: string;
  };
  finance: {
    currency: string;
    totalAmount: number;
    exchangeRate: number;
    transactionNature: string;
  };
  items: Array<{
    number: number;
    description: string;
    hsCode: string;
    origin: string;
    grossWeight: number;
    netWeight: number;
    procedure: string;
    invoiceValue: number;
    customsValue: number;
    statisticalValue: number;
    packages: string;
    documents: string;
  }>;
  customs: {
    entry?: string;
    exit?: string;
    location?: string;
  };
  signature: {
    name?: string;
    phone?: string;
    place?: string;
    date?: string;
  };
  fieldCoordinates: typeof GTD_FIELD_COORDINATES;
}

// ==========================================
// КООРДИНАТЫ ПОЛЕЙ ДЛЯ PDF (в мм)
// Формат A4: 210 x 297 мм
// ==========================================

export const GTD_FIELD_COORDINATES = {
  // Заголовок
  declarationType: { x: 140, y: 10, width: 20, height: 8 },
  declarationCode: { x: 162, y: 10, width: 15, height: 8 },
  
  // Блок 1
  block1: { x: 140, y: 18, width: 60, height: 12 },
  
  // Блок 2 - Экспортер
  block2: { x: 5, y: 30, width: 70, height: 30 },
  exporterName: { x: 6, y: 35, width: 68, height: 15 },
  exporterTin: { x: 6, y: 52, width: 30, height: 6 },
  exporterCountry: { x: 55, y: 52, width: 18, height: 6 },
  
  // Блок 3 - Добавочные листы
  block3: { x: 140, y: 30, width: 20, height: 10 },
  
  // Блок 4 - Отгрузочные спецификации
  block4: { x: 162, y: 30, width: 40, height: 10 },
  
  // Блок 5 - Всего наименований
  block5: { x: 140, y: 42, width: 20, height: 10 },
  
  // Блок 6 - Всего мест
  block6: { x: 162, y: 42, width: 20, height: 10 },
  
  // Блок 7 - Регистрационный номер
  block7: { x: 184, y: 42, width: 20, height: 10 },
  
  // Блок 8 - Получатель
  block8: { x: 5, y: 62, width: 70, height: 25 },
  
  // Блоки 9-13 справа
  block9: { x: 77, y: 62, width: 60, height: 8 },
  block10: { x: 140, y: 62, width: 30, height: 8 },
  block11: { x: 172, y: 62, width: 30, height: 8 },
  block12: { x: 140, y: 72, width: 30, height: 15 },
  block13: { x: 172, y: 72, width: 30, height: 15 },
  
  // Блок 14 - Декларант
  block14: { x: 5, y: 89, width: 70, height: 20 },
  
  // Блоки 15-17 - Страны
  block15: { x: 77, y: 89, width: 25, height: 10 },
  block15a: { x: 104, y: 89, width: 15, height: 10 },
  block16: { x: 77, y: 101, width: 25, height: 8 },
  block17: { x: 121, y: 89, width: 25, height: 10 },
  block17a: { x: 148, y: 89, width: 15, height: 10 },
  
  // Блоки 18-20
  block18: { x: 5, y: 111, width: 50, height: 10 },
  block19: { x: 57, y: 111, width: 18, height: 10 },
  block20: { x: 77, y: 111, width: 60, height: 10 },
  
  // Блоки 21-30
  block21: { x: 5, y: 123, width: 40, height: 12 },
  block22: { x: 47, y: 123, width: 40, height: 12 },
  block23: { x: 89, y: 123, width: 25, height: 12 },
  block24: { x: 116, y: 123, width: 25, height: 12 },
  block25: { x: 5, y: 137, width: 20, height: 10 },
  block26: { x: 27, y: 137, width: 20, height: 10 },
  block27: { x: 49, y: 137, width: 40, height: 10 },
  block28: { x: 143, y: 123, width: 60, height: 24 },
  block29: { x: 5, y: 149, width: 40, height: 10 },
  block30: { x: 47, y: 149, width: 95, height: 10 },
  
  // Товарные позиции (блоки 31-47) - начало первого товара
  itemStart: { x: 5, y: 161 },
  block31: { x: 5, y: 161, width: 70, height: 35 },
  block32: { x: 77, y: 161, width: 15, height: 8 },
  block33: { x: 94, y: 161, width: 48, height: 8 },
  block34: { x: 77, y: 171, width: 20, height: 8 },
  block35: { x: 99, y: 171, width: 22, height: 8 },
  block37: { x: 77, y: 181, width: 25, height: 8 },
  block38: { x: 104, y: 181, width: 18, height: 8 },
  block39: { x: 124, y: 181, width: 18, height: 8 },
  block40: { x: 77, y: 191, width: 65, height: 8 },
  block41: { x: 77, y: 201, width: 12, height: 8 },
  block42: { x: 91, y: 201, width: 30, height: 8 },
  block43: { x: 123, y: 201, width: 18, height: 8 },
  block44: { x: 5, y: 198, width: 70, height: 20 },
  block45: { x: 91, y: 211, width: 25, height: 8 },
  block46: { x: 118, y: 211, width: 23, height: 8 },
  
  // Блоки 47-54
  block47: { x: 5, y: 220, width: 100, height: 25 },
  blockB: { x: 107, y: 220, width: 95, height: 25 },
  block48: { x: 5, y: 247, width: 50, height: 8 },
  block49: { x: 57, y: 247, width: 48, height: 8 },
  block50: { x: 5, y: 257, width: 100, height: 18 },
  blockC: { x: 107, y: 247, width: 95, height: 15 },
  blockD: { x: 5, y: 277, width: 100, height: 15 },
  block54: { x: 107, y: 264, width: 95, height: 28 },
} as const;

// ==========================================
// ЭКСПОРТ ФУНКЦИЙ-ХЕЛПЕРОВ
// ==========================================

/**
 * Быстрая валидация данных декларации
 */
export function validateGTD(data: Partial<GTDData>): ReturnType<GTDValidator['validate']> {
  const generator = new GTDGenerator(data);
  return generator.generate().validation;
}

/**
 * Генерация данных для PDF
 */
export function generateGTDPdfData(data: Partial<GTDData>): GTDPdfData {
  const generator = new GTDGenerator(data);
  generator.generate();
  return generator.getPdfData();
}

/**
 * Форматирование графы 31
 */
export function formatField31(item: GTDItem, maxLength: number = 500): string {
  const generator = new GTDGenerator({ items: [item] });
  return generator.formatField31(item, maxLength);
}
