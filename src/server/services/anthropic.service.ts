import Anthropic from '@anthropic-ai/sdk';

// Типы для AI обработки
export interface AIExporterData {
  name: string | null;
  address: string | null;
  country: string | null;
}

export interface AIConsigneeData {
  name: string | null;
  address: string | null;
  tin: string | null;
  country: string | null;
}

export interface AIItemData {
  description: string | null;
  quantity: number | null;
  weight: number | null;
  price: number | null;
  currency: string | null;
  origin: string | null;
  hsCode?: string | null;
  vinNumber?: string | null;
  brand?: string | null;
  model?: string | null;
}

export interface AIFinancialData {
  totalAmount: number | null;
  currency: string | null;
  incoterms: string | null;
  deliveryPlace?: string | null;
}

export interface AITransportData {
  mode: string | null;
  containerNumbers: string[];
  vehiclePlates?: string[];
}

export interface AIExtractedData {
  exporter: AIExporterData | null;
  consignee: AIConsigneeData | null;
  items: AIItemData[];
  financial: AIFinancialData | null;
  transport: AITransportData | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  confidence: number;
}

export interface HSCodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
}

export interface HSCodeSuggestionsResponse {
  suggestedCodes: HSCodeSuggestion[];
}

export type DocumentTypeForAI =
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'AIR_WAYBILL'
  | 'CMR'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'CONTRACT'
  | 'QUALITY_CERTIFICATE'
  | 'LICENSE'
  | 'OTHER';

interface AnalyzeDocumentParams {
  documentContent: string;
  documentType: DocumentTypeForAI;
  isImage?: boolean;
  mimeType?: string;
  context?: string;
}

interface AnalyzeDocumentResult {
  data: AIExtractedData;
  tokensUsed: number;
  processingTime: number;
}

interface SuggestHSCodeResult {
  data: HSCodeSuggestionsResponse;
  tokensUsed: number;
}

