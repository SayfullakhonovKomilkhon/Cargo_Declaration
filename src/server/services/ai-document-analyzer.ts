import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/server/db/client';

/**
 * Справочные данные из БД для сопоставления с AI
 */
interface ReferenceData {
  countries: Array<{ code: string; nameEn: string; nameRu: string }>;
  currencies: Array<{ code: string; name: string }>;
  deliveryTerms: Array<{ code: string; name: string; description: string }>;
  transportModes: Array<{ code: string; name: string }>;
  hsCodes: Array<{ code: string; description: string; descriptionUz: string }>;
  customsOffices: Array<{ code: string; name: string }>;
  units: Array<{ code: string; name: string; symbol: string }>;
}

/**
 * Таможенные режимы Узбекистана
 */
export const CUSTOMS_REGIMES_FOR_AI = [
  { code: '10', name: 'Экспорт', type: 'EXPORT' },
  { code: '11', name: 'Реэкспорт', type: 'REEXPORT' },
  { code: '12', name: 'Временный вывоз', type: 'TEMP_EXPORT' },
  { code: '40', name: 'Выпуск для свободного обращения (импорт)', type: 'IMPORT' },
  { code: '41', name: 'Реимпорт', type: 'REIMPORT' },
  { code: '42', name: 'Временный ввоз', type: 'TEMP_IMPORT' },
  { code: '51', name: 'Переработка на таможенной территории', type: 'PROCESSING_IN' },
  { code: '61', name: 'Переработка вне таможенной территории', type: 'PROCESSING_OUT' },
  { code: '70', name: 'Временное хранение', type: 'TEMP_STORAGE' },
  { code: '71', name: 'Свободная таможенная зона', type: 'FREE_ZONE' },
  { code: '72', name: 'Беспошлинная торговля', type: 'DUTY_FREE' },
  { code: '73', name: 'Свободный склад', type: 'FREE_WAREHOUSE' },
  { code: '74', name: 'Таможенный склад', type: 'CUSTOMS_WAREHOUSE' },
  { code: '75', name: 'Отказ в пользу государства', type: 'STATE_ABANDON' },
  { code: '76', name: 'Уничтожение', type: 'DESTRUCTION' },
  { code: '80', name: 'Таможенный транзит', type: 'TRANSIT' },
] as const;

/**
 * Структура извлеченных данных для ГТД - ПОЛНАЯ ВЕРСИЯ
 */
export interface GTDExtractedData {
  // Блок 1 - Тип декларации
  declarationType: string | null;       // Тип режима: ЭК, ИМ, ТР, РИ, РЭ, ВВ, ВЭ, ПВ, ПЭ, СТ, БТ, ТС, СВХ, ОГ, УН, ТТ
  declarationTypeCode: string | null;   // Код режима (10, 40, 80, etc.)
  declarationSubCode: string | null;    // Подкод режима (если есть)
  
  // Блок 2 - Экспортер/Отправитель (объединённое имя+адрес)
  exporter: {
    nameAndAddress: string | null;      // Полное наименование + адрес в одном поле
    countryCode: string | null;         // Код страны ISO (2 буквы) или 3-значный код
    countryNumCode: string | null;      // 3-значный цифровой код страны (860 для UZ)
    tin: string | null;                 // ИНН 9 цифр для UZ
  } | null;

  // Блок 8 - Получатель/Иностранный партнёр
  consignee: {
    nameAndAddress: string | null;      // Полное наименование + адрес
    countryCode: string | null;
    countryNumCode: string | null;
    tin: string | null;                 // Пустой для иностранных компаний!
  } | null;

  // Блок 9 - Лицо, ответственное за финансовое урегулирование
  financialResponsible: {
    nameAndAddress: string | null;
    tin: string | null;
    copyFrom: '2' | '8' | null;         // Копировать из блока 2 или 8
  } | null;

  // Блок 14 - Декларант/Таможенный брокер
  declarant: {
    nameAndAddress: string | null;
    tin: string | null;
    isBroker: boolean;                  // true если брокер, false если сам экспортёр
    brokerLicense: string | null;       // Номер лицензии брокера
    brokerContractNumber: string | null;
    brokerContractDate: string | null;
  } | null;

  // Блоки 10-11 - Страны торговли
  firstDestinationCountry: string | null;  // Блок 10 - Первая страна назначения (из CMR)
  tradingCountryCode: string | null;       // Блок 11 левый - Код страны контракта
  offshoreIndicator: '1' | '2' | null;     // Блок 11 правый - 1=оффшор, 2=не оффшор

  // Блоки 15-17 - Страны
  dispatchCountryCode: string | null;      // Блок 15 - Страна отправления
  dispatchCountryNumCode: string | null;   // Блок 15а - Цифровой код
  originCountryCode: string | null;        // Блок 16 - Страна происхождения (РАЗНЫЕ/НЕИЗВЕСТНА)
  destinationCountryCode: string | null;   // Блок 17 - Страна назначения
  destinationCountryNumCode: string | null;// Блок 17а - Цифровой код

