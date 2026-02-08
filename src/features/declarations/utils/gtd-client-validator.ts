/**
 * GTD Client-side Validator
 * Валидация данных декларации на стороне клиента
 * для мгновенной обратной связи пользователю
 */

// ==========================================
// ТИПЫ
// ==========================================

export interface ClientValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ClientValidationResult {
  isValid: boolean;
  errors: ClientValidationError[];
  calculations: {
    totalItems: number;
    totalPackages: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    totalInvoiceValue: number;
    totalCustomsValue: number;
    additionalSheets: number;
  };
}

// ==========================================
// КОНСТАНТЫ
// ==========================================

// Инкотермс, требующие добавления транспортных расходов к таможенной стоимости
const INCOTERMS_ADD_TRANSPORT = ['EXW', 'FCA', 'FAS', 'FOB'];

// Коды товаров требующие акцизных документов (первые 4 цифры)
const EXCISE_HS_CODES = ['2203', '2204', '2205', '2206', '2207', '2208', '2402', '2403', '8703', '2710'];

// Коды товаров с льготным НДС
const VAT_EXEMPT_HS_CODES = ['0201', '0202', '0203', '0204', '0207', '0401', '0402', '0403', '0405', '0406', '1001', '1002', '1003', '1004', '1005', '1006', '3004'];

// ==========================================
// КЛИЕНТСКИЙ ВАЛИДАТОР
// ==========================================

export class GTDClientValidator {
  private errors: ClientValidationError[] = [];

