import type { AIExtractedData, AIItemData } from '../services/anthropic.service';

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validatedData: AIExtractedData;
}

export interface ConfidenceLevel {
  level: 'high' | 'medium' | 'low';
  color: string;
  description: string;
}

/**
 * Определяет уровень уверенности
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) {
    return {
      level: 'high',
      color: 'green',
      description: 'Высокая уверенность',
    };
  }
  if (confidence >= 0.7) {
    return {
      level: 'medium',
      color: 'yellow',
      description: 'Средняя уверенность - рекомендуется проверить',
    };
  }
  return {
    level: 'low',
    color: 'red',
    description: 'Низкая уверенность - требуется проверка',
  };
}

/**
 * Валидирует ИНН Узбекистана (9 цифр)
 */
function validateUzbekistanTIN(tin: string | null): boolean {
  if (!tin) return true; // null допустим
  return /^\d{9}$/.test(tin);
}

/**
 * Валидирует код страны (2 буквы ISO)
 */
function validateCountryCode(code: string | null): boolean {
  if (!code) return true;
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}

/**
 * Валидирует код валюты (3 буквы ISO)
 */
function validateCurrencyCode(code: string | null): boolean {
  if (!code) return true;
  return /^[A-Z]{3}$/.test(code.toUpperCase());
}

/**
 * Валидирует числовое значение
 */