  // Блок 18 - Транспорт при отправлении (несколько ТС)
  transportDeparture: {
    count: number;                      // Количество ТС
    type: string | null;                // САМОХОД, ПРИЦЕП и т.д.
    vehicles: Array<{
      plateNumber: string | null;       // Госномер
      trailerNumber: string | null;     // Номер прицепа
      countryCode: string | null;       // Код страны регистрации (860, 398...)
    }>;
  } | null;

  // Блок 19 - Контейнер
  containerIndicator: '0' | '1';        // 0=нет, 1=да

  // Блок 20 - Условия поставки
  delivery: {
    incotermsNumCode: string | null;    // Цифровой код Incoterms (01-16, 99)
    incotermsCode: string | null;       // DAP, FOB, EXW...
    place: string | null;               // Город/место доставки
    paymentFormCode: string | null;     // 10-80 (10=предоплата, 50=по факту...)
    shipmentFormCode: string | null;    // 01=напрямую, 02=через посредника
  } | null;

  // Блок 21 - Транспорт на границе
  transportBorder: {
    sameAsDeparture: boolean;           // true если "0" (без изменений)
    count: number | null;
    type: string | null;
    vehicles: Array<{
      plateNumber: string | null;
      trailerNumber: string | null;
      countryCode: string | null;
    }>;
  } | null;

  // Блок 22-24 - Валюта и финансы
  invoiceCurrency: string | null;       // Блок 22 - Код валюты (USD, EUR...)
  invoiceCurrencyNumCode: string | null;// Цифровой код (840, 978...)
  totalInvoiceAmount: number | null;    // Общая фактурная стоимость
  transactionNatureCode: string | null; // Блок 24 - Код характера сделки (10-89)

  // Блоки 25-26 - Вид транспорта
  borderTransportMode: string | null;   // Блок 25 - Код на границе (90=самоход)
  inlandTransportMode: string | null;   // Блок 26 - Код внутри страны

  // Блок 27 - Место погрузки/разгрузки
  loadingPlace: string | null;          // Код СВХ или адрес

  // Блок 28 - Банковские реквизиты (структурированные)
  bankDetails: {
    tin: string | null;                 // ИНН продавца
    mfo: string | null;                 // МФО банка
    bankName: string | null;            // Название банка
    bankAddress: string | null;         // Адрес банка
  } | null;

  // Блок 29 - Таможня на границе
  borderCustomsCode: string | null;
  borderCustomsName: string | null;

  // Блок 30 - Местонахождение товаров
  goodsLocationCode: string | null;     // Код СОАТО
  goodsLocationAddress: string | null;  // Адрес

  // Товарные позиции (Блоки 31-47) - РАСШИРЕННАЯ СТРУКТУРА
  items: Array<{
    // Блок 31 - Описание товара
    description: string | null;         // Полное описание с характеристиками
    brand: string | null;               // Марка
    model: string | null;               // Модель
    vinNumber: string | null;           // VIN/серийный номер (обязателен для техники!)
    yearOfManufacture: string | null;   // Год выпуска
    condition: 'new' | 'used' | null;   // Новый/б/у
    packageQuantity: number | null;     // Количество мест
    packagingType: string | null;       // Тип упаковки (CT, BX, PL...)
    marking: string | null;             // Маркировка

    // Блок 33 - Код ТН ВЭД
    hsCode: string | null;              // 10 цифр

    // Блок 34 - Страна происхождения
    originCountryCode: string | null;   // 3-значный код (860, 000, 999)

    // Блоки 35, 38 - Вес
    grossWeight: number | null;         // Брутто
    netWeight: number | null;           // Нетто (не больше брутто!)

    // Блок 36 - Преференции (льготы)
    preferenceCode: {
      fee: string | null;               // Сбор
      duty: string | null;              // Пошлина
      excise: string | null;            // Акциз
      vat: string | null;               // НДС
    } | null;

    // Блок 37 - Процедура
    procedureCode: string | null;       // Текущий режим (из блока 1)
    previousProcedureCode: string | null;// Предшествующий режим (00 если нет)
    movementCode: string | null;        // Особенность перемещения (000-223)

    // Блок 39 - Квота
    quotaNumber: string | null;         // 0 если нет квоты

    // Блок 40 - Предшествующий документ
    previousDocument: string | null;    // /0/ если нет предшеств. режима

    // Блок 41 - Доп. единица измерения
    quantity: number | null;            // Количество
    unitCode: string | null;            // Код единицы (796=шт, 166=кг...)

    // Блок 42 - Фактурная стоимость
    price: number | null;               // Цена из инвойса
    currencyCode: string | null;

    // Блок 45-46 - Стоимость
    customsValue: number | null;        // Таможенная стоимость
    statisticalValue: number | null;    // Статистическая стоимость в USD

    // Блок 47 - Платежи
    payments: {
      feeAmount: number | null;         // Сбор (код 10)
      dutyRate: string | null;          // Ставка пошлины
      dutyAmount: number | null;        // Сумма пошлины (код 20)
      vatRate: string | null;           // Ставка НДС
      vatAmount: number | null;         // Сумма НДС (код 70)
      totalPayment: number | null;      // Всего к уплате
    } | null;
  }>;

  // Блок 44 - Документы (список)
  documents: Array<{
    code: string;                       // Код документа (202, 220, 301...)
    shortName: string;                  // СМР, ИНВ, КНТ...
    number: string | null;              // Номер (или Б/Н)
    date: string | null;                // Дата
  }>;