class AnthropicService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Анализирует документ и извлекает данные для ГТД
   */
  async analyzeDocument(params: AnalyzeDocumentParams): Promise<AnalyzeDocumentResult> {
    const { documentContent, documentType, isImage, mimeType, context } = params;
    const startTime = Date.now();

    const systemPrompt = `Ты - эксперт по таможенному оформлению Узбекистана. 
Твоя задача - анализировать документы и извлекать ВСЮ информацию для заполнения ГТД (Грузовой Таможенной Декларации).

КРИТИЧЕСКИ ВАЖНО - извлекай АБСОЛЮТНО ВСЕ данные БЕЗ СОКРАЩЕНИЙ!

ПРАВИЛА ДЛЯ НАЗВАНИЙ И АДРЕСОВ КОМПАНИЙ:
- Поле "name" = ПОЛНОЕ название компании (включая CO., LTD, LLC, ООО, МЧЖ)
  Пример: "WEIQIAO SMART AUTO INTERNATIONAL CO., LTD" (НЕ сокращай до "WEIQIAO SMART AUTO")
- Поле "address" = ПОЛНЫЙ адрес со ВСЕМИ деталями
  Пример: "No.568, Jiushui East Road, Qingdao City, Shandong Province, China"
  Пример: "54 h, THAY street, Bunyadabad MFY, Sergeli district, Tashkent, Uzbekistan"

НЕ СОКРАЩАЙ ДАННЫЕ! Извлекай ВСЁ что написано в документе!

Правила:
- ИНН (TIN) для Узбекистана должен быть 9 цифр
- Коды стран в ISO формате (2 буквы, например: UZ, RU, CN, US)
- Цены в числовом формате без символов валюты
- Если информации нет - используй null
- Укажи confidence (уверенность) от 0 до 1

ОСОБЫЕ ПРАВИЛА ДЛЯ АВТОМОБИЛЕЙ:
- VIN номер = 17 символов (например: HJ4BACDH6SN055258)
- Для КАЖДОГО VIN создай ОТДЕЛЬНЫЙ товар в массиве items!
- Если 5 автомобилей с 5 VIN → 5 items!
- Описание должно включать: марку, модель, тип кузова, объём двигателя, мощность

ОСОБЫЕ ПРАВИЛА ДЛЯ CMR:
- Блок 1: Отправитель → exporter
- Блок 2: Получатель → consignee  
- Блок 25: Госномера ТС → transport.vehiclePlates (массив!)
  * Ищи номера около подписей внизу CMR
  * "881FY02/92ANY02" → vehiclePlates: ["881FY02", "92ANY02"]
  * Первый номер = тягач, второй = прицеп
- Тип перевозки: "BY TRUCK" → transport.mode: "ROAD"
- HS CODE: → hsCode для товаров
- Общий вес → weight (разделить на количество единиц)

ОСОБЫЕ ПРАВИЛА ДЛЯ ИНВОЙСА:
- Seller → exporter (для иностранных компаний tin=null)
- Buyer/Sold to → consignee:
  * Если адрес содержит Uzbekistan/Tashkent → ОБЯЗАТЕЛЬНО ищи ИНН!
  * ИНН = 9 цифр, ищи ВЕЗДЕ в документе:
    - В печатях и штампах внизу документа
    - Рядом с подписью покупателя
    - В банковских реквизитах
    - После "ИНН:", "TIN:", "СТИР:"
    - Любое 9-значное число начинающееся с 2,3,4,5
- QTY → quantity
- U.PRICE → цена за единицу
- AMOUNT → общая сумма
- FCA/DAP/FOB + город → incoterms
- VIN номера → отдельный item для каждого!
- Bank details → ищи ИНН, МФО банка
- НИЖНЯЯ ЧАСТЬ ДОКУМЕНТА: печати, подписи, ИНН!

- Всегда отвечай ТОЛЬКО валидным JSON без дополнительного текста`;

    const userPrompt = `Проанализируй этот документ (${this.getDocumentTypeName(documentType)}) и извлеки ВСЮ информацию для заполнения ГТД.

${context ? `Контекст декларации: ${context}\n` : ''}
${!isImage ? `Содержимое документа:\n${documentContent}` : 'Изображение документа приложено.'}

КРИТИЧЕСКИ ВАЖНО:
1. Извлеки ВСЕ VIN номера (17-значные коды типа HJ4BACDH6SN055258)
2. Для КАЖДОГО VIN создай ОТДЕЛЬНЫЙ item!
3. Извлеки HS коды (коды ТН ВЭД)
4. Извлеки веса, количества, цены
5. Извлеки госномера транспорта
6. Извлеки условия поставки (Incoterms) и место
7. ИНН ПОКУПАТЕЛЯ - ИЩИ ОЧЕНЬ ВНИМАТЕЛЬНО:
   - ИНН = 9 цифр для узбекских компаний
   - Смотри НИЖНЮЮ часть инвойса - там печати и подписи!
   - В КРУГЛЫХ ПЕЧАТЯХ компании-покупателя есть ИНН
   - Рядом с "укобитица соктоу хоймоси" (узб. печать) 
   - Рядом с "Тоўдарам" (реквизиты на узб.)
   - Около подписи "Директор", "Manager"
   - 9-значное число начинающееся с цифр 2, 3, 4, 5

ОБЯЗАТЕЛЬНО: Бери ПОЛНЫЕ названия и адреса! НЕ СОКРАЩАЙ!

Верни JSON со следующей структурой:
{
  "exporter": { 
    "name": "WEIQIAO SMART AUTO INTERNATIONAL CO., LTD", 
    "address": "No.568, Jiushui East Road, Qingdao City, Shandong Province, China", 
    "country": "CN" 
  },
  "consignee": { 
    "name": "AUTOCENTER LLC", 
    "address": "54 h, THAY street, Bunyadabad MFY, Sergeli district, Tashkent, Uzbekistan", 
    "tin": "304567891",
    "country": "UZ"
  },
  "items": [
    {
      "description": "212 T01 SUV, BAW2033CGB1 RUSSIA VERSION, GASOLINE ENGINE:2.0T,170KW,EURO V",
      "quantity": 1,
      "weight": 1821.1,
      "price": 19245.00,
      "currency": "USD",
      "origin": "CN",
      "hsCode": "8703220009",
      "vinNumber": "HJ4BACDH6SN055258"
    },
    {
      "description": "212 T01 SUV, BAW2033CGB1 RUSSIA VERSION, GASOLINE ENGINE:2.0T,170KW,EURO V",
      "quantity": 1,
      "weight": 1821.1,
      "price": 19245.00,
      "currency": "USD",
      "origin": "CN",
      "hsCode": "8703220009",
      "vinNumber": "HJ4BACDH0SN057135"
    }
  ],
  "financial": {
    "totalAmount": 96225.00,
    "currency": "USD",
    "incoterms": "FCA",
    "deliveryPlace": "KHORGOS"
  },
  "transport": {
    "mode": "ROAD",
    "vehiclePlates": ["881FY02", "92ANY02"],
    "containerNumbers": []
  },
  "documentNumber": "BAW202506067-3",
  "documentDate": "2025-08-12",
  "confidence": 0.95
}

ВАЖНО: Если 5 VIN номеров → создай 5 отдельных items с одинаковым описанием но разными vinNumber!`;

    try {
      let response;

      if (isImage && mimeType) {
        // Для изображений используем vision API
        const validMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ] as const;
        const mediaType = validMimeTypes.includes(mimeType as (typeof validMimeTypes)[number])
          ? (mimeType as (typeof validMimeTypes)[number])
          : 'image/jpeg';

        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.1,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: documentContent,
                  },
                },
                {
                  type: 'text',
                  text: userPrompt,
                },
              ],
            },
          ],
        });
      } else {
        // Для текстовых документов
        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.1,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });
      }

      const processingTime = Date.now() - startTime;
      const tokensUsed =
        (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      // Извлекаем текст ответа
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Парсим JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const data = JSON.parse(jsonMatch[0]) as AIExtractedData;

      return {
        data,
        tokensUsed,
        processingTime,
      };
    } catch (error) {
      console.error('Error analyzing document with Claude:', error);
      throw error;
    }
  }

  /**
   * Предлагает коды ТН ВЭД для товара
   */
  async suggestHSCode(description: string): Promise<SuggestHSCodeResult> {
    const systemPrompt = `Ты эксперт по ТН ВЭД ЕАЭС и таможенной классификации товаров.
Твоя задача - определить правильный 10-значный код ТН ВЭД для товаров.

Правила:
- Код должен быть 10 цифр
- Предложи 2-3 наиболее подходящих кода
- Для каждого кода укажи уверенность от 0 до 1
- Объясни логику выбора кода
- Отвечай ТОЛЬКО валидным JSON`;

    const userPrompt = `Определи 10-значный код ТН ВЭД для следующего товара:

Описание: ${description}

Верни JSON:
{
  "suggestedCodes": [
    {
      "code": "0000000000",
      "description": "описание товарной позиции",
      "confidence": 0.95,
      "reasoning": "объяснение почему выбран этот код"
    }
  ]
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const tokensUsed =
        (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const data = JSON.parse(jsonMatch[0]) as HSCodeSuggestionsResponse;

      return {
        data,
        tokensUsed,
      };
    } catch (error) {
      console.error('Error suggesting HS code with Claude:', error);
      throw error;
    }
  }

  private getDocumentTypeName(type: DocumentTypeForAI): string {
    const names: Record<DocumentTypeForAI, string> = {
      COMMERCIAL_INVOICE: 'Коммерческий инвойс (Commercial Invoice)',
      PACKING_LIST: 'Упаковочный лист (Packing List)',
      BILL_OF_LADING: 'Коносамент (Bill of Lading)',
      AIR_WAYBILL: 'Авиационная накладная (Air Waybill)',
      CMR: 'CMR накладная',
      CERTIFICATE_OF_ORIGIN: 'Сертификат происхождения',
      CONTRACT: 'Контракт',
      QUALITY_CERTIFICATE: 'Сертификат качества',
      LICENSE: 'Лицензия',
      OTHER: 'Документ',
    };
    return names[type] || 'Документ';
  }
}

// Singleton instance
let anthropicServiceInstance: AnthropicService | null = null;

export function getAnthropicService(): AnthropicService {
  if (!anthropicServiceInstance) {
    anthropicServiceInstance = new AnthropicService();
  }
  return anthropicServiceInstance;
}

export { AnthropicService };
