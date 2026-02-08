import type { AIExtractedData, AIItemData } from '@/server/services/anthropic.service';
import type { GTDExtractedData } from '@/server/services/ai-document-analyzer';
import type { DeclarationDraftFormData } from '../schemas/declaration-blocks-1-20.schema';

// Тип для объединения старого и нового формата AI данных
export type AnyAIExtractedData = AIExtractedData | GTDExtractedData;

/**
 * Проверяет является ли объект новым форматом GTDExtractedData
 */
function isGTDFormat(data: AnyAIExtractedData): data is GTDExtractedData {
  return 'delivery' in data || 'dispatchCountryCode' in data;
}

// Карта названий стран к ISO кодам
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'uzbekistan': 'UZ', 'узбекистан': 'UZ', 'uz': 'UZ', '860': 'UZ',
  'kazakhstan': 'KZ', 'казахстан': 'KZ', 'kz': 'KZ', '398': 'KZ',
  'russia': 'RU', 'россия': 'RU', 'russian federation': 'RU', 'ru': 'RU', '643': 'RU',
  'china': 'CN', 'китай': 'CN', 'cn': 'CN', '156': 'CN',
  'turkey': 'TR', 'турция': 'TR', 'tr': 'TR', '792': 'TR',
  'germany': 'DE', 'германия': 'DE', 'de': 'DE', '276': 'DE',
  'usa': 'US', 'сша': 'US', 'united states': 'US', 'us': 'US', '840': 'US',
  'kyrgyzstan': 'KG', 'кыргызстан': 'KG', 'kg': 'KG', '417': 'KG',
  'tajikistan': 'TJ', 'таджикистан': 'TJ', 'tj': 'TJ', '762': 'TJ',
  'turkmenistan': 'TM', 'туркменистан': 'TM', 'tm': 'TM', '795': 'TM',
  'afghanistan': 'AF', 'афганистан': 'AF', 'af': 'AF', '004': 'AF',
  'iran': 'IR', 'иран': 'IR', 'ir': 'IR', '364': 'IR',
  'india': 'IN', 'индия': 'IN', 'in': 'IN', '356': 'IN',
  'pakistan': 'PK', 'пакистан': 'PK', 'pk': 'PK', '586': 'PK',
  'ukraine': 'UA', 'украина': 'UA', 'ua': 'UA', '804': 'UA',
  'belarus': 'BY', 'беларусь': 'BY', 'by': 'BY', '112': 'BY',
  'azerbaijan': 'AZ', 'азербайджан': 'AZ', 'az': 'AZ', '031': 'AZ',
  'georgia': 'GE', 'грузия': 'GE', 'ge': 'GE', '268': 'GE',
  'armenia': 'AM', 'армения': 'AM', 'am': 'AM', '051': 'AM',
  'moldova': 'MD', 'молдова': 'MD', 'md': 'MD', '498': 'MD',
  'latvia': 'LV', 'латвия': 'LV', 'lv': 'LV', '428': 'LV',
  'lithuania': 'LT', 'литва': 'LT', 'lt': 'LT', '440': 'LT',
  'estonia': 'EE', 'эстония': 'EE', 'ee': 'EE', '233': 'EE',
  'poland': 'PL', 'польша': 'PL', 'pl': 'PL', '616': 'PL',
  'italy': 'IT', 'италия': 'IT', 'it': 'IT', '380': 'IT',
  'france': 'FR', 'франция': 'FR', 'fr': 'FR', '250': 'FR',
  'spain': 'ES', 'испания': 'ES', 'es': 'ES', '724': 'ES',
  'uk': 'GB', 'великобритания': 'GB', 'united kingdom': 'GB', 'gb': 'GB', '826': 'GB',
  'japan': 'JP', 'япония': 'JP', 'jp': 'JP', '392': 'JP',
  'korea': 'KR', 'корея': 'KR', 'south korea': 'KR', 'kr': 'KR', '410': 'KR',
  'uae': 'AE', 'оаэ': 'AE', 'united arab emirates': 'AE', 'ae': 'AE', '784': 'AE',
  'saudi arabia': 'SA', 'саудовская аравия': 'SA', 'sa': 'SA', '682': 'SA',
  'netherlands': 'NL', 'нидерланды': 'NL', 'nl': 'NL', '528': 'NL',
  'belgium': 'BE', 'бельгия': 'BE', 'be': 'BE', '056': 'BE',
  'austria': 'AT', 'австрия': 'AT', 'at': 'AT', '040': 'AT',
  'switzerland': 'CH', 'швейцария': 'CH', 'ch': 'CH', '756': 'CH',
};

// Карта названий валют к ISO кодам  
const CURRENCY_NAME_TO_CODE: Record<string, string> = {
  'dollar': 'USD', 'доллар': 'USD', 'us dollar': 'USD', 'usd': 'USD', '$': 'USD',
  'euro': 'EUR', 'евро': 'EUR', 'eur': 'EUR', '€': 'EUR',
  'ruble': 'RUB', 'рубль': 'RUB', 'rub': 'RUB', '₽': 'RUB',
  'sum': 'UZS', 'сум': 'UZS', 'uzs': 'UZS',
  'yuan': 'CNY', 'юань': 'CNY', 'cny': 'CNY', 'rmb': 'CNY', '¥': 'CNY',
  'yen': 'JPY', 'йена': 'JPY', 'jpy': 'JPY',
  'pound': 'GBP', 'фунт': 'GBP', 'gbp': 'GBP', '£': 'GBP',
  'tenge': 'KZT', 'тенге': 'KZT', 'kzt': 'KZT',
};