  // Блок 50 - Доверитель
  principal: {
    position: string | null;            // Должность (Директор)
    name: string | null;                // ФИО
    tin: string | null;                 // ИНН организации
    obligation: string | null;          // Обязательство (для врем. режимов)
  } | null;

  // Блок 54 - Место и дата
  declarationDetails: {
    place: string | null;               // Город
    signatoryName: string | null;       // ФИО подписанта
    phone: string | null;               // Телефон
    date: string | null;                // Дата
    contractNumber: string | null;      // № договора или аттестата
  } | null;

  // Метаданные
  documentNumber: string | null;
  documentDate: string | null;          // YYYY-MM-DD
  confidence: number;
  warnings: string[];
}

export type DocumentTypeForAnalysis =
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'CMR'
  | 'CONTRACT'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'OTHER';

interface AnalyzeParams {
  documentContent: string;
  documentType: DocumentTypeForAnalysis;
  isImage?: boolean;
  mimeType?: string;
}

interface AnalyzeResult {
  data: GTDExtractedData;
  tokensUsed: number;
  processingTime: number;
  matchedReferences: {
    countries: string[];
    currencies: string[];
    hsCodes: string[];
  };
}

class AIDocumentAnalyzer {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';
  private referenceDataCache: ReferenceData | null = null;
  private cacheExpiry: Date | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Загружает справочные данные из БД для сопоставления
   */
  private async loadReferenceData(): Promise<ReferenceData> {
    // Проверяем кеш (обновляем каждые 5 минут)
    if (this.referenceDataCache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      return this.referenceDataCache;
    }

    const [countries, currencies, deliveryTerms, transportModes, hsCodes, customsOffices, units] = await Promise.all([
      prisma.country.findMany({ select: { code: true, nameEn: true, nameRu: true } }),
      prisma.currency.findMany({ select: { code: true, name: true } }),
      prisma.deliveryTerm.findMany({ select: { code: true, name: true, description: true } }),
      prisma.transportMode.findMany({ select: { code: true, name: true } }),
      prisma.hSCode.findMany({ select: { code: true, description: true, descriptionUz: true } }),
      prisma.customsOffice.findMany({ select: { code: true, name: true } }),
      prisma.unitOfMeasure.findMany({ select: { code: true, name: true, symbol: true } }),
    ]);

    this.referenceDataCache = {
      countries,
      currencies,
      deliveryTerms,
      transportModes,
      hsCodes,
      customsOffices,
      units,
    };
    this.cacheExpiry = new Date(Date.now() + 5 * 60 * 1000);

    return this.referenceDataCache;
  }

