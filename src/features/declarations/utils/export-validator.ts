/**
 * Валидатор для режима ЭКСПОРТ (код 10)
 * Согласно Инструкции ГТК РУз №2773
 */

import type { ExportDeclaration, ExportDeclarationDraft, ExportCommodityItem } from '../schemas/export-10.schema';

// ===========================================
// ТИПЫ ОШИБОК ВАЛИДАЦИИ
// ===========================================

export interface ValidationError {
  field: string;
  graphNumber?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ===========================================
// ОБЯЗАТЕЛЬНЫЕ ПОЛЯ ДЛЯ ЭКСПОРТА
// ===========================================

/**
 * Обязательные графы для режима Экспорт (код 10)
 * Согласно п. 24 Инструкции
 */
export const REQUIRED_GRAPHS_EXPORT = [
  '1', '2', '3', '5', '7', '8', '9', '11', '12', '13', '14', 
  '17', '17a', '18', '19', '20', '22', '23', '24', '25', '26', 
  '28', '29', '30', '31', '32', '33', '34', '35', '37', '38', 
  '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', 
  '49', '50', '54', 'С'
] as const;

/**
 * Поля, которые НЕ заполняются при определённых условиях
 */
export const CONDITIONAL_FIELDS = {
  // Графа 9: НЕ заполняется при безвозмездных поставках (код 80)
  graph9: { excludeWhenPaymentForm: '80' },
  
  // Графа 30: НЕ заполняется для трубопровода/ЛЭП
  graph30: { excludeWhenTransportType: ['71', '72'] },
  
  // Графы 35, 38: НЕ заполняются для ЛЭП
  graph35: { excludeWhenTransportType: ['72'] },
  graph38: { excludeWhenTransportType: ['72'] },
  
  // Графа 39: только для товаров с квотами
  graph39: { requiresQuota: true },
  
  // Графа 40: только если был предшествующий режим
  graph40: { requiresPreviousRegime: true },
  
  // Графа 41: только если есть дополнительная единица измерения
  graph41: { requiresSupplementaryUnit: true },
} as const;

// ===========================================
// ФУНКЦИИ ВАЛИДАЦИИ
// ===========================================

/**
 * Валидация графы 1 (Тип декларации)
 */
export function validateGraph1(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.graph1?.direction || data.graph1.direction !== 'ЭК') {
    errors.push({
      field: 'graph1.direction',
      graphNumber: '1',
      message: 'Для экспорта первый подраздел должен быть "ЭК"',
      severity: 'error',
    });
  }
  
  if (!data.graph1?.regimeCode || data.graph1.regimeCode !== '10') {
    errors.push({
      field: 'graph1.regimeCode',
      graphNumber: '1',
      message: 'Для экспорта второй подраздел должен быть "10"',
      severity: 'error',
    });
  }
  
  if (data.graph1?.subCode && data.graph1.subCode !== '') {
    errors.push({
      field: 'graph1.subCode',
      graphNumber: '1',
      message: 'Третий подраздел для экспорта не заполняется',
      severity: 'warning',
    });
  }
  
  return errors;
}

/**
 * Валидация графы 3 (Добавочные листы)
 */