/**
 * Нормализует код страны (из названия или уже готового кода)
 */
function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const cleaned = value.trim().toLowerCase();
  
  // Если уже 2-буквенный код
  if (/^[a-z]{2}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  // Ищем в карте названий
  const code = COUNTRY_NAME_TO_CODE[cleaned];
  if (code) return code;
  
  // Если не нашли и длина > 2, возвращаем null (нельзя сохранить)
  if (cleaned.length > 2) {
    console.warn(`Unknown country: ${value}, cannot convert to code`);
    return null;
  }
  
  return cleaned.toUpperCase();
}

/**
 * Нормализует код валюты
 */
function normalizeCurrencyCode(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const cleaned = value.trim().toLowerCase();
  
  // Если уже 3-буквенный код
  if (/^[a-z]{3}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  // Ищем в карте названий
  const code = CURRENCY_NAME_TO_CODE[cleaned];
  if (code) return code;
  
  // Если не нашли и длина > 3, возвращаем USD по умолчанию
  if (cleaned.length > 3) {
    console.warn(`Unknown currency: ${value}, defaulting to USD`);
    return 'USD';
  }
  
  return cleaned.toUpperCase();
}

/**
 * Нормализует код Incoterms
 */
function normalizeIncoterms(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const cleaned = value.trim().toUpperCase();
  
  // Извлекаем первые 3 буквы (стандартные коды Incoterms)
  const match = cleaned.match(/^(EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)/);
  if (match) return match[1];
  
  // Если длина <= 3, возвращаем как есть
  if (cleaned.length <= 3) return cleaned;
  
  return null;
}

/**
 * Обрезает строку до максимальной длины
 */
function truncateString(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength);
}

/**
 * Разделяет полную строку на название компании и адрес
 * Учитывает что название может содержать запятые (CO., LTD и т.д.)
 */
function splitNameAndAddress(fullText: string): { name: string; address: string | null } {
  if (!fullText) return { name: '', address: null };
  
  // Паттерны которые обычно начинают адрес
  const addressPatterns = [
    /(?:,\s*)?(No\.?\s*\d)/i,           // No.568 или No 568
    /(?:,\s*)?(\d+\s*[a-z]?\s*,)/i,     // 54 h, или 123,
    /(?:,\s*)?(Add(?:ress)?[.:]\s*)/i,  // Add: или Address:
    /(?:,\s*)?(\d+\s+\w+\s+(?:street|road|avenue|blvd|st\.|rd\.|ave\.))/i, // 123 Main Street
    /(?:\.\s+)(No\.?\s*\d)/i,           // После точки: . No.568
  ];
  
  let splitIndex = -1;
  
  for (const pattern of addressPatterns) {
    const match = fullText.match(pattern);
    if (match && match.index !== undefined) {
      // Находим индекс где начинается адрес
      splitIndex = match.index;
      // Если паттерн начинается с ", " - убираем запятую из имени
      if (fullText[splitIndex] === ',') {
        splitIndex = splitIndex;
      }
      break;
    }
  }
  
  if (splitIndex > 0) {
    let name = fullText.substring(0, splitIndex).trim();
    let address = fullText.substring(splitIndex).trim();
    
    // Убираем ведущие запятые и точки из адреса
    address = address.replace(/^[,.\s]+/, '').trim();
    // Убираем завершающие запятые и точки из имени
    name = name.replace(/[,.\s]+$/, '').trim();
    
    return { name, address: address || null };
  }
  
  // Если не нашли паттерн адреса - ищем по окончанию названия компании
  const companyEndPatterns = [
    /((?:CO\.?,?\s*)?LTD\.?)\s*[,.]?\s*/i,  // CO., LTD или LTD
    /(LLC)\s*[,.]?\s*/i,                     // LLC
    /(INC\.?)\s*[,.]?\s*/i,                  // INC
    /(CORP\.?)\s*[,.]?\s*/i,                 // CORP
    /(ООО)\s*[,.]?\s*/i,                     // ООО
    /(МЧЖ)\s*[,.]?\s*/i,                     // МЧЖ
    /(ЗАО)\s*[,.]?\s*/i,                     // ЗАО
    /(ОАО)\s*[,.]?\s*/i,                     // ОАО
    /(АО)\s*[,.]?\s*/i,                      // АО
  ];
  
  for (const pattern of companyEndPatterns) {
    const match = fullText.match(pattern);
    if (match && match.index !== undefined) {
      const endOfName = match.index + match[0].length;
      if (endOfName < fullText.length - 5) { // Есть ещё текст после
        let name = fullText.substring(0, endOfName).trim();
        let address = fullText.substring(endOfName).trim();
        
        // Убираем ведущие запятые и точки
        address = address.replace(/^[,.\s]+/, '').trim();
        name = name.replace(/[,.\s]+$/, '').trim();
        
        if (address) {
          return { name, address };
        }
      }
    }
  }
  
  // Если ничего не нашли - возвращаем всё как имя
  return { name: fullText.trim(), address: null };
}

/**
 * Нормализует ИНН (только цифры, макс 9)
 */
function normalizeINN(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.substring(0, 9) || null;
}

/**
 * Нормализует код страны ТС (из цифрового кода в ISO)
 */
function normalizeVehicleCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const cleaned = value.trim();
  
  // Если это цифровой код - конвертируем
  const numToIso: Record<string, string> = {
    '860': 'UZ', '398': 'KZ', '643': 'RU', '156': 'CN', '417': 'KG', '762': 'TJ', '795': 'TM',
  };
  
  if (numToIso[cleaned]) {
    return numToIso[cleaned];
  }
  
  // Если уже 2-буквенный код
  if (/^[A-Z]{2}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  return normalizeCountryCode(cleaned);
}

/**
 * Интерфейс для товара в новом формате GTD
 */
interface GTDItemData {
  description: string | null;
  hsCode: string | null;
  originCountryCode: string | null;
  grossWeight: number | null;
  netWeight: number | null;
  quantity: number | null;
  unitCode: string | null;
  price: number | null;
  currencyCode: string | null;
  customsValue: number | null;
  procedureCode: string | null;
  vinNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  yearOfManufacture?: string | null;
  condition?: 'new' | 'used' | null;
}

/**
 * Нормализует данные товара от AI (поддерживает оба формата)
 * Возвращает данные в формате, совместимом с формой gtd-official-form
 * @param item - данные товара от AI
 * @param index - индекс товара (0-based)
 * @param documentsString - строка документов для блока 44 (опционально)
 */
export function normalizeItemData(
  item: AIItemData | GTDItemData,
  index: number,
  documentsString?: string
): Record<string, unknown> {
  console.log(`=== normalizeItemData item #${index + 1} ===`);
  console.log('Input item:', JSON.stringify(item, null, 2));
  console.log('documentsString:', documentsString);
  
  // Проверяем формат данных
  const isNewFormat = 'currencyCode' in item || 'originCountryCode' in item;
  console.log('isNewFormat:', isNewFormat);

  if (isNewFormat) {
    const gtdItem = item as GTDItemData;
    const countryCode = normalizeCountryCode(gtdItem.originCountryCode);
    
    // Формируем описание с VIN если есть
    let description = gtdItem.description || 'Товар';
    if (gtdItem.vinNumber) {
      // Добавляем VIN в описание если его там нет
      if (!description.toLowerCase().includes(gtdItem.vinNumber.toLowerCase())) {
        description = `${description}, VIN: ${gtdItem.vinNumber}`;
      }
    }
    if (gtdItem.brand && !description.toLowerCase().includes(gtdItem.brand.toLowerCase())) {
      description = `${gtdItem.brand} ${description}`;
    }
    if (gtdItem.yearOfManufacture && !description.includes(gtdItem.yearOfManufacture)) {
      description = `${description}, ${gtdItem.yearOfManufacture} г.в.`;
    }
    if (gtdItem.condition === 'new' && !description.toLowerCase().includes('новый') && !description.toLowerCase().includes('new')) {
      description = `${description}, новый`;
    } else if (gtdItem.condition === 'used' && !description.toLowerCase().includes('б/у') && !description.toLowerCase().includes('used')) {
      description = `${description}, б/у`;
    }
    
    return {
      itemNumber: index + 1,
      // Блок 31 - описание товара (форма использует goodsDescription!)
      goodsDescription: truncateString(description, 2000),
      description: truncateString(description, 2000), // дублируем для совместимости
      packagingType: 'ящик', // форма использует packagingType, не packageType
      packageQuantity: 1,
      marking: gtdItem.vinNumber || '', // VIN как маркировка
      marksNumbers: gtdItem.vinNumber || '', // для другой формы
      // Блок 33 - код ТН ВЭД
      hsCode: gtdItem.hsCode ? gtdItem.hsCode.replace(/\D/g, '').substring(0, 10).padEnd(10, '0') : '',
      // Блок 34 - страна происхождения
      originCountryCode: countryCode || 'CN',
      // Блок 35, 38 - вес
      grossWeight: gtdItem.grossWeight || 0,
      netWeight: gtdItem.netWeight || (gtdItem.grossWeight ? Math.round(gtdItem.grossWeight * 0.95 * 100) / 100 : 0),
      // Блок 41 - доп. единицы
      quantity: gtdItem.quantity || 1,
      supplementaryQuantity: gtdItem.quantity || 1,
      supplementaryUnit: gtdItem.unitCode || '796', // штуки по умолчанию
      // Блок 42, 45 - стоимость (форма использует itemPrice!)
      itemPrice: gtdItem.price || 0,
      customsValue: gtdItem.customsValue || gtdItem.price || 0,
      statisticalValue: 0, // рассчитывается автоматически
      // Блок 37 - процедура
      procedureCode: gtdItem.procedureCode || '40',
      previousProcedureCode: '00',
      movementCode: '000',
      // Блок 36 - преференции (пустые по умолчанию)
      prefFee: '',
      prefDuty: '',
      prefExcise: '',
      prefVat: '',
      // Блок 39 - квота
      quotaNumber: '0',
      // Блок 40 - предыдущий документ
      previousDocument: '/0/',
      // Блок 43 - метод оценки
      valuationMethodCode: '0',
      // Блок 44 - доп. информация (документы)
      additionalInfo: documentsString || '',
      // Блок 47 - платежи (по умолчанию)
      feeBase: 0,
      feeRate: '4 БРВ',
      feeAmount: 0,
      feePaymentMethod: 'БН',
      dutyType: '20',
      dutyBase: 0,
      dutyRate: '0%',
      dutyAmount: 0,
      dutyPaymentMethod: 'БН',
      vatType: '70',
      vatBase: 0,
      vatRate: '12%',
      vatAmount: 0,
      vatPaymentMethod: 'БН',
      totalPayment: 0,
      // Блок 48-49
      deferredPayment: '0',
      warehouseName: '0',
    };
  }

  // Старый формат AIItemData
  const legacyItem = item as AIItemData;
  const countryCode = normalizeCountryCode(legacyItem.origin);
  
  // Формируем описание с VIN если есть
  let description = legacyItem.description || 'Товар';
  if (legacyItem.vinNumber) {
    if (!description.toLowerCase().includes(legacyItem.vinNumber.toLowerCase())) {
      description = `${description}, VIN: ${legacyItem.vinNumber}`;
    }
  }
  if (legacyItem.brand && !description.toLowerCase().includes(legacyItem.brand.toLowerCase())) {
    description = `${legacyItem.brand} ${description}`;
  }
  
  return {
    itemNumber: index + 1,
    // Блок 31
    goodsDescription: truncateString(description, 2000),
    description: truncateString(description, 2000),
    packagingType: 'ящик',
    packageQuantity: 1,
    marking: legacyItem.vinNumber || '',
    marksNumbers: legacyItem.vinNumber || '',
    // Блок 33
    hsCode: legacyItem.hsCode ? legacyItem.hsCode.replace(/\D/g, '').substring(0, 10).padEnd(10, '0') : '',
    // Блок 34
    originCountryCode: countryCode || 'CN',
    // Блоки 35, 38
    grossWeight: legacyItem.weight || 0,
    netWeight: legacyItem.weight ? Math.round(legacyItem.weight * 0.95 * 100) / 100 : 0,
    // Блок 41
    quantity: legacyItem.quantity || 1,
    supplementaryQuantity: legacyItem.quantity || 1,
    supplementaryUnit: '796',
    // Блок 42, 45
    itemPrice: legacyItem.price || 0,
    customsValue: legacyItem.price || 0,
    statisticalValue: 0,
    // Блок 37
    procedureCode: '40',
    previousProcedureCode: '00',
    movementCode: '000',
    // Остальные поля по умолчанию
    prefFee: '',
    prefDuty: '',
    prefExcise: '',
    prefVat: '',
    quotaNumber: '0',
    previousDocument: '/0/',
    valuationMethodCode: '0',
    additionalInfo: documentsString || '',
    feeBase: 0,
    feeRate: '4 БРВ',
    feeAmount: 0,
    feePaymentMethod: 'БН',
    dutyType: '20',
    dutyBase: 0,
    dutyRate: '0%',
    dutyAmount: 0,
    dutyPaymentMethod: 'БН',
    vatType: '70',
    vatBase: 0,
    vatRate: '12%',
    vatAmount: 0,
    vatPaymentMethod: 'БН',
    totalPayment: 0,
    deferredPayment: '0',
    warehouseName: '0',
  };
}