  /**
   * Создает системный промпт с справочными данными
   */
  private createSystemPrompt(refData: ReferenceData): string {
    const countryList = refData.countries.slice(0, 50).map(c => `${c.code}: ${c.nameRu}`).join(', ');
    const currencyList = refData.currencies.map(c => `${c.code}: ${c.name}`).join(', ');

    return `Ты - эксперт по таможенному оформлению Узбекистана. Анализируй документы и извлекай ВСЕ данные для заполнения ГТД (Грузовой Таможенной Декларации).

КРИТИЧЕСКИ ВАЖНО: Извлекай АБСОЛЮТНО ВСЕ данные из документа, не пропускай ничего!

## ТАМОЖЕННЫЕ РЕЖИМЫ УЗБЕКИСТАНА (Блок 1):
| Тип | Код | Название |
|-----|-----|----------|
| ЭК | 10 | Экспорт |
| ИМ | 40 | Импорт (выпуск для свободного обращения) |
| ТР | 80 | Транзит |
| РИ | 41 | Реимпорт |
| РЭ | 11 | Реэкспорт |
| ВВ | 42 | Временный ввоз |
| ВЭ | 12 | Временный вывоз |
| ПВ | 51 | Переработка на там. территории |
| ПЭ | 61 | Переработка вне там. территории |
| ТС | 74 | Таможенный склад |
| СТ | 71 | Свободная таможенная зона |
| БТ | 72 | Беспошлинная торговля |
| СВХ | 70 | Временное хранение |
| ОГ | 75 | Отказ в пользу государства |
| УН | 76 | Уничтожение |
| ТТ | 73 | Свободный склад |

## КОДЫ СТРАН (ISO + цифровые):
${countryList}
Цифровые коды: UZ=860, KZ=398, RU=643, CN=156, TR=792, DE=276, US=840

## ВАЛЮТЫ:
${currencyList}
Цифровые: USD=840, EUR=978, RUB=643, CNY=156, UZS=860

## INCOTERMS (Блок 20):
01=EXW, 02=FCA, 03=FAS, 04=FOB, 05=CFR, 06=CIF, 07=CPT, 08=CIP, 09=DAF, 10=DES, 11=DEQ, 12=DDU, 13=DDP, 14=DAP, 15=DAT, 16=FОВ, 99=Другие

## ФОРМЫ РАСЧЁТОВ (Блок 20):
10=Предоплата (T/T, prepayment), 20=Аккредитив, 30=Гарантия банка, 40=Страхование, 50=По факту, 60=Консигнация, 70=Бартер, 80=Безвозмездно

## ВИДЫ ТРАНСПОРТА (Блоки 25-26):
10=Морской, 20=Ж/д, 30=Автомобильный, 40=Авиа, 50=Почта, 70=Трубопровод, 80=Внутренний водный, 90=Самоходный автотранспорт

## ТИПЫ ТРАНСПОРТНЫХ СРЕДСТВ (Блок 18):
САМОХОД, ПРИЦЕП, ПОЛУПРИЦЕП, КОНТЕЙНЕР, ВАГОН, ЦИСТЕРНА

## ЕДИНИЦЫ ИЗМЕРЕНИЯ (Блок 41):
796=штука (шт, sets, pcs, units), 166=кг, 112=литр, 006=метр, 055=м², 113=м³, 736=голова, 715=пара

## КОДЫ ДОКУМЕНТОВ (Блок 44):
| Код | Сокр. | Название |
|-----|-------|----------|
| 202 | СМР | CMR накладная |
| 220 | ИНВ | Инвойс (Commercial Invoice) |
| 222 | УПЛИСТ | Упаковочный лист (Packing List) |
| 301 | КНТ | Контракт |
| 404 | ВТРС | Ветеринарный сертификат |
| 419 | ФТСС | Фитосанитарный сертификат |
| 417 | ССТ | Сертификат соответствия |
| 701 | СПТИМ | Сертификат происхождения (импорт) |
| 702 | СПТЭК | Сертификат происхождения (экспорт) |
| 899 | ДРГДОК | Другие документы |

## ВИДЫ УПАКОВКИ:
CT=Картонная коробка, BX=Ящик, PL=Паллет, BG=Мешок, DR=Бочка, NE=Без упаковки

## ПРАВИЛА ИЗВЛЕЧЕНИЯ:

### Блок 1 - Режим:
- Товар ИЗ Китая/другой страны В Узбекистан → ИМ (код 40) - ИМПОРТ
- Товар ИЗ Узбекистана → ЭК (код 10) - ЭКСПОРТ
- Товар следует ТРАНЗИТОМ → ТР (код 80)

### Блоки 2, 8, 9, 14 - Участники (КРИТИЧЕСКИ ВАЖНО - ПОЛНЫЕ ДАННЫЕ!):
- Поле "nameAndAddress" должно содержать ПОЛНОЕ название + ПОЛНЫЙ адрес!
- НЕ сокращай данные! Бери ВСЁ что написано в документе!

ФОРМАТ nameAndAddress:
- "WEIQIAO SMART AUTO INTERNATIONAL CO., LTD. No.568, Jiushui East Road, Qingdao City, Shandong Province, China"
- "AUTOCENTER LLC, 54 h, THAY street, Bunyadabad MFY, Sergeli district, Tashkent, Uzbekistan"

ОБЯЗАТЕЛЬНО включай:
- Полное название компании (включая LTD, LLC, CO., ООО, МЧЖ и т.д.)
- Номер дома/здания
- Название улицы
- Район/область
- Город
- Страну

ИНН (TIN) Узбекистана = 9 цифр (например: 304567891)
- Для узбекских компаний (Uzbekistan/Tashkent) ОБЯЗАТЕЛЬНО ищи ИНН!
- Для иностранных компаний (Китай, Казахстан и др.) ИНН = null

### Блок 11 - Торгующая страна:
- offshoreIndicator: "1" если страна в списке оффшоров, иначе "2"

### Блок 18, 21 - Транспорт (КРИТИЧЕСКИ ВАЖНО!):
- В CMR ищи госномера в блоке 25 (Vehicle registration) или других местах
- Формат казахских номеров: "881FY02" (цифры + буквы + цифры)
- Формат узбекских номеров: "01A123AA" или "25 GA 077"
- Код страны регистрации: 860=UZ, 398=KZ, 643=RU
- Тип: BY TRUCK = САМОХОД (код 30 для автомобильного)

### Блок 31 - Описание товара (КРИТИЧЕСКИ ВАЖНО!):
- Извлекай ПОЛНОЕ описание товара со ВСЕМИ характеристиками
- Для автомобилей обязательно: марка, модель, тип кузова, объём двигателя, мощность, экологический класс
- Пример: "212 T01 SUV, BAW2033CGB1 RUSSIA VERSION, GASOLINE ENGINE:2.0T,170KW,EURO V"
- Состояние: "new" или "used"

### VIN НОМЕРА (КРИТИЧЕСКИ ВАЖНО!):
- VIN = 17-значный код, начинается обычно с букв (HJ4BACDH6SN055258)
- В инвойсах VIN часто указаны в отдельной таблице или списком
- Если товаров несколько с разными VIN - создай ОТДЕЛЬНЫЙ item для КАЖДОГО VIN!
- Каждый автомобиль = отдельная товарная позиция с уникальным VIN

### HS КОДЫ / Код ТН ВЭД (Блок 33):
- Ровно 10 цифр без пробелов и точек
- "8707 10" → "8707100000"
- Для автомобилей часто: 8703, 8704
- Если несколько кодов через ; - это для разных частей (кузов, двигатель и т.д.)
- HS CODES из CMR: "870710;870850;870880;870829;870870" - распарси каждый

### Блок 44 - Документы:
- Из инвойса: INVOICE NO (номер и дата) → код 220 ИНВ
- Из CMR: CMR номер → код 202 СМР
- Формат: код + сокращение + номер + дата

### ВЕСА:
- Из CMR берётся общий вес брутто (gross weight)
- Вес нетто ≈ 95% от брутто если не указан отдельно
- "9105.5" → grossWeight: 9105.5

### КОЛИЧЕСТВО:
- QTY (SETS) в инвойсе = количество товаров
- Количество мест из CMR = packageQuantity

### ЦЕНЫ:
- U.PRICE = цена за единицу (unitPrice)
- AMOUNT = общая сумма (totalAmount)
- TOTAL FCA KHORGOS = totalInvoiceAmount

### INCOTERMS:
- "FCA KHORGOS" → incotermsCode: "FCA", place: "KHORGOS", incotermsNumCode: "02"
- "DAP TASHKENT" → incotermsCode: "DAP", place: "TASHKENT", incotermsNumCode: "14"

### МЕСТА ОТПРАВЛЕНИЯ/НАЗНАЧЕНИЯ:
- FROM: KHORGOS,CHINA → dispatchCountryCode: "CN", loadingPlace: "KHORGOS"
- TO: TASHKENT, UZBEKISTAN → destinationCountryCode: "UZ"

## ВАЖНО:
- Если данных НЕТ в документе → null (НЕ придумывай!)
- Для каждого VIN создавай ОТДЕЛЬНЫЙ товар в массиве items
- Если 5 автомобилей с 5 VIN → 5 items с одинаковым описанием но разными VIN!
- confidence: 0.9+ если данные чёткие, 0.7-0.9 если частично, <0.7 если много пропусков
- warnings: перечисли ВСЕ проблемы и неоднозначности

## КРИТИЧЕСКИ ВАЖНО - ИНН/TIN:
- Для узбекских компаний (Uzbekistan, Tashkent, UZ в адресе) ИНН ОБЯЗАТЕЛЕН!
- ИНН Узбекистана = ровно 9 цифр (например: 304567891, 200123456, 309288167)
- ИНН ВСЕГДА присутствует в коммерческих инвойсах! Ищи ОЧЕНЬ ВНИМАТЕЛЬНО!

ГДЕ ИСКАТЬ ИНН (проверь ВСЕ места!):
1. После названия компании-покупателя
2. В отдельной строке: "ИНН: 304567891", "TIN: 304567891", "СТИР: 304567891"
3. В банковских реквизитах внизу документа
4. В ПЕЧАТЯХ И ШТАМПАХ покупателя (круглые/квадратные печати внизу)
5. Рядом с подписью представителя покупателя
6. В тексте на узбекском: "укобитица соктоу хоймоси", "Тоўдарам"
7. После "МФО:", "р/с:", "Банк:"
8. Любое 9-значное число (начинается с 2, 3, 4, 5) рядом с реквизитами

ФОРМАТ ПЕЧАТИ УЗБЕКСКОЙ КОМПАНИИ:
- Название компании (LLC, ООО, МЧЖ)
- ИНН: 9 цифр
- Адрес
- Телефон

Если ИНН не найден → добавь в warnings "ИНН покупателя не найден, проверьте печати и штампы"

Отвечай ТОЛЬКО валидным JSON.`;
  }