  /**
   * Валидация веса: нетто <= брутто
   */
  validateWeight(netWeight: number, grossWeight: number, itemNumber?: number): ClientValidationError[] {
    const errors: ClientValidationError[] = [];
    const itemPrefix = itemNumber ? `Товар №${itemNumber}: ` : '';

    if (netWeight > grossWeight) {
      errors.push({
        field: itemNumber ? `items[${itemNumber}].netWeight` : 'netWeight',
        message: `${itemPrefix}Вес нетто (${netWeight} кг) не может превышать вес брутто (${grossWeight} кг)`,
        severity: 'error',
      });
    }

    if (netWeight <= 0 && grossWeight > 0) {
      errors.push({
        field: itemNumber ? `items[${itemNumber}].netWeight` : 'netWeight',
        message: `${itemPrefix}Вес нетто должен быть больше 0`,
        severity: 'error',
      });
    }

    if (grossWeight <= 0) {
      errors.push({
        field: itemNumber ? `items[${itemNumber}].grossWeight` : 'grossWeight',
        message: `${itemPrefix}Вес брутто должен быть больше 0`,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Расчет таможенной стоимости по Инкотермс
   * Графа 45 = Графа 42 + транспортные расходы (для F и E терминов)
   */
  calculateCustomsValue(params: {
    invoiceValue: number;
    incotermsCode: string;
    transportCosts?: number;
    insuranceCosts?: number;
    loadingCosts?: number;
    itemSharePercent?: number; // Доля товара в общей стоимости (0-100)
  }): number {
    const { invoiceValue, incotermsCode, transportCosts = 0, insuranceCosts = 0, loadingCosts = 0, itemSharePercent = 100 } = params;
    const incoterm = incotermsCode?.toUpperCase() || '';
    const shouldAddTransport = INCOTERMS_ADD_TRANSPORT.some(t => incoterm.startsWith(t));

    if (!shouldAddTransport) {
      return invoiceValue;
    }

    const totalTransportCosts = transportCosts + insuranceCosts + loadingCosts;
    const itemTransportShare = (totalTransportCosts * itemSharePercent) / 100;

    return Math.round((invoiceValue + itemTransportShare) * 100) / 100;
  }

  /**
   * Проверка требования документов для кода товара
   */
  checkHsCodeDocuments(hsCode: string): { exciseRequired: boolean; vatExempt: boolean } {
    const hsCode4 = hsCode?.substring(0, 4) || '';
    
    return {
      exciseRequired: EXCISE_HS_CODES.some(code => hsCode4.startsWith(code.substring(0, 4))),
      vatExempt: VAT_EXEMPT_HS_CODES.some(code => hsCode4.startsWith(code.substring(0, 4))),
    };
  }

  /**
   * Полная валидация формы декларации
   */
  validateForm(formData: {
    items?: Array<{
      itemNumber?: number;
      hsCode?: string;
      grossWeight?: number;
      netWeight?: number;
      invoiceValue?: number;
      customsValue?: number;
      packageQuantity?: number;
    }>;
    totalPackages?: number;
    totalItems?: number;
    incotermsCode?: string;
    transportCosts?: number;
    insuranceCosts?: number;
    loadingCosts?: number;
    currency?: string;
    exporterName?: string;
    consigneeName?: string;
  }): ClientValidationResult {
    this.errors = [];
    const items = formData.items || [];

    // Расчеты
    const totalItems = items.length;
    const totalPackages = items.reduce((sum, item) => sum + (item.packageQuantity || 1), 0);
    const totalGrossWeight = items.reduce((sum, item) => sum + (item.grossWeight || 0), 0);
    const totalNetWeight = items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
    const totalInvoiceValue = items.reduce((sum, item) => sum + (item.invoiceValue || 0), 0);
    const totalCustomsValue = items.reduce((sum, item) => sum + (item.customsValue || 0), 0);
    const additionalSheets = Math.max(0, totalItems - 1);

    // Валидация обязательных полей
    if (!formData.currency) {
      this.errors.push({
        field: 'currency',
        message: 'Не указана валюта (гр.22)',
        severity: 'error',
      });
    }

    if (!formData.incotermsCode) {
      this.errors.push({
        field: 'incotermsCode',
        message: 'Не указаны условия поставки (гр.20)',
        severity: 'error',
      });
    }

    if (!formData.exporterName) {
      this.errors.push({
        field: 'exporterName',
        message: 'Не указан экспортер (гр.2)',
        severity: 'error',
      });
    }

    if (!formData.consigneeName) {
      this.errors.push({
        field: 'consigneeName',
        message: 'Не указан получатель (гр.8)',
        severity: 'error',
      });
    }

    if (items.length === 0) {
      this.errors.push({
        field: 'items',
        message: 'Не указаны товарные позиции',
        severity: 'error',
      });
    }

    // Валидация каждого товара
    items.forEach((item, index) => {
      const itemNum = item.itemNumber || index + 1;

      // Валидация веса
      const weightErrors = this.validateWeight(
        item.netWeight || 0,
        item.grossWeight || 0,
        itemNum
      );
      this.errors.push(...weightErrors);

      // Валидация кода товара
      if (item.hsCode) {
        const docCheck = this.checkHsCodeDocuments(item.hsCode);
        if (docCheck.exciseRequired) {
          this.errors.push({
            field: `items[${itemNum}].documents`,
            message: `Товар №${itemNum}: Для кода ${item.hsCode} (подакцизный) требуется акцизное разрешение в графе 44`,
            severity: 'warning',
          });
        }
        if (docCheck.vatExempt) {
          this.errors.push({
            field: `items[${itemNum}].documents`,
            message: `Товар №${itemNum}: Для кода ${item.hsCode} рекомендуется сертификат льготного НДС`,
            severity: 'warning',
          });
        }
      }

      // Валидация таможенной стоимости
      if (formData.incotermsCode && item.invoiceValue) {
        const itemSharePercent = totalInvoiceValue > 0 
          ? (item.invoiceValue / totalInvoiceValue) * 100 
          : 100;
        
        const expectedCustomsValue = this.calculateCustomsValue({
          invoiceValue: item.invoiceValue,
          incotermsCode: formData.incotermsCode,
          transportCosts: formData.transportCosts,
          insuranceCosts: formData.insuranceCosts,
          loadingCosts: formData.loadingCosts,
          itemSharePercent,
        });

        const actualCustomsValue = item.customsValue || 0;
        const diff = Math.abs(expectedCustomsValue - actualCustomsValue);
        
        if (diff > 1 && actualCustomsValue > 0) {
          this.errors.push({
            field: `items[${itemNum}].customsValue`,
            message: `Товар №${itemNum}: Таможенная стоимость (${actualCustomsValue}) отличается от расчетной (${expectedCustomsValue.toFixed(2)}) по Инкотермс ${formData.incotermsCode}`,
            severity: 'warning',
          });
        }
      }
    });

    // Проверка агрегированных данных
    if (formData.totalItems !== undefined && formData.totalItems !== totalItems) {
      this.errors.push({
        field: 'totalItems',
        message: `Графа 5: указано ${formData.totalItems} наименований, фактически ${totalItems}`,
        severity: 'warning',
      });
    }

    if (formData.totalPackages !== undefined && formData.totalPackages !== totalPackages) {
      this.errors.push({
        field: 'totalPackages',
        message: `Графа 6: указано ${formData.totalPackages} мест, сумма по товарам ${totalPackages}`,
        severity: 'warning',
      });
    }

    // Общий вес
    if (totalNetWeight > totalGrossWeight) {
      this.errors.push({
        field: 'totalWeight',
        message: `Общий вес нетто (${totalNetWeight} кг) превышает общий вес брутто (${totalGrossWeight} кг)`,
        severity: 'error',
      });
    }

    return {
      isValid: this.errors.filter(e => e.severity === 'error').length === 0,
      errors: this.errors,
      calculations: {
        totalItems,
        totalPackages,
        totalGrossWeight,
        totalNetWeight,
        totalInvoiceValue,
        totalCustomsValue,
        additionalSheets,
      },
    };
  }

  /**
   * Форматирование графы 31 - Описание товара
   */
  formatField31(params: {
    description: string;
    quantity?: number;
    unitCode?: string;
    containerNumbers?: string[];
    packageQuantity?: number;
    packageType?: string;
  }, maxLength: number = 500): string {
    const parts: string[] = [];

    // 1) Описание товара
    if (params.description) {
      parts.push(params.description.trim());
    }

    // 2) Количество и единица измерения
    if (params.quantity && params.unitCode) {
      parts.push(`Кол-во: ${params.quantity} ${params.unitCode}`);
    }

    // 3) Номера контейнеров
    if (params.containerNumbers && params.containerNumbers.length > 0) {
      parts.push(`Контейнер: ${params.containerNumbers.join(', ')}`);
    }

    // 4) Упаковка
    if (params.packageQuantity && params.packageType) {
      parts.push(`Упаковка: ${params.packageQuantity} ${params.packageType}`);
    }

    // Склеиваем и обрезаем
    let result = parts.join('; ');
    if (result.length > maxLength) {
      result = result.substring(0, maxLength - 3) + '...';
    }

    return result;
  }
}

// Синглтон для удобства использования
export const gtdValidator = new GTDClientValidator();

// ==========================================
// ХУКИ ДЛЯ REACT
// ==========================================

/**
 * Хук для валидации в реальном времени
 */
export function useGTDValidation() {
  const validator = new GTDClientValidator();

  return {
    validateWeight: validator.validateWeight.bind(validator),
    calculateCustomsValue: validator.calculateCustomsValue.bind(validator),
    checkHsCodeDocuments: validator.checkHsCodeDocuments.bind(validator),
    validateForm: validator.validateForm.bind(validator),
    formatField31: validator.formatField31.bind(validator),
  };
}

/**
 * Валидация одного поля веса
 */
export function validateWeightField(netWeight: number, grossWeight: number): string | null {
  if (netWeight > grossWeight) {
    return `Вес нетто (${netWeight} кг) не может превышать вес брутто (${grossWeight} кг)`;
  }
  return null;
}

/**
 * Расчет таможенной стоимости
 */
export function calculateCustomsValueByIncoterms(
  invoiceValue: number,
  incotermsCode: string,
  transportCosts: number = 0
): number {
  const validator = new GTDClientValidator();
  return validator.calculateCustomsValue({
    invoiceValue,
    incotermsCode,
    transportCosts,
  });
}