export interface AutofillField {
  fieldName: string;
  label: string;
  value: unknown;
  confidence: number;
  source: string; // Какой документ предоставил значение
}

export interface AutofillResult {
  fields: AutofillField[];
  formData: Partial<DeclarationDraftFormData>;
  itemsData: AIItemData[];
  unmappedData: Record<string, unknown>;
}

/**
 * Маппит данные от AI на поля формы ГТД
 * Поддерживает оба формата: старый (AIExtractedData) и новый (GTDExtractedData)
 * НЕ перезаписывает поля которые уже заполнены пользователем
 */
export function mapAIDataToFormFields(
  aiData: AnyAIExtractedData,
  currentFormData: Partial<DeclarationDraftFormData>,
  options: {
    overwriteExisting?: boolean;
    minConfidence?: number;
  } = {}
): AutofillResult {
  const { overwriteExisting = false, minConfidence = 0 } = options;
  const baseConfidence = aiData.confidence;

  const fields: AutofillField[] = [];
  const formData: Partial<DeclarationDraftFormData> = {};
  const unmappedData: Record<string, unknown> = {};

  // Пропускаем если уверенность ниже порога
  if (baseConfidence < minConfidence) {
    return {
      fields: [],
      formData: {},
      itemsData: [],
      unmappedData: { skippedDueToLowConfidence: true },
    };
  }

  // Функция для безопасного добавления поля
  const addField = (
    fieldName: keyof DeclarationDraftFormData,
    label: string,
    value: unknown,
    confidence: number = baseConfidence,
    source: string = 'AI'
  ) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Проверяем, заполнено ли поле пользователем
    const currentValue = currentFormData[fieldName];
    const isFieldFilled =
      currentValue !== undefined &&
      currentValue !== null &&
      currentValue !== '' &&
      !(Array.isArray(currentValue) && currentValue.length === 0);

    if (isFieldFilled && !overwriteExisting) {
      // Не перезаписываем, но добавляем в список для отображения
      fields.push({
        fieldName,
        label,
        value,
        confidence,
        source: `${source} (не применено - поле уже заполнено)`,
      });
      return;
    }

    fields.push({
      fieldName,
      label,
      value,
      confidence,
      source,
    });

    // @ts-expect-error - dynamic assignment
    formData[fieldName] = value;
  };

  // Проверяем формат данных и используем соответствующий маппинг
  if (isGTDFormat(aiData)) {
    // ========================================
    // НОВЫЙ ФОРМАТ GTDExtractedData (ПОЛНАЯ ВЕРСИЯ)
    // ========================================

    // Блок 1 - Тип декларации
    addField('declarationType', 'Тип декларации', aiData.declarationType, baseConfidence, 'AI анализ');
    addField('declarationTypeCode', 'Код режима', aiData.declarationTypeCode, baseConfidence, 'AI анализ');

    // Блок 2 - Экспортер (форма ГТД использует ОДНО поле для названия и адреса!)
    if (aiData.exporter) {
      let fullNameAndAddress = '';
      
      if ('nameAndAddress' in aiData.exporter && aiData.exporter.nameAndAddress) {
        // Уже объединённое - используем как есть
        fullNameAndAddress = aiData.exporter.nameAndAddress;
      } else {
        // Объединяем name + address
        const exp = aiData.exporter as { name?: string; address?: string };
        if (exp.name) {
          fullNameAndAddress = exp.name;
          if (exp.address) {
            fullNameAndAddress += '\n' + exp.address;
          }
        }
      }
      
      if (fullNameAndAddress) {
        addField('exporterName', 'Экспортер (наименование и адрес)', truncateString(fullNameAndAddress, 500), baseConfidence, 'Инвойс');
      }
      addField('exporterCountry', 'Страна экспортера', normalizeCountryCode(aiData.exporter.countryCode), baseConfidence, 'Инвойс');
      if (aiData.exporter.tin) {
        addField('exporterTin', 'ИНН экспортера', normalizeINN(aiData.exporter.tin), baseConfidence, 'Инвойс');
      }
    }

    // Блок 8 - Получатель (форма ГТД использует ОДНО поле для названия и адреса!)
    if (aiData.consignee) {
      let fullNameAndAddress = '';
      
      if ('nameAndAddress' in aiData.consignee && aiData.consignee.nameAndAddress) {
        // Уже объединённое - используем как есть
        fullNameAndAddress = aiData.consignee.nameAndAddress;
      } else {
        // Объединяем name + address
        const cons = aiData.consignee as { name?: string; address?: string };
        if (cons.name) {
          fullNameAndAddress = cons.name;
          if (cons.address) {
            fullNameAndAddress += '\n' + cons.address;
          }
        }
      }
      
      if (fullNameAndAddress) {
        addField('consigneeName', 'Получатель (наименование и адрес)', truncateString(fullNameAndAddress, 500), baseConfidence, 'Инвойс');
      }
      addField('consigneeCountry', 'Страна получателя', normalizeCountryCode(aiData.consignee.countryCode), baseConfidence, 'Инвойс');
      // ИНН получателя - важное поле для узбекских компаний
      if (aiData.consignee.tin) {
        addField('consigneeTin', 'ИНН получателя', normalizeINN(aiData.consignee.tin), baseConfidence, 'Инвойс');
      }
    }

    // Блок 9 - Финансово ответственное лицо
    if (aiData.financialResponsible) {
      if ('nameAndAddress' in aiData.financialResponsible && aiData.financialResponsible.nameAndAddress) {
        const fullText = aiData.financialResponsible.nameAndAddress;
        const { name, address } = splitNameAndAddress(fullText);
        addField('financialResponsibleName', 'Имя фин. ответственного', truncateString(name, 200), baseConfidence, 'Контракт');
        if (address) {
          addField('financialResponsibleAddress', 'Адрес фин. ответственного', truncateString(address, 500), baseConfidence, 'Контракт');
        }
      }
      if (aiData.financialResponsible.tin) {
        addField('financialResponsibleTin', 'ИНН фин. ответственного', normalizeINN(aiData.financialResponsible.tin), baseConfidence, 'Контракт');
      }
    }

    // Блок 14 - Декларант
    if (aiData.declarant) {
      if ('nameAndAddress' in aiData.declarant && aiData.declarant.nameAndAddress) {
        const fullText = aiData.declarant.nameAndAddress;
        const { name, address } = splitNameAndAddress(fullText);
        addField('declarantName', 'Наименование декларанта', truncateString(name, 200), baseConfidence, 'Контракт');
        if (address) {
          addField('declarantAddress', 'Адрес декларанта', truncateString(address, 500), baseConfidence, 'Контракт');
        }
      } else {
        const decl = aiData.declarant as { name?: string; address?: string };
        if (decl.name) addField('declarantName', 'Наименование декларанта', truncateString(decl.name, 200), baseConfidence, 'Контракт');
        if (decl.address) addField('declarantAddress', 'Адрес декларанта', truncateString(decl.address, 500), baseConfidence, 'Контракт');
      }
      addField('declarantTin', 'ИНН декларанта', normalizeINN(aiData.declarant.tin), baseConfidence, 'Контракт');
      if ('isBroker' in aiData.declarant && aiData.declarant.isBroker) {
        addField('declarantType', 'Тип декларанта', 'BROKER', baseConfidence, 'AI анализ');
      }
    }

    // Блок 10-11 - Страны торговли
    addField('firstDestinationCountry', 'Первая страна назначения (гр.10)', aiData.firstDestinationCountry, baseConfidence, 'CMR');
    addField('tradingCountry', 'Код торгующей страны (гр.11)', normalizeCountryCode(aiData.tradingCountryCode), baseConfidence, 'Контракт');
    addField('offshoreIndicator', 'Признак оффшора', aiData.offshoreIndicator || '2', baseConfidence, 'AI анализ');

    // Блоки 15-17 - Страны
    addField('dispatchCountry', 'Страна отправления (гр.15)', normalizeCountryCode(aiData.dispatchCountryCode), baseConfidence, 'CMR');
    addField('dispatchCountryNumCode', 'Код страны отправления (гр.15а)', aiData.dispatchCountryNumCode, baseConfidence, 'CMR');
    addField('originCountry', 'Страна происхождения (гр.16)', normalizeCountryCode(aiData.originCountryCode), baseConfidence, 'Сертификат');
    addField('destinationCountry', 'Страна назначения (гр.17)', normalizeCountryCode(aiData.destinationCountryCode), baseConfidence, 'CMR');
    addField('destinationCountryNumCode', 'Код страны назначения (гр.17а)', aiData.destinationCountryNumCode, baseConfidence, 'CMR');

    // Блок 18 - Транспорт при отправлении
    if (aiData.transportDeparture) {
      // Количество ТС
      addField('transportCount', 'Количество ТС (гр.18)', aiData.transportDeparture.count || 1, baseConfidence, 'CMR');
      
      // Тип транспорта: преобразуем текст в код
      let transportTypeCode = '30'; // По умолчанию - автомобильный
      const typeText = aiData.transportDeparture.type?.toUpperCase() || '';
      // ВАЖНО: Сначала проверяем САМОХОД (код 90), потом АВТО (код 30)
      if (typeText.includes('САМОХОД') || typeText === '90') {
        transportTypeCode = '90'; // Самоходом
      } else if (typeText.includes('АВТО') || typeText.includes('TRUCK') || typeText.includes('ROAD') || typeText === '30') {
        transportTypeCode = '30'; // Автомобильный
      } else if (typeText.includes('ЖД') || typeText.includes('RAIL') || typeText.includes('ПОЕЗД') || typeText === '20') {
        transportTypeCode = '20'; // Железнодорожный
      } else if (typeText.includes('МОР') || typeText.includes('SEA') || typeText.includes('SHIP') || typeText === '10') {
        transportTypeCode = '10'; // Морской
      } else if (typeText.includes('ВОЗДУШ') || typeText.includes('AIR') || typeText.includes('САМОЛЁТ') || typeText.includes('АВИА') || typeText === '40') {
        transportTypeCode = '40'; // Авиационный
      } else if (typeText.includes('ПОЧТ') || typeText === '50') {
        transportTypeCode = '50'; // Почтовое отправление
      } else if (typeText.includes('ТРУБОПРОВОД') || typeText === '71') {
        transportTypeCode = '71'; // Трубопроводный
      } else if (typeText.includes('РЕЧ') || typeText.includes('RIVER') || typeText === '80') {
        transportTypeCode = '80'; // Речной
      }
      addField('departureTransportType', 'Тип транспорта', transportTypeCode, baseConfidence, 'CMR');
      
      // Госномер и прицеп
      if (aiData.transportDeparture.vehicles && aiData.transportDeparture.vehicles.length > 0) {
        const firstVehicle = aiData.transportDeparture.vehicles[0];
        
        // Формируем строку: госномер / прицеп
        let transportNumber = firstVehicle.plateNumber || '';
        if (firstVehicle.trailerNumber) {
          transportNumber += ' / ' + firstVehicle.trailerNumber;
        }
        if (transportNumber) {
          addField('departureTransportNumber', 'Госномер ТС', transportNumber, baseConfidence, 'CMR');
        }
        
        // Страна регистрации ТС
        const vehicleCountry = normalizeVehicleCountry(firstVehicle.countryCode);
        if (vehicleCountry) {
          addField('transportNationality', 'Страна регистрации ТС', vehicleCountry, baseConfidence, 'CMR');
        }
      }
    }

    // Блок 19 - Контейнер
    addField('containerIndicator', 'Контейнерная перевозка (гр.19)', aiData.containerIndicator, baseConfidence, 'CMR');

    // Блок 20 - Условия поставки
    if (aiData.delivery) {
      addField('incotermsNumCode', 'Код Incoterms (гр.20)', aiData.delivery.incotermsNumCode, baseConfidence, 'Инвойс');
      addField('incoterms', 'Условия поставки', aiData.delivery.incotermsCode, baseConfidence, 'Инвойс');
      addField('deliveryPlace', 'Место доставки', truncateString(aiData.delivery.place, 255), baseConfidence, 'Контракт');
      addField('paymentFormCode', 'Форма расчётов', aiData.delivery.paymentFormCode, baseConfidence * 0.9, 'Контракт');
      addField('shipmentFormCode', 'Форма отправки', aiData.delivery.shipmentFormCode || '01', baseConfidence * 0.9, 'AI анализ');
    }

    // Блок 21 - Транспорт на границе
    if (aiData.transportBorder) {
      addField('borderTransportSameAsDeparture', 'ТС на границе = ТС отправления', aiData.transportBorder.sameAsDeparture, baseConfidence, 'CMR');
    }

    // Блоки 22-24 - Валюта и финансы
    addField('invoiceCurrency', 'Валюта счета (гр.22)', normalizeCurrencyCode(aiData.invoiceCurrency), baseConfidence, 'Инвойс');
    addField('totalInvoiceAmount', 'Общая фактурная стоимость', aiData.totalInvoiceAmount, baseConfidence, 'Инвойс');
    addField('transactionNature', 'Характер сделки (гр.24)', aiData.transactionNatureCode, baseConfidence * 0.9, 'Контракт');

    // Блоки 25-26 - Вид транспорта
    addField('borderTransportMode', 'Вид транспорта на границе (гр.25)', aiData.borderTransportMode, baseConfidence, 'CMR');
    addField('inlandTransportMode', 'Вид транспорта внутри (гр.26)', aiData.inlandTransportMode, baseConfidence, 'CMR');

    // Блок 27 - Место погрузки
    addField('loadingPlace', 'Место погрузки (гр.27)', aiData.loadingPlace, baseConfidence * 0.8, 'CMR');

    // Блок 28 - Банковские реквизиты (структурированные)
    if (aiData.bankDetails) {
      addField('bankTin', 'ИНН продавца', aiData.bankDetails.tin, baseConfidence, 'Контракт');
      addField('bankMfo', 'МФО банка', aiData.bankDetails.mfo, baseConfidence, 'Контракт');
      addField('bankName', 'Название банка', aiData.bankDetails.bankName, baseConfidence, 'Контракт');
      addField('bankAddress', 'Адрес банка', aiData.bankDetails.bankAddress, baseConfidence * 0.9, 'Контракт');
    }

    // Блоки 29-30
    addField('borderCustomsCode', 'Код таможни на границе (гр.29)', aiData.borderCustomsCode, baseConfidence * 0.8, 'CMR');
    addField('goodsLocationCode', 'Код местонахождения (гр.30)', aiData.goodsLocationCode, baseConfidence * 0.8, 'CMR');
    addField('goodsLocationAddress', 'Адрес местонахождения товаров', aiData.goodsLocationAddress, baseConfidence * 0.8, 'CMR');

    // Блок 44 - Документы (сохраняем для добавления к каждому товару)
    let documentsString = '';
    if (aiData.documents && aiData.documents.length > 0) {
      documentsString = aiData.documents.map(d => 
        `${d.code} ${d.shortName} № ${d.number || 'Б/Н'} от ${d.date || 'дата'}`
      ).join('; ');
      // Также сохраняем на уровне декларации для справки
      unmappedData.documentsString = documentsString;
    }

    // Блок 50 - Доверитель
    if (aiData.principal) {
      addField('principalPosition', 'Должность доверителя', aiData.principal.position, baseConfidence, 'Контракт');
      addField('principalName', 'ФИО доверителя', aiData.principal.name, baseConfidence, 'Контракт');
      addField('principalTin', 'ИНН организации', normalizeINN(aiData.principal.tin), baseConfidence, 'Контракт');
    }

    // Блок 54 - Место и дата
    if (aiData.declarationDetails) {
      addField('declarationPlace', 'Место подачи', aiData.declarationDetails.place, baseConfidence * 0.9, 'AI анализ');
      addField('declarantSignature', 'ФИО подписанта', aiData.declarationDetails.signatoryName, baseConfidence, 'Контракт');
      addField('declarantPhone', 'Телефон', aiData.declarationDetails.phone, baseConfidence * 0.9, 'Контракт');
    }

    // Документ
    addField('referenceNumber', 'Номер документа', aiData.documentNumber, baseConfidence, 'Документ');
    if (aiData.documentDate) {
      unmappedData.documentDate = aiData.documentDate;
    }

    // Общая таможенная стоимость (сумма всех товаров)
    if (aiData.items && aiData.items.length > 0) {
      const totalCustomsValue = aiData.items.reduce((sum, item) => sum + (item.customsValue || item.price || 0), 0);
      addField('totalCustomsValue', 'Общая таможенная стоимость (гр.12)', totalCustomsValue, baseConfidence, 'Расчёт');
    }

    // Конвертируем товары в расширенный формат
    const legacyItems: AIItemData[] = aiData.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      weight: item.grossWeight,
      price: item.price,
      currency: item.currencyCode,
      origin: item.originCountryCode,
      hsCode: item.hsCode,
    }));

    // Сохраняем расширенные данные товаров
    unmappedData.extendedItems = aiData.items;

    return {
      fields,
      formData,
      itemsData: legacyItems,
      unmappedData,
    };
  }

  // ========================================
  // СТАРЫЙ ФОРМАТ AIExtractedData
  // ========================================
  
  // Блок 2 - Экспортер (форма ГТД использует ОДНО поле для названия и адреса!)
  if (aiData.exporter) {
    let fullNameAndAddress = '';
    if (aiData.exporter.name) {
      fullNameAndAddress = aiData.exporter.name;
      if (aiData.exporter.address) {
        fullNameAndAddress += '\n' + aiData.exporter.address;
      }
    }
    if (fullNameAndAddress) {
      addField('exporterName', 'Экспортер (наименование и адрес)', truncateString(fullNameAndAddress, 500), baseConfidence, 'Commercial Invoice');
    }
    
    const exporterCountryCode = normalizeCountryCode(aiData.exporter.country);
    if (exporterCountryCode) {
      addField('exporterCountry', 'Страна экспортера', exporterCountryCode, baseConfidence, 'Commercial Invoice');
      addField('dispatchCountry', 'Страна отправления', exporterCountryCode, baseConfidence * 0.95, 'Commercial Invoice');
    }
  }

  // Блок 8 - Грузополучатель (форма ГТД использует ОДНО поле для названия и адреса!)
  if (aiData.consignee) {
    let fullNameAndAddress = '';
    if (aiData.consignee.name) {
      fullNameAndAddress = aiData.consignee.name;
      if (aiData.consignee.address) {
        fullNameAndAddress += '\n' + aiData.consignee.address;
      }
    }
    if (fullNameAndAddress) {
      addField('consigneeName', 'Получатель (наименование и адрес)', truncateString(fullNameAndAddress, 500), baseConfidence, 'Commercial Invoice');
    }
    addField('consigneeTin', 'ИНН грузополучателя', normalizeINN(aiData.consignee.tin), baseConfidence * 0.95, 'Commercial Invoice');
    
    const consigneeCountryCode = normalizeCountryCode(aiData.consignee.country) || 'UZ';
    addField('consigneeCountry', 'Страна грузополучателя', consigneeCountryCode, baseConfidence, 'Commercial Invoice');
  }

  // Финансовая информация
  if (aiData.financial) {
    if (aiData.financial.totalAmount) {
      addField('totalCustomsValue', 'Общая таможенная стоимость', aiData.financial.totalAmount, baseConfidence, 'Commercial Invoice');
    }
    
    const currencyCode = normalizeCurrencyCode(aiData.financial.currency);
    if (currencyCode) {
      addField('currency', 'Валюта', currencyCode, baseConfidence, 'Commercial Invoice');
    }
    
    const incotermsCode = normalizeIncoterms(aiData.financial.incoterms);
    if (incotermsCode) {
      addField('incoterms', 'Условия поставки (Incoterms)', incotermsCode, baseConfidence * 0.95, 'Commercial Invoice');
    }
  }

  // Транспорт
  if (aiData.transport) {
    // Контейнеры
    if (aiData.transport.containerNumbers && aiData.transport.containerNumbers.length > 0) {
      const validContainers = aiData.transport.containerNumbers.filter((num) => /^[A-Z]{4}\d{7}$/.test(num));
      if (validContainers.length > 0) {
        addField('containerNumbers', 'Номера контейнеров', validContainers, baseConfidence * 0.85, 'Bill of Lading');
      }
    }
    
    // Госномера ТС из CMR
    if (aiData.transport.vehiclePlates && aiData.transport.vehiclePlates.length > 0) {
      const plates = aiData.transport.vehiclePlates;
      // Первый номер - основной ТС, второй - прицеп
      let transportNumber = plates[0];
      if (plates[1]) {
        transportNumber += ' / ' + plates[1];
      }
      addField('departureTransportNumber', 'Госномер ТС', transportNumber, baseConfidence, 'CMR');
    }
    
    // Тип транспорта
    if (aiData.transport.mode) {
      let transportTypeCode = '30'; // По умолчанию - автомобильный
      const modeUpper = aiData.transport.mode.toUpperCase();
      // ВАЖНО: Сначала проверяем САМОХОД (код 90), потом АВТО (код 30)
      if (modeUpper.includes('САМОХОД') || modeUpper === '90') {
        transportTypeCode = '90'; // Самоходом
      } else if (modeUpper.includes('ROAD') || modeUpper.includes('TRUCK') || modeUpper.includes('AUTO') || modeUpper.includes('АВТО')) {
        transportTypeCode = '30'; // Автомобильный
      } else if (modeUpper.includes('RAIL') || modeUpper.includes('TRAIN') || modeUpper.includes('ЖД')) {
        transportTypeCode = '20'; // Железнодорожный
      } else if (modeUpper.includes('SEA') || modeUpper.includes('SHIP') || modeUpper.includes('МОР')) {
        transportTypeCode = '10'; // Морской
      } else if (modeUpper.includes('AIR') || modeUpper.includes('АВИА')) {
        transportTypeCode = '40'; // Авиационный
      } else if (modeUpper.includes('RIVER') || modeUpper.includes('РЕЧ')) {
        transportTypeCode = '80'; // Речной
      }
      addField('departureTransportType', 'Тип транспорта', transportTypeCode, baseConfidence, 'CMR');
      addField('transportCount', 'Количество ТС', 1, baseConfidence * 0.9, 'CMR');
    }
  }

  // Страна происхождения из товаров
  if (aiData.items && aiData.items.length > 0) {
    const firstItemOrigin = aiData.items[0]?.origin;
    const originCountryCode = normalizeCountryCode(firstItemOrigin);
    if (originCountryCode) {
      addField('originCountry', 'Страна происхождения', originCountryCode, baseConfidence * 0.9, 'Commercial Invoice');
    }

    const tradingCountryCode = normalizeCountryCode(aiData.exporter?.country);
    if (tradingCountryCode) {
      addField('tradingCountry', 'Торговая страна', tradingCountryCode, baseConfidence * 0.85, 'Commercial Invoice');
    }
  }

  if (aiData.documentNumber) {
    addField('referenceNumber', 'Справочный номер', aiData.documentNumber, baseConfidence, 'Commercial Invoice');
  }

  if (aiData.documentDate) {
    unmappedData.documentDate = aiData.documentDate;
  }

  return {
    fields,
    formData,
    itemsData: aiData.items || [],
    unmappedData,
  };
}