  /**
   * Создает пользовательский промпт
   */
  private createUserPrompt(documentType: DocumentTypeForAnalysis): string {
    const docTypeNames: Record<DocumentTypeForAnalysis, string> = {
      COMMERCIAL_INVOICE: 'Коммерческий инвойс',
      PACKING_LIST: 'Упаковочный лист',
      BILL_OF_LADING: 'Коносамент',
      CMR: 'CMR накладная',
      CONTRACT: 'Контракт',
      CERTIFICATE_OF_ORIGIN: 'Сертификат происхождения',
      OTHER: 'Документ',
    };

    // Специфичные инструкции для разных типов документов
    let specificInstructions = '';
    
    if (documentType === 'CMR') {
      specificInstructions = `
ОСОБЫЕ ИНСТРУКЦИИ ДЛЯ CMR:
1. Блок 1 CMR: Отправитель (Sender) → exporter (для китайских компаний tin=null)
2. Блок 2 CMR: Получатель (Consignee) → consignee:
   - nameAndAddress: название + адрес
   - countryCode: UZ если Узбекистан
   - tin: ищи ИНН/TIN рядом с названием или адресом! 9 цифр
3. Блок 3 CMR: Место разгрузки → destinationCountryCode, deliveryPlace
4. Блок 4 CMR: Место погрузки → dispatchCountryCode, loadingPlace
5. Блок 5 CMR: Invoice No (Инвойс №) → documentNumber + добавь в documents
6. Блок 6-9: Описание товара, маркировка, количество мест, вес → items
7. Блок 11: Вес брутто (кг) → grossWeight
8. Блок 13: Перевозчик (данные для справки)
9. Блок 17: Дата → documentDate
10. Блок 21: Место составления
11. HS CODE: Ищи "HS CODE:" или "КОД ТН ВЭД" → hsCode для items
12. VIN НОМЕРА: Ищи 17-значные коды (HJ4BACDH...) → создай ОТДЕЛЬНЫЙ item для КАЖДОГО VIN!
13. Количество мест: "11 мест" → packageQuantity: 11

*** КРИТИЧЕСКИ ВАЖНО - ТРАНСПОРТНЫЕ ДАННЫЕ ИЗ CMR (Блок 25) ***
Ищи в нижней части CMR (блок 25, около подписей):
- Госномер тягача: "881FY02" или "01 A 123 AA" → transportDeparture.vehicles[0].plateNumber
- Госномер прицепа: "92ANY02" → transportDeparture.vehicles[0].trailerNumber
- Формат казахских номеров: цифры+буквы+цифры (881FY02)
- Формат узбекских номеров: 01A123AA или 25 GA 077
- Если ДВА номера (тягач/прицеп) разделённых / или пробелом: первый=plateNumber, второй=trailerNumber
- Страна ТС: определи по формату номера (KZ=Казахстан, UZ=Узбекистан, RU=Россия)

transportDeparture должен содержать:
{
  "count": 1,
  "type": "САМОХОД",
  "vehicles": [{
    "plateNumber": "881FY02",
    "trailerNumber": "92ANY02",
    "countryCode": "398"
  }]
}
`;
    } else     if (documentType === 'COMMERCIAL_INVOICE') {
      specificInstructions = `
ОСОБЫЕ ИНСТРУКЦИИ ДЛЯ ИНВОЙСА:
1. Seller/Продавец → exporter:
   - nameAndAddress: ПОЛНОЕ название + ПОЛНЫЙ адрес (НЕ сокращай!)
   - Пример: "WEIQIAO SMART AUTO INTERNATIONAL CO., LTD. No.568, Jiushui East Road, Qingdao City, Shandong Province, China"
   - countryCode: CN для Китая
2. Buyer/Покупатель/Sold to → consignee:
   - nameAndAddress: ПОЛНОЕ название + ПОЛНЫЙ адрес (НЕ сокращай!)
   - Пример: "AUTOCENTER LLC, 54 h, THAY street, Bunyadabad MFY, Sergeli district, Tashkent, Uzbekistan"
   - countryCode: UZ если Узбекистан
   - tin: ИНН для узбекских компаний (9 цифр)
3. Invoice No → documentNumber
4. Invoice Date → documentDate
5. FROM: ... → dispatchCountryCode, loadingPlace
6. TO: ... → destinationCountryCode  
7. Shipped per: BY TRUCK → borderTransportMode: "30"
8. Terms of Payment: T/T → paymentFormCode: "10" (предоплата)
9. DESCRIPTION OF GOODS: Полное описание → items[].description
10. QTY (SETS/PCS) → items[].quantity
11. U.PRICE → единичная цена
12. AMOUNT → items[].price (общая за позицию)
13. VIN номера: Каждый VIN = ОТДЕЛЬНЫЙ item! Если 5 VIN → 5 items!
14. Incoterms: "FCA KHORGOS" → incotermsCode:"FCA", place:"KHORGOS"
15. TOTAL → totalInvoiceAmount

*** ГДЕ ИСКАТЬ ИНН ПОКУПАТЕЛЯ В ИНВОЙСЕ ***
ИНН ВСЕГДА есть в инвойсе! Ищи внимательно:
- В НИЖНЕЙ части документа (около подписей и печатей)
- В ШТАМПАХ покупателя (узбекские компании ставят печать с ИНН)
- Рядом с текстом "укобитица соктоу хоймоси" (печать на узб.)
- После слов "ИНН:", "TIN:", "СТИР:", "ИНН покупателя"
- "Тоўдарам оролалистилу" (реквизиты на узб.)
- Рядом с "МФО", "р/с", "банк"
- 9-значное число рядом с названием узбекской компании
- В рамке печати компании-покупателя
`;
    }

    return `Проанализируй ${docTypeNames[documentType]} и извлеки ВСЕ данные для заполнения ГТД Узбекистана.

ВНИМАТЕЛЬНО изучи документ и извлеки КАЖДУЮ деталь! НЕ ПРОПУСКАЙ НИЧЕГО!
${specificInstructions}

Верни JSON со следующей ПОЛНОЙ структурой:
{
  "declarationType": "ИМ",
  "declarationTypeCode": "40",
  "declarationSubCode": null,
  
  "exporter": {
    "nameAndAddress": "WEIQIAO SMART AUTO INTERNATIONAL CO., LTD, NO.568, JIUSHUI EAST ROAD, QINGDAO CITY, SHANDONG PROVINCE, CHINA",
    "countryCode": "CN",
    "countryNumCode": "156",
    "tin": null
  },
  
  "consignee": {
    "nameAndAddress": "AUTOCENTER LLC, 54 h, THAY street, Bunyadabad MFY, Sergeli district, Tashkent, Uzbekistan",
    "countryCode": "UZ",
    "countryNumCode": "860",
    "tin": "304567891"
  },
  
  "financialResponsible": {
    "nameAndAddress": "то же что consignee при импорте",
    "tin": "123456789",
    "copyFrom": "8"
  },
  
  "declarant": {
    "nameAndAddress": "название и адрес",
    "tin": "ИНН",
    "isBroker": false,
    "brokerLicense": null,
    "brokerContractNumber": null,
    "brokerContractDate": null
  },
  
  "firstDestinationCountry": "УЗБЕКИСТАН",
  "tradingCountryCode": "156",
  "offshoreIndicator": "2",
  
  "dispatchCountryCode": "CN",
  "dispatchCountryNumCode": "156",
  "originCountryCode": "156",
  "destinationCountryCode": "UZ",
  "destinationCountryNumCode": "860",
  
  "transportDeparture": {
    "count": 1,
    "type": "САМОХОД",
    "vehicles": [
      {
        "plateNumber": "881FY02",
        "trailerNumber": "92ANY02",
        "countryCode": "398"
      }
    ]
  },
  
  "containerIndicator": "0",
  
  "delivery": {
    "incotermsNumCode": "02",
    "incotermsCode": "FCA",
    "place": "KHORGOS",
    "paymentFormCode": "10",
    "shipmentFormCode": "01"
  },
  
  "transportBorder": {
    "sameAsDeparture": true,
    "count": null,
    "type": null,
    "vehicles": []
  },
  
  "invoiceCurrency": "USD",
  "invoiceCurrencyNumCode": "840",
  "totalInvoiceAmount": 96225.00,
  "transactionNatureCode": "89",
  
  "borderTransportMode": "30",
  "inlandTransportMode": "30",
  
  "loadingPlace": "KHORGOS",
  
  "bankDetails": null,
  
  "borderCustomsCode": null,
  "borderCustomsName": null,
  
  "goodsLocationCode": null,
  "goodsLocationAddress": "TASHKENT",
  
  "items": [
    {
      "description": "212 T01 SUV, BAW2033CGB1 RUSSIA VERSION, GASOLINE ENGINE:2.0T,170KW,EURO V, автомобиль легковой, новый",
      "brand": "BAW",
      "model": "212 T01 SUV",
      "vinNumber": "HJ4BACDH6SN055258",
      "yearOfManufacture": "2025",
      "condition": "new",
      "packageQuantity": 1,
      "packagingType": "NE",
      "marking": null,
      
      "hsCode": "8703220009",
      "originCountryCode": "156",
      
      "grossWeight": 1821.1,
      "netWeight": 1730,
      
      "preferenceCode": null,
      
      "procedureCode": "40",
      "previousProcedureCode": "00",
      "movementCode": "000",
      
      "quotaNumber": "0",
      "previousDocument": "/0/",
      
      "quantity": 1,
      "unitCode": "796",
      
      "price": 19245.00,
      "currencyCode": "USD",
      
      "customsValue": 19245.00,
      "statisticalValue": 19245.00,
      
      "payments": null
    },
    {
      "description": "212 T01 SUV, BAW2033CGB1 RUSSIA VERSION, GASOLINE ENGINE:2.0T,170KW,EURO V, автомобиль легковой, новый",
      "brand": "BAW",
      "model": "212 T01 SUV",
      "vinNumber": "HJ4BACDH0SN057135",
      "yearOfManufacture": "2025",
      "condition": "new",
      "packageQuantity": 1,
      "packagingType": "NE",
      "marking": null,
      
      "hsCode": "8703220009",
      "originCountryCode": "156",
      
      "grossWeight": 1821.1,
      "netWeight": 1730,
      
      "preferenceCode": null,
      
      "procedureCode": "40",
      "previousProcedureCode": "00",
      "movementCode": "000",
      
      "quotaNumber": "0",
      "previousDocument": "/0/",
      
      "quantity": 1,
      "unitCode": "796",
      
      "price": 19245.00,
      "currencyCode": "USD",
      
      "customsValue": 19245.00,
      "statisticalValue": 19245.00,
      
      "payments": null
    }
  ],
  
  "documents": [
    { "code": "202", "shortName": "СМР", "number": "1112", "date": "2025-08-16" },
    { "code": "220", "shortName": "ИНВ", "number": "BAW202506067-3", "date": "2025-08-12" }
  ],
  
  "principal": {
    "position": "Директор",
    "name": null,
    "tin": null,
    "obligation": null
  },
  
  "declarationDetails": {
    "place": "г.Ташкент",
    "signatoryName": null,
    "phone": null,
    "date": null,
    "contractNumber": null
  },
  
  "documentNumber": "BAW202506067-3",
  "documentDate": "2025-08-12",
  "confidence": 0.95,
  "warnings": []
}

КРИТИЧЕСКИ ВАЖНО:
1. Для АВТОМОБИЛЕЙ создай ОТДЕЛЬНЫЙ item для КАЖДОГО VIN номера!
   - Если 5 VIN → 5 отдельных items с одинаковым описанием но разными vinNumber!
2. VIN номера обычно: 17 символов, начинаются с букв (HJ4BACDH6SN055258)
3. Извлеки ВСЕ данные - не пропускай ничего!
4. Если данных нет → null, НЕ придумывай!
5. В warnings укажи что не удалось найти
6. grossWeight: общий вес / количество единиц = вес одной единицы`;
  }