function validateNumber(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Валидирует дату в формате YYYY-MM-DD
 */
function validateDate(date: string | null): boolean {
  if (!date) return true;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Валидирует код ТН ВЭД (10 цифр)
 */
function validateHSCode(code: string | null | undefined): boolean {
  if (!code) return true;
  return /^\d{10}$/.test(code);
}

/**
 * Нормализует код страны в верхний регистр
 */
function normalizeCountryCode(code: string | null): string | null {
  return code ? code.toUpperCase() : null;
}

/**
 * Нормализует код валюты в верхний регистр
 */
function normalizeCurrencyCode(code: string | null): string | null {
  return code ? code.toUpperCase() : null;
}

/**
 * Валидирует данные извлеченные AI
 */
export function validateAIExtractedData(data: AIExtractedData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Клонируем данные для нормализации
  const validatedData: AIExtractedData = JSON.parse(JSON.stringify(data));

  // Валидация exporter
  if (data.exporter) {
    if (!validateCountryCode(data.exporter.country)) {
      errors.push({
        field: 'exporter.country',
        message: 'Код страны должен быть 2 буквы (ISO)',
        value: data.exporter.country,
      });
    } else if (validatedData.exporter) {
      validatedData.exporter.country = normalizeCountryCode(data.exporter.country);
    }
  }

  // Валидация consignee
  if (data.consignee) {
    if (!validateUzbekistanTIN(data.consignee.tin)) {
      errors.push({
        field: 'consignee.tin',
        message: 'ИНН Узбекистана должен быть 9 цифр',
        value: data.consignee.tin,
      });
    }

    if (!validateCountryCode(data.consignee.country)) {
      errors.push({
        field: 'consignee.country',
        message: 'Код страны должен быть 2 буквы (ISO)',
        value: data.consignee.country,
      });
    } else if (validatedData.consignee) {
      validatedData.consignee.country = normalizeCountryCode(data.consignee.country);
    }
  }

  // Валидация items
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!validateNumber(item.quantity)) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'Количество должно быть числом',
          value: item.quantity,
        });
      }

      if (!validateNumber(item.weight)) {
        errors.push({
          field: `items[${index}].weight`,
          message: 'Вес должен быть числом',
          value: item.weight,
        });
      }

      if (!validateNumber(item.price)) {
        errors.push({
          field: `items[${index}].price`,
          message: 'Цена должна быть числом',
          value: item.price,
        });
      }

      if (!validateCurrencyCode(item.currency)) {
        errors.push({
          field: `items[${index}].currency`,
          message: 'Код валюты должен быть 3 буквы (ISO)',
          value: item.currency,
        });
      } else if (validatedData.items[index]) {
        validatedData.items[index].currency = normalizeCurrencyCode(item.currency);
      }

      if (!validateCountryCode(item.origin)) {
        errors.push({
          field: `items[${index}].origin`,
          message: 'Код страны происхождения должен быть 2 буквы (ISO)',
          value: item.origin,
        });
      } else if (validatedData.items[index]) {
        validatedData.items[index].origin = normalizeCountryCode(item.origin);
      }

      if (!validateHSCode(item.hsCode)) {
        warnings.push({
          field: `items[${index}].hsCode`,
          message: 'Код ТН ВЭД должен быть 10 цифр',
          value: item.hsCode,
        });
      }

      // Предупреждения для пустых важных полей
      if (!item.description) {
        warnings.push({
          field: `items[${index}].description`,
          message: 'Отсутствует описание товара',
          value: item.description,
        });
      }
    });
  }

  // Валидация financial
  if (data.financial) {
    if (!validateNumber(data.financial.totalAmount)) {
      errors.push({
        field: 'financial.totalAmount',
        message: 'Общая сумма должна быть числом',
        value: data.financial.totalAmount,
      });
    }

    if (!validateCurrencyCode(data.financial.currency)) {
      errors.push({
        field: 'financial.currency',
        message: 'Код валюты должен быть 3 буквы (ISO)',
        value: data.financial.currency,
      });
    } else if (validatedData.financial) {
      validatedData.financial.currency = normalizeCurrencyCode(data.financial.currency);
    }
  }

  // Валидация documentDate
  if (data.documentDate && !validateDate(data.documentDate)) {
    errors.push({
      field: 'documentDate',
      message: 'Дата документа должна быть в формате YYYY-MM-DD',
      value: data.documentDate,
    });
  }

  // Проверка confidence
  if (data.confidence < 0.7) {
    warnings.push({
      field: 'confidence',
      message: 'Низкий уровень уверенности AI - рекомендуется ручная проверка',
      value: data.confidence,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedData,
  };
}

/**
 * Объединяет данные из нескольких документов
 */
export function mergeExtractedData(dataArray: AIExtractedData[]): AIExtractedData {
  if (dataArray.length === 0) {
    throw new Error('No data to merge');
  }

  if (dataArray.length === 1) {
    return dataArray[0];
  }

  // Находим данные с наибольшей уверенностью для каждого поля
  const merged: AIExtractedData = {
    exporter: null,
    consignee: null,
    items: [],
    financial: null,
    transport: null,
    confidence: 0,
  };

  let maxExporterConfidence = 0;
  let maxConsigneeConfidence = 0;
  let maxFinancialConfidence = 0;
  let maxTransportConfidence = 0;

  for (const data of dataArray) {
    // Экспортер
    if (data.exporter && data.confidence > maxExporterConfidence) {
      merged.exporter = data.exporter;
      maxExporterConfidence = data.confidence;
    }

    // Получатель
    if (data.consignee && data.confidence > maxConsigneeConfidence) {
      merged.consignee = data.consignee;
      maxConsigneeConfidence = data.confidence;
    }

    // Финансы
    if (data.financial && data.confidence > maxFinancialConfidence) {
      merged.financial = data.financial;
      maxFinancialConfidence = data.confidence;
    }

    // Транспорт
    if (data.transport && data.confidence > maxTransportConfidence) {
      merged.transport = data.transport;
      maxTransportConfidence = data.confidence;
    }

    // Товары - объединяем все уникальные
    if (data.items) {
      for (const item of data.items) {
        const isDuplicate = merged.items.some(
          (existing) =>
            existing.description === item.description && existing.price === item.price
        );
        if (!isDuplicate) {
          merged.items.push(item);
        }
      }
    }

    // Документ
    if (data.documentNumber && !merged.documentNumber) {
      merged.documentNumber = data.documentNumber;
    }
    if (data.documentDate && !merged.documentDate) {
      merged.documentDate = data.documentDate;
    }
  }

  // Средняя уверенность
  merged.confidence =
    dataArray.reduce((sum, d) => sum + d.confidence, 0) / dataArray.length;

  return merged;
}

/**
 * Вычисляет confidence для каждого поля
 */
export function calculateFieldConfidences(
  data: AIExtractedData
): Record<string, number> {
  const baseConfidence = data.confidence;

  return {
    'exporter.name': data.exporter?.name ? baseConfidence : 0,
    'exporter.address': data.exporter?.address ? baseConfidence * 0.9 : 0,
    'exporter.country': data.exporter?.country ? baseConfidence : 0,
    'consignee.name': data.consignee?.name ? baseConfidence : 0,
    'consignee.address': data.consignee?.address ? baseConfidence * 0.9 : 0,
    'consignee.tin': data.consignee?.tin ? baseConfidence * 0.95 : 0,
    'consignee.country': data.consignee?.country ? baseConfidence : 0,
    'financial.totalAmount': data.financial?.totalAmount ? baseConfidence : 0,
    'financial.currency': data.financial?.currency ? baseConfidence : 0,
    'financial.incoterms': data.financial?.incoterms ? baseConfidence * 0.95 : 0,
    'transport.mode': data.transport?.mode ? baseConfidence * 0.9 : 0,
    'transport.containerNumbers':
      data.transport?.containerNumbers?.length ? baseConfidence * 0.85 : 0,
    documentNumber: data.documentNumber ? baseConfidence : 0,
    documentDate: data.documentDate ? baseConfidence : 0,
  };
}