export function validateGraph3(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  const { currentSheet, totalSheets } = data.graph3 || {};
  
  if (currentSheet && totalSheets && currentSheet > totalSheets) {
    errors.push({
      field: 'graph3.currentSheet',
      graphNumber: '3',
      message: 'Номер текущего листа не может превышать общее количество листов',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * Валидация графы 5 (Количество товаров)
 */
export function validateGraph5(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  const declaredCount = data.totalItems;
  const actualCount = data.items?.length || 0;
  
  if (declaredCount !== undefined && declaredCount !== actualCount) {
    errors.push({
      field: 'totalItems',
      graphNumber: '5',
      message: `Заявлено ${declaredCount} товаров, но добавлено ${actualCount}`,
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * Валидация графы 9 (Лицо, ответственное за финансовое урегулирование)
 */
export function validateGraph9(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Проверка: при безвозмездных поставках графа 9 не заполняется
  if (data.graph20?.paymentFormCode === '80') {
    if (data.graph9?.name || data.graph9?.inn) {
      errors.push({
        field: 'graph9',
        graphNumber: '9',
        message: 'При безвозмездных поставках графа 9 не заполняется',
        severity: 'warning',
      });
    }
  } else {
    // Обязательно для остальных случаев
    if (!data.graph9?.name) {
      errors.push({
        field: 'graph9.name',
        graphNumber: '9',
        message: 'Укажите лицо, ответственное за финансовое урегулирование',
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Валидация графы 12 (Общая таможенная стоимость)
 */
export function validateGraph12(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.items || data.items.length === 0) return errors;
  
  const sumCustomsValue = data.items.reduce((sum, item) => {
    return sum + (item?.customsValue || 0);
  }, 0);
  
  if (data.totalCustomsValue !== undefined) {
    const diff = Math.abs(data.totalCustomsValue - sumCustomsValue);
    if (diff > 0.01) {
      errors.push({
        field: 'totalCustomsValue',
        graphNumber: '12',
        message: `Общая таможенная стоимость (${data.totalCustomsValue}) должна равняться сумме стоимостей товаров (${sumCustomsValue.toFixed(2)})`,
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Валидация графы 22 (Общая фактурная стоимость)
 */
export function validateGraph22(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.items || data.items.length === 0) return errors;
  
  const sumInvoiceValue = data.items.reduce((sum, item) => {
    return sum + (item?.invoiceValue || 0);
  }, 0);
  
  if (data.totalInvoiceValue !== undefined) {
    const diff = Math.abs(data.totalInvoiceValue - sumInvoiceValue);
    if (diff > 0.01) {
      errors.push({
        field: 'totalInvoiceValue',
        graphNumber: '22',
        message: `Общая фактурная стоимость (${data.totalInvoiceValue}) должна равняться сумме стоимостей товаров (${sumInvoiceValue.toFixed(2)})`,
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Валидация графы 30 (Местонахождение товаров)
 */
export function validateGraph30(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  const transportType = data.graph18?.transportType;
  
  // Для трубопровода/ЛЭП графа 30 не заполняется
  if (transportType === '71' || transportType === '72') {
    if (data.goodsLocation) {
      errors.push({
        field: 'goodsLocation',
        graphNumber: '30',
        message: 'Для трубопровода/ЛЭП графа 30 не заполняется',
        severity: 'warning',
      });
    }
  } else {
    if (!data.goodsLocation) {
      errors.push({
        field: 'goodsLocation',
        graphNumber: '30',
        message: 'Укажите местонахождение товаров',
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Валидация товарной позиции
 */
export function validateCommodityItem(
  item: Partial<ExportCommodityItem>,
  index: number,
  transportType?: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `items[${index}]`;
  
  // Проверка веса: брутто >= нетто
  if (item.grossWeight !== undefined && item.netWeight !== undefined) {
    if (item.grossWeight < item.netWeight) {
      errors.push({
        field: `${prefix}.netWeight`,
        graphNumber: '38',
        message: `Товар №${item.itemNumber}: вес брутто должен быть >= веса нетто`,
        severity: 'error',
      });
    }
  }
  
  // Проверка процедуры: должна начинаться с 10
  if (item.graph37?.procedureCode) {
    if (!item.graph37.procedureCode.startsWith('10')) {
      errors.push({
        field: `${prefix}.graph37.procedureCode`,
        graphNumber: '37',
        message: `Товар №${item.itemNumber}: код процедуры для экспорта должен начинаться с "10"`,
        severity: 'error',
      });
    }
  }
  
  // Проверка для ЛЭП: веса не заполняются
  if (transportType === '72') {
    if (item.grossWeight || item.netWeight) {
      errors.push({
        field: `${prefix}.grossWeight`,
        graphNumber: '35',
        message: `Товар №${item.itemNumber}: для ЛЭП веса не заполняются`,
        severity: 'warning',
      });
    }
  }
  
  // Проверка квоты: только если есть ограничения
  if (item.quotaRemaining && !item.graph31?.description?.toLowerCase().includes('квот')) {
    errors.push({
      field: `${prefix}.quotaRemaining`,
      graphNumber: '39',
      message: `Товар №${item.itemNumber}: квота указывается только для товаров с количественными ограничениями`,
      severity: 'warning',
    });
  }
  
  return errors;
}

/**
 * Валидация графы 37 (Процедура)
 */
export function validateGraph37(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.items?.forEach((item, index) => {
    if (!item?.graph37?.procedureCode) return;
    
    const code = item.graph37.procedureCode;
    
    // Проверка формата: 7 цифр
    if (!/^\d{7}$/.test(code)) {
      errors.push({
        field: `items[${index}].graph37.procedureCode`,
        graphNumber: '37',
        message: `Товар №${item.itemNumber}: код процедуры должен содержать 7 цифр`,
        severity: 'error',
      });
      return;
    }
    
    // Проверка: первые 2 цифры = 10 (экспорт)
    if (!code.startsWith('10')) {
      errors.push({
        field: `items[${index}].graph37.procedureCode`,
        graphNumber: '37',
        message: `Товар №${item.itemNumber}: для экспорта код должен начинаться с "10"`,
        severity: 'error',
      });
    }
    
    // Проверка: если есть предшествующий режим, он должен быть != 00
    const previousRegime = code.substring(2, 4);
    if (previousRegime !== '00' && !item.previousDocuments?.length) {
      errors.push({
        field: `items[${index}].previousDocuments`,
        graphNumber: '40',
        message: `Товар №${item.itemNumber}: указан предшествующий режим "${previousRegime}", но нет предшествующих документов`,
        severity: 'warning',
      });
    }
  });
  
  return errors;
}

/**
 * Полная валидация декларации на экспорт
 */
export function validateExportDeclaration(data: ExportDeclarationDraft): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  // Валидация отдельных граф
  allErrors.push(...validateGraph1(data));
  allErrors.push(...validateGraph3(data));
  allErrors.push(...validateGraph5(data));
  allErrors.push(...validateGraph9(data));
  allErrors.push(...validateGraph12(data));
  allErrors.push(...validateGraph22(data));
  allErrors.push(...validateGraph30(data));
  allErrors.push(...validateGraph37(data));
  
  // Валидация товарных позиций
  data.items?.forEach((item, index) => {
    if (item) {
      allErrors.push(...validateCommodityItem(item, index, data.graph18?.transportType));
    }
  });
  
  // Разделение на ошибки и предупреждения
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===========================================
// УТИЛИТЫ
// ===========================================

/**
 * Проверка заполненности обязательных полей
 */
export function checkRequiredFields(data: ExportDeclarationDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Графа 2: Экспортер/Грузоотправитель (новая структура с ОКПО и ИНН)
  
  // Данные экспортера (обязательны всегда)
  if (!data.graph2?.exporterName) {
    errors.push({
      field: 'graph2.exporterName',
      graphNumber: '2',
      message: 'Укажите наименование/ФИО экспортера',
      severity: 'error',
    });
  }
  if (!data.graph2?.exporterOkpo) {
    errors.push({
      field: 'graph2.exporterOkpo',
      graphNumber: '2',
      message: 'Укажите код ОКПО экспортера',
      severity: 'error',
    });
  }
  if (!data.graph2?.exporterInn) {
    errors.push({
      field: 'graph2.exporterInn',
      graphNumber: '2',
      message: 'Укажите ИНН экспортера',
      severity: 'error',
    });
  }
  if (!data.graph2?.regionCode) {
    errors.push({
      field: 'graph2.regionCode',
      graphNumber: '2',
      message: 'Укажите код района',
      severity: 'error',
    });
  }
  
  // Для сценария same_person — адрес и телефон экспортера обязательны
  if (data.graph2?.scenario === 'same_person') {
    if (!data.graph2?.exporterAddress) {
      errors.push({
        field: 'graph2.exporterAddress',
        graphNumber: '2',
        message: 'Укажите адрес экспортера',
        severity: 'error',
      });
    }
    if (!data.graph2?.exporterPhone) {
      errors.push({
        field: 'graph2.exporterPhone',
        graphNumber: '2',
        message: 'Укажите телефон экспортера',
        severity: 'error',
      });
    }
    // Для физ. лиц — паспортные данные обязательны
    if (data.graph2?.exporterPersonType === 'individual') {
      if (!data.graph2?.exporterPassport?.series || !data.graph2?.exporterPassport?.number) {
        errors.push({
          field: 'graph2.exporterPassport',
          graphNumber: '2',
          message: 'Для физических лиц укажите паспортные данные',
          severity: 'error',
        });
      }
    }
  }
  
  // Проверка условных полей для сценария subdivision
  if (data.graph2?.scenario === 'subdivision') {
    if (!data.graph2?.parentOrgName) {
      errors.push({
        field: 'graph2.parentOrgName',
        graphNumber: '2',
        message: 'Для структурного подразделения укажите наименование головной организации',
        severity: 'error',
      });
    }
    if (!data.graph2?.parentOrgAddress) {
      errors.push({
        field: 'graph2.parentOrgAddress',
        graphNumber: '2',
        message: 'Для структурного подразделения укажите адрес головной организации',
        severity: 'error',
      });
    }
    if (!data.graph2?.parentOrgPhone) {
      errors.push({
        field: 'graph2.parentOrgPhone',
        graphNumber: '2',
        message: 'Для структурного подразделения укажите телефон головной организации',
        severity: 'error',
      });
    }
  }
  
  // Проверка условных полей для сценария different_persons
  if (data.graph2?.scenario === 'different_persons') {
    if (!data.graph2?.senderName) {
      errors.push({
        field: 'graph2.senderName',
        graphNumber: '2',
        message: 'Укажите наименование/ФИО грузоотправителя',
        severity: 'error',
      });
    }
    if (!data.graph2?.senderAddress) {
      errors.push({
        field: 'graph2.senderAddress',
        graphNumber: '2',
        message: 'Укажите адрес грузоотправителя',
        severity: 'error',
      });
    }
    if (!data.graph2?.senderPhone) {
      errors.push({
        field: 'graph2.senderPhone',
        graphNumber: '2',
        message: 'Укажите телефон грузоотправителя',
        severity: 'error',
      });
    }
    if (!data.graph2?.senderOkpo) {
      errors.push({
        field: 'graph2.senderOkpo',
        graphNumber: '2',
        message: 'Укажите код ОКПО грузоотправителя',
        severity: 'error',
      });
    }
    if (!data.graph2?.senderInn) {
      errors.push({
        field: 'graph2.senderInn',
        graphNumber: '2',
        message: 'Укажите ИНН грузоотправителя',
        severity: 'error',
      });
    }
  }
  
  // Графа 7: Таможенный пост
  if (!data.customsPostCode) {
    errors.push({
      field: 'customsPostCode',
      graphNumber: '7',
      message: 'Укажите код таможенного поста',
      severity: 'error',
    });
  }
  
  // Графа 8: Получатель
  if (!data.graph8?.name) {
    errors.push({
      field: 'graph8.name',
      graphNumber: '8',
      message: 'Укажите наименование получателя',
      severity: 'error',
    });
  }
  
  // Графа 14: Декларант
  if (!data.declarantName) {
    errors.push({
      field: 'declarantName',
      graphNumber: '14',
      message: 'Укажите наименование декларанта',
      severity: 'error',
    });
  }
  
  // Графа 17: Страна назначения
  if (!data.graph17?.countryName) {
    errors.push({
      field: 'graph17.countryName',
      graphNumber: '17',
      message: 'Укажите страну назначения',
      severity: 'error',
    });
  }
  
  // Графа 18: Транспорт
  if (!data.graph18?.transportType) {
    errors.push({
      field: 'graph18.transportType',
      graphNumber: '18',
      message: 'Укажите вид транспорта',
      severity: 'error',
    });
  }
  
  // Графа 29: Таможня на границе
  if (!data.borderCustomsPostCode) {
    errors.push({
      field: 'borderCustomsPostCode',
      graphNumber: '29',
      message: 'Укажите таможенный пост вывоза',
      severity: 'error',
    });
  }
  
  // Товарные позиции
  if (!data.items || data.items.length === 0) {
    errors.push({
      field: 'items',
      graphNumber: '31',
      message: 'Добавьте хотя бы один товар',
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * Расчёт процента заполненности декларации
 */
export function calculateCompleteness(data: ExportDeclarationDraft): number {
  let filled = 0;
  let total = 0;
  
  // Основные поля
  const checkField = (value: unknown) => {
    total++;
    if (value !== undefined && value !== null && value !== '') {
      filled++;
    }
  };
  
  // Графа 1
  checkField(data.graph1?.direction);
  checkField(data.graph1?.regimeCode);
  
  // Графа 2
  checkField(data.graph2?.name);
  checkField(data.graph2?.address);
  checkField(data.graph2?.inn);
  checkField(data.graph2?.regionCode);
  
  // Графы 3-14
  checkField(data.graph3?.currentSheet);
  checkField(data.totalItems);
  checkField(data.customsPostCode);
  checkField(data.graph8?.name);
  checkField(data.graph8?.countryCode);
  checkField(data.graph9?.name);
  checkField(data.graph11?.countryCode);
  checkField(data.totalCustomsValue);
  checkField(data.usdExchangeRate);
  checkField(data.declarantName);
  
  // Графы 17-30
  checkField(data.graph17?.countryName);
  checkField(data.graph18?.transportType);
  checkField(data.containerIndicator);
  checkField(data.graph20?.incotermsCode);
  checkField(data.contractCurrency);
  checkField(data.totalInvoiceValue);
  checkField(data.transactionNatureCode);
  checkField(data.borderTransportType);
  checkField(data.inlandTransportType);
  checkField(data.payerInn);
  checkField(data.borderCustomsPostCode);
  checkField(data.goodsLocation);
  
  // Товарные позиции
  data.items?.forEach(item => {
    checkField(item?.graph31?.description);
    checkField(item?.hsCode);
    checkField(item?.originCountryCode);
    checkField(item?.grossWeight);
    checkField(item?.netWeight);
    checkField(item?.graph37?.procedureCode);
    checkField(item?.invoiceValue);
    checkField(item?.customsValue);
    checkField(item?.statisticalValue);
  });
  
  // Графы 50, 54, С
  checkField(data.graph50?.fullName);
  checkField(data.graph54?.fillingPlace);
  checkField(data.graphC?.contractId);
  
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}