  /**
   * Сопоставляет извлеченные данные со справочниками
   */
  private matchWithReferences(data: GTDExtractedData, refData: ReferenceData): {
    data: GTDExtractedData;
    matchedReferences: { countries: string[]; currencies: string[]; hsCodes: string[] };
  } {
    const matchedCountries: string[] = [];
    const matchedCurrencies: string[] = [];
    const matchedHSCodes: string[] = [];

    // Функция для поиска страны
    const findCountry = (code: string | null, name: string | null): string | null => {
      if (!code && !name) return null;
      
      // Сначала ищем по коду
      if (code) {
        const found = refData.countries.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (found) {
          matchedCountries.push(found.code);
          return found.code;
        }
      }
      
      // Затем ищем по названию
      if (name) {
        const nameLower = name.toLowerCase();
        const found = refData.countries.find(c => 
          c.nameRu.toLowerCase().includes(nameLower) ||
          c.nameEn.toLowerCase().includes(nameLower) ||
          nameLower.includes(c.nameRu.toLowerCase()) ||
          nameLower.includes(c.nameEn.toLowerCase())
        );
        if (found) {
          matchedCountries.push(found.code);
          return found.code;
        }
      }
      
      return code;
    };

    // Функция для поиска валюты
    const findCurrency = (code: string | null): string | null => {
      if (!code) return null;
      const found = refData.currencies.find(c => c.code.toUpperCase() === code.toUpperCase());
      if (found) {
        matchedCurrencies.push(found.code);
        return found.code;
      }
      return code?.toUpperCase() || null;
    };

    // Функция для валидации HS кода
    const validateHSCode = (code: string | null): string | null => {
      if (!code) return null;
      const cleanCode = code.replace(/\D/g, '').substring(0, 10);
      if (cleanCode.length === 10) {
        // Проверяем есть ли в базе
        const found = refData.hsCodes.find(h => h.code === cleanCode);
        if (found) {
          matchedHSCodes.push(found.code);
        }
        return cleanCode;
      }
      return cleanCode.padEnd(10, '0');
    };

    // Применяем сопоставление
    if (data.exporter) {
      data.exporter.countryCode = findCountry(data.exporter.countryCode, data.exporter.countryName);
    }
    if (data.consignee) {
      data.consignee.countryCode = findCountry(data.consignee.countryCode, data.consignee.countryName);
      // Очищаем ИНН
      if (data.consignee.tin) {
        data.consignee.tin = data.consignee.tin.replace(/\D/g, '').substring(0, 9);
      }
    }

    data.dispatchCountryCode = findCountry(data.dispatchCountryCode, null);
    data.originCountryCode = findCountry(data.originCountryCode, null);
    data.destinationCountryCode = findCountry(data.destinationCountryCode, null);
    data.tradingCountryCode = findCountry(data.tradingCountryCode, null);

    if (data.delivery) {
      data.delivery.currencyCode = findCurrency(data.delivery.currencyCode);
      // Валидируем Incoterms
      if (data.delivery.incotermsCode) {
        const found = refData.deliveryTerms.find(t => 
          t.code.toUpperCase() === data.delivery!.incotermsCode!.toUpperCase()
        );
        data.delivery.incotermsCode = found?.code || data.delivery.incotermsCode?.toUpperCase() || null;
      }
    }

    // Обрабатываем товары
    data.items = data.items.map(item => ({
      ...item,
      hsCode: validateHSCode(item.hsCode),
      originCountryCode: findCountry(item.originCountryCode, null),
      currencyCode: findCurrency(item.currencyCode),
      unitCode: item.unitCode ? item.unitCode.toUpperCase() : null,
    }));

    return {
      data,
      matchedReferences: {
        countries: [...new Set(matchedCountries)],
        currencies: [...new Set(matchedCurrencies)],
        hsCodes: [...new Set(matchedHSCodes)],
      },
    };
  }