/**
 * Создает объект с подсказками для полей
 */
export function createFieldHints(
  fields: AutofillField[]
): Record<string, { value: unknown; confidence: number; hint: string }> {
  const hints: Record<string, { value: unknown; confidence: number; hint: string }> = {};

  for (const field of fields) {
    hints[field.fieldName] = {
      value: field.value,
      confidence: field.confidence,
      hint: `AI предлагает: ${field.value} (уверенность: ${Math.round(field.confidence * 100)}%)`,
    };
  }

  return hints;
}

/**
 * Фильтрует поля по уровню уверенности
 */
export function filterFieldsByConfidence(
  fields: AutofillField[],
  minConfidence: number
): AutofillField[] {
  return fields.filter((f) => f.confidence >= minConfidence);
}

/**
 * Группирует поля по источнику
 */
export function groupFieldsBySource(
  fields: AutofillField[]
): Record<string, AutofillField[]> {
  return fields.reduce(
    (groups, field) => {
      const source = field.source.split(' (')[0]; // Убираем пометку "(не применено)"
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(field);
      return groups;
    },
    {} as Record<string, AutofillField[]>
  );
}

/**
 * Проверяет, были ли применены данные AI
 */
export function hasAppliedAIData(formData: Partial<DeclarationDraftFormData>): boolean {
  return Object.keys(formData).length > 0;
}