  /**
   * Основной метод анализа документа
   */
  async analyzeDocument(params: AnalyzeParams): Promise<AnalyzeResult> {
    const { documentContent, documentType, isImage, mimeType } = params;
    const startTime = Date.now();

    // Загружаем справочные данные
    const refData = await this.loadReferenceData();

    const systemPrompt = this.createSystemPrompt(refData);
    const userPrompt = this.createUserPrompt(documentType);

    try {
      let response;

      if (isImage && mimeType) {
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
        const mediaType = validMimeTypes.includes(mimeType as typeof validMimeTypes[number])
          ? (mimeType as typeof validMimeTypes[number])
          : 'image/jpeg';

        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 8192,
          temperature: 0,
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
        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 8192,
          temperature: 0,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `${userPrompt}\n\nСодержимое документа:\n${documentContent}`,
            },
          ],
        });
      }

      const processingTime = Date.now() - startTime;
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      // Извлекаем текст ответа
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from AI');
      }

      // Парсим JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from AI response');
      }

      let extractedData = JSON.parse(jsonMatch[0]) as GTDExtractedData;

      // Сопоставляем с справочниками
      const { data: matchedData, matchedReferences } = this.matchWithReferences(extractedData, refData);

      return {
        data: matchedData,
        tokensUsed,
        processingTime,
        matchedReferences,
      };
    } catch (error) {
      console.error('Error analyzing document with AI:', error);
      throw error;
    }
  }
}

// Singleton
let analyzerInstance: AIDocumentAnalyzer | null = null;

export function getAIDocumentAnalyzer(): AIDocumentAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new AIDocumentAnalyzer();
  }
  return analyzerInstance;
}

export { AIDocumentAnalyzer };
