/**
 * Схема валидации для режима ЭКСПОРТ (код 10)
 * Согласно Инструкции ГТК РУз №2773
 * 
 * Направление: ЭК (Экспорт)
 * Код режима: 10
 */

import { z } from 'zod';

// ===========================================
// REGEX ПАТТЕРНЫ
// ===========================================

/** ИНН: 9 цифр */
const INN_REGEX = /^\d{9}$/;

/** ПИНФЛ: 14 цифр */
const PINFL_REGEX = /^\d{14}$/;

/** Код страны ISO: 2 буквы */
const COUNTRY_ALPHA2_REGEX = /^[A-Z]{2}$/;

/** Код страны ISO: 3 цифры */
const COUNTRY_NUMERIC_REGEX = /^\d{3}$/;

/** Код валюты ISO: 3 буквы */
const CURRENCY_ALPHA_REGEX = /^[A-Z]{3}$/;

/** Код валюты ISO: 3 цифры */
const CURRENCY_NUMERIC_REGEX = /^\d{3}$/;

/** Код ТН ВЭД: 10 цифр */
const HS_CODE_REGEX = /^\d{10}$/;

/** Код таможенного поста: 5 цифр */
const CUSTOMS_POST_REGEX = /^\d{5}$/;

/** Код района: 7 цифр */
const REGION_CODE_REGEX = /^17\d{5}$/;

/** Номер контейнера: 4 буквы + 7 цифр */
const CONTAINER_NUMBER_REGEX = /^[A-Z]{4}\d{7}$/;

/** Формат процедуры: 7 цифр XXYYZZZ */
const PROCEDURE_CODE_REGEX = /^10\d{5}$/;

// ===========================================
// ENUMS И КОНСТАНТЫ
// ===========================================

/** 
 * Коды статуса лица (правый верхний угол граф 2, 9)
 * Согласно Инструкции ГТК РУз №2773
 * Для прочих лиц — код НЕ УКАЗЫВАЕТСЯ (поле должно быть пустым)
 */
export const PersonStatusCode = z.enum([
  '00000001', // Физическое лицо — резидент
  '00000002', // Физическое лицо — нерезидент
  '88888888', // Представительства международных межправительственных организаций, представительства правительственных организаций иностранных государств
  '99999999', // Дипломатические представительства и консульские учреждения
]);

/** Тип лица (физическое или юридическое) */
export const PersonType = z.enum([
  'individual', // Физическое лицо
  'legal_entity', // Юридическое лицо
]);

/** 
 * Сценарий заполнения графы 2
 * Определяет соотношение экспортера и грузоотправителя
 */
export const Graph2Scenario = z.enum([
  'same_person',        // Экспортер и отправитель — одно лицо
  'subdivision',        // От имени экспортера выступает структурное подразделение
  'different_persons',  // Экспортер и отправитель — разные лица (по поручению)
]);

/** Regex для кода ОКПО (8 цифр) */
const OKPO_REGEX = /^\d{8}$/;

/** Regex для серии паспорта (2 буквы) */
const PASSPORT_SERIES_REGEX = /^[A-Z]{2}$/;

/** Regex для номера паспорта (7 цифр) */
const PASSPORT_NUMBER_REGEX = /^\d{7}$/;

/** Типы упаковки для графы 31 */
export const PackageType = z.enum([
  '01', // насыпью
  '02', // навалом
  '03', // наливом
]);

/** Коды видов транспорта (Приложение №6) */
export const TransportTypeCode = z.enum([
  '10', // Морской
  '20', // Железнодорожный
  '30', // Автомобильный
  '40', // Авиационный
  '50', // Почтовое отправление
  '71', // Трубопроводный
  '72', // ЛЭП
  '80', // Речной
  '90', // Самоход
]);

/** Коды типов автотранспорта */
export const AutoTransportType = z.enum([
  '10', // Легковой автомобиль (до 8 мест)
  '21', // Грузовой до 10т
  '22', // Грузовой 10-20т
  '23', // Грузовой более 20т
  '31', // Автобус до 12 мест
  '32', // Автобус 13-30 мест
  '33', // Автобус более 30 мест
  '40', // Микроавтобус
  '50', // Трактор
  '60', // Мототранспорт
  '70', // Специальный транспорт
]);

/** Коды форм расчётов (графа 20, подраздел 3) */
export const PaymentFormCode = z.enum([
  '10', // Предоплата
  '20', // Аккредитив
  '30', // Гарантия банка
  '40', // Полис страхования экспортных контрактов
  '50', // По факту экспорта
  '60', // По консигнации
  '70', // Бартерная операция
  '80', // Поставка на безвозмездной основе
]);

/** Коды форм отправки (графа 20, подраздел 3) */
export const ShippingFormCode = z.enum([
  '01', // Товар отправляется напрямую контрагенту
  '02', // Товар НЕ отправляется напрямую контрагенту
]);

/** Способы платежа (графа 47, колонка СП) */
export const PaymentMethodCode = z.enum([
  'БН', // Безналичный расчет
  'КТ', // Наличными
  'УН', // Условное начисление
  'ОП', // Отсрочка
  'РП', // Рассрочка
  'ВЗ', // Взаимозачет НДС
  'ОО', // Платеж не производится
]);

/** Метод определения (графа 43) */
export const ProductionMethodCode = z.enum([
  '0', // Экспорт продукции НЕ собственного производства
  '1', // Экспорт продукции собственного производства
]);

// ===========================================
// ВСПОМОГАТЕЛЬНЫЕ СХЕМЫ
// ===========================================

/** Схема для транспортного средства */
export const transportVehicleSchema = z.object({
  plateNumber: z.string().max(20).describe('Госномер тягача'),
  trailerNumber: z.string().max(20).optional().describe('Госномер прицепа'),
  countryCode: z.string().length(2).regex(COUNTRY_ALPHA2_REGEX).describe('Страна регистрации'),
});

/** Схема для документа (графа 44) */
export const exportDocumentSchema = z.object({
  code: z.string().min(1, 'Укажите код документа').max(3).describe('Код документа (101, 205, 301...)'),
  abbreviation: z.string().max(20).optional().describe('Аббревиатура (ЛИЦЕНЗИЯ, АВИА, КНТ...)'),
  number: z.string().min(1, 'Укажите номер документа').describe('Номер документа'),
  date: z.string().min(1, 'Укажите дату документа').describe('Дата документа'),
  validUntil: z.string().optional().describe('Срок действия'),
});

/** Схема для платежа (графа 47) */
export const exportPaymentSchema = z.object({
  paymentType: z.string().min(1, 'Укажите код платежа').max(2).describe('Код платежа (10, 25...)'),
  basis: z.number().positive('Основа должна быть больше 0').describe('Основа начисления'),
  basisCurrency: z.string().max(3).optional().describe('Валюта основы (если не UZS)'),
  rate: z.string().describe('Ставка'),
  amount: z.number().min(0).describe('Сумма'),
  method: PaymentMethodCode.describe('Способ платежа'),
});

/** Схема для предшествующего документа (графа 40) */
export const previousDocumentExportSchema = z.object({
  documentType: z.string().min(1, 'Выберите тип документа').describe('Тип документа (ГТД, ТД...)'),
  registrationNumber: z.string().min(1, 'Введите регистрационный номер').describe('Рег. номер'),
  itemNumber: z.number().int().positive().describe('Номер товара'),
  grossWeight: z.number().positive().describe('Вес брутто (кг)'),
  netWeight: z.number().positive().describe('Вес нетто (кг)'),
  quantity: z.number().positive().optional().describe('Количество'),
  unit: z.string().max(10).optional().describe('Единица измерения'),
});

// ===========================================
// ГРАФА 1 — ТИП ДЕКЛАРАЦИИ
// ===========================================

export const graph1ExportSchema = z.object({
  /** Подраздел 1: Направление (всегда ЭК для экспорта) */
  direction: z.literal('ЭК').describe('Направление — Экспорт'),
  
  /** Подраздел 2: Код таможенного режима (всегда 10 для экспорта) */
  regimeCode: z.literal('10').describe('Код режима — Экспорт'),
  
  /** Подраздел 3: НЕ ЗАПОЛНЯЕТСЯ для экспорта */
  subCode: z.literal('').optional().describe('Не заполняется'),
});

// ===========================================
// ГРАФА 2 — ЭКСПОРТЕР/ГРУЗООТПРАВИТЕЛЬ
// ===========================================
// Согласно Инструкции ГТК РУз №2773

/**
 * Схема для паспортных данных физического лица
 */
const passportDataSchema = z.object({
  /** Серия паспорта (2 буквы, например AA) */
  series: z.string()
    .regex(PASSPORT_SERIES_REGEX, 'Серия паспорта — 2 заглавные буквы')
    .describe('Серия паспорта'),
  
  /** Номер паспорта (7 цифр) */
  number: z.string()
    .regex(PASSPORT_NUMBER_REGEX, 'Номер паспорта — 7 цифр')
    .describe('Номер паспорта'),
  
  /** Дата выдачи */
  issueDate: z.string()
    .min(1, 'Укажите дату выдачи паспорта')
    .describe('Дата выдачи паспорта'),
  
  /** Кем выдан */
  issuedBy: z.string()
    .min(5, 'Минимум 5 символов')
    .max(300, 'Максимум 300 символов')
    .describe('Кем выдан паспорт'),
}).optional();

/**
 * ГРАФА 2 — Экспортер/грузоотправитель
 * 
 * Структура:
 * - Основная часть: данные экспортера/отправителя
 * - Правый верхний угол (после №): ОКПО экспортёра / ОКПО отправителя
 * - Нижняя часть (после №): ИНН экспортера / ИНН отправителя
 * 
 * Сценарии заполнения:
 * 1. same_person — экспортер и отправитель одно лицо
 * 2. subdivision — структурное подразделение (+ данные головной организации)
 * 3. different_persons — разные лица (по поручению экспортера)
 */
export const graph2ExportSchema = z.object({
  // =============================================
  // СЦЕНАРИЙ ЗАПОЛНЕНИЯ
  // =============================================
  
  /** Сценарий заполнения графы */
  scenario: Graph2Scenario.describe('Сценарий: одно лицо / подразделение / разные лица'),
  
  // =============================================
  // ДАННЫЕ ЭКСПОРТЕРА
  // (основное лицо, по поручению которого поставляется товар)
  // =============================================
  
  /** Тип лица экспортера */
  exporterPersonType: PersonType.describe('Тип лица экспортера'),
  
  /** 
   * Наименование/ФИО экспортера
   * - Для физ. лица: ФИО
   * - Для юр. лица: краткое наименование
   */
  exporterName: z.string()
    .min(2, 'Минимум 2 символа')
    .max(200, 'Максимум 200 символов')
    .describe('Наименование или ФИО экспортера'),
  
  /** 
   * Адрес экспортера
   * - Для физ. лица: адрес постоянного места жительства
   * - Для юр. лица: местонахождение (юридический адрес)
   */
  exporterAddress: z.string()
    .min(5, 'Минимум 5 символов')
    .max(500, 'Максимум 500 символов')
    .optional()
    .describe('Адрес экспортера'),
  
  /** Номер телефона экспортера */
  exporterPhone: z.string()
    .max(30, 'Максимум 30 символов')
    .optional()
    .describe('Телефон экспортера'),
  
  /** Email экспортера (для юр. лиц, при наличии) */
  exporterEmail: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal(''))
    .describe('Email экспортера'),
  
  /** 
   * Код ОКПО экспортера (8 цифр)
   * - Для юр. лиц: код ОКПО
   * - Для организаций без ОКПО (дипломаты, международные организации): 99999999
   * - Для физ. лиц: 00000001
   */
  exporterOkpo: z.string()
    .refine(
      (val) => OKPO_REGEX.test(val) || val === '99999999' || val === '00000001',
      'Код ОКПО — 8 цифр, 99999999 (без ОКПО) или 00000001 (физ. лицо)'
    )
    .describe('Код ОКПО экспортера'),
  
  /** 
   * ИНН экспортера
   * - Для юр. лиц: ИНН (9 цифр)
   * - Для физ. лиц: ПИНФЛ (14 цифр) — здесь только ИНН
   * - Для лиц без ИНН: 999999999
   */
  exporterInn: z.string()
    .refine(
      (val) => INN_REGEX.test(val) || val === '999999999',
      'ИНН экспортера — 9 цифр или 999999999'
    )
    .describe('ИНН экспортера'),
  
  // =============================================
  // ДАННЫЕ ГРУЗООТПРАВИТЕЛЯ
  // (заполняется если отправитель ≠ экспортер)
  // =============================================
  
  /** Тип лица отправителя (если отличается от экспортера) */
  senderPersonType: PersonType.optional().describe('Тип лица отправителя'),
  
  /** 
   * Наименование/ФИО отправителя
   * Для сценария same_person = экспортер
   * Для сценария different_persons — отдельное лицо
   */
  senderName: z.string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .describe('Наименование или ФИО отправителя'),
  
  /** Адрес отправителя */
  senderAddress: z.string()
    .max(500, 'Максимум 500 символов')
    .optional()
    .describe('Адрес отправителя'),
  
  /** Номер телефона отправителя */
  senderPhone: z.string()
    .max(30, 'Максимум 30 символов')
    .optional()
    .describe('Телефон отправителя'),
  
  /** Email отправителя (для юр. лиц) */
  senderEmail: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal(''))
    .describe('Email отправителя'),
  
  /** 
   * Код ОКПО отправителя
   * - Для юр. лиц: код ОКПО (8 цифр)
   * - Для структурного подразделения: код ОКПО подразделения
   * - Для организаций без ОКПО: 99999999
   * - Для физ. лиц: 00000001
   */
  senderOkpo: z.string()
    .refine(
      (val) => !val || OKPO_REGEX.test(val) || val === '99999999' || val === '00000001',
      'Код ОКПО — 8 цифр, 99999999 или 00000001'
    )
    .optional()
    .describe('Код ОКПО отправителя'),
  
  /** 
   * ИНН отправителя
   * - Для юр. лиц: ИНН (9 цифр)
   * - Для структурного подразделения: ИНН подразделения
   * - Для лиц без ИНН: 999999999
   */
  senderInn: z.string()
    .refine(
      (val) => !val || INN_REGEX.test(val) || val === '999999999',
      'ИНН отправителя — 9 цифр или 999999999'
    )
    .optional()
    .describe('ИНН отправителя'),
  
  /** 
   * Код района (города) по Классификатору (Приложение №15)
   * По юридическому адресу или месту жительства
   */
  regionCode: z.string()
    .regex(REGION_CODE_REGEX, 'Код района: 7 цифр, начинается с 17')
    .describe('Код района по Приложению №15'),
  
  // =============================================
  // ПАСПОРТНЫЕ ДАННЫЕ (только для физ. лиц)
  // =============================================
  
  /** Паспортные данные экспортера (для физ. лиц) */
  exporterPassport: passportDataSchema,
  
  /** Паспортные данные отправителя (для физ. лиц, если отличается) */
  senderPassport: passportDataSchema,
  
  // =============================================
  // ДАННЫЕ ГОЛОВНОЙ ОРГАНИЗАЦИИ (для subdivision)
  // =============================================
  
  /** Наименование головной организации */
  parentOrgName: z.string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .describe('Наименование головной организации'),
  
  /** Адрес головной организации */
  parentOrgAddress: z.string()
    .max(500, 'Максимум 500 символов')
    .optional()
    .describe('Адрес головной организации'),
  
  /** Телефон головной организации */
  parentOrgPhone: z.string()
    .max(30, 'Максимум 30 символов')
    .optional()
    .describe('Телефон головной организации'),
  
  /** Email головной организации */
  parentOrgEmail: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal(''))
    .describe('Email головной организации'),

})
// =============================================
// КРОСС-ВАЛИДАЦИИ
// =============================================
.refine(
  (data) => {
    // Для физ. лиц ОКПО должен быть 00000001
    if (data.exporterPersonType === 'individual') {
      return data.exporterOkpo === '00000001';
    }
    return true;
  },
  { 
    message: 'Для физических лиц код ОКПО должен быть 00000001', 
    path: ['exporterOkpo'] 
  }
)
.refine(
  (data) => {
    // Для физ. лиц паспортные данные обязательны
    if (data.exporterPersonType === 'individual' && data.scenario === 'same_person') {
      return Boolean(data.exporterPassport?.series && data.exporterPassport?.number);
    }
    return true;
  },
  { 
    message: 'Для физических лиц укажите паспортные данные', 
    path: ['exporterPassport'] 
  }
)
.refine(
  (data) => {
    // Для сценария subdivision — данные головной организации обязательны
    if (data.scenario === 'subdivision') {
      return Boolean(data.parentOrgName && data.parentOrgAddress && data.parentOrgPhone);
    }
    return true;
  },
  { 
    message: 'Для структурного подразделения укажите данные головной организации', 
    path: ['parentOrgName'] 
  }
)
.refine(
  (data) => {
    // Для сценария different_persons — данные отправителя обязательны
    if (data.scenario === 'different_persons') {
      return Boolean(data.senderName && data.senderAddress && data.senderPhone);
    }
    return true;
  },
  { 
    message: 'Укажите данные грузоотправителя', 
    path: ['senderName'] 
  }
)
.refine(
  (data) => {
    // Для сценария different_persons — ОКПО и ИНН отправителя обязательны
    if (data.scenario === 'different_persons') {
      return Boolean(data.senderOkpo && data.senderInn);
    }
    return true;
  },
  { 
    message: 'Укажите ОКПО и ИНН грузоотправителя', 
    path: ['senderOkpo'] 
  }
);

// ===========================================
// ГРАФА 3 — ДОБАВОЧНЫЕ ЛИСТЫ
// ===========================================

export const graph3ExportSchema = z.object({
  /** Порядковый номер листа */
  currentSheet: z.number().int().positive().describe('Номер текущего листа'),
  
  /** Общее количество листов */
  totalSheets: z.number().int().positive().describe('Общее количество листов'),
}).refine(
  (data) => data.currentSheet <= data.totalSheets,
  { message: 'Номер листа не может превышать общее количество', path: ['currentSheet'] }
);

// ===========================================
// ГРАФА 8 — ИМПОРТЕР/ГРУЗОПОЛУЧАТЕЛЬ
// ===========================================

export const graph8ExportSchema = z.object({
  /** Наименование/ФИО получателя */
  name: z.string()
    .min(2, 'Минимум 2 символа')
    .max(200, 'Максимум 200 символов')
    .describe('Наименование или ФИО получателя'),
  
  /** Страна (краткое название) */
  country: z.string()
    .min(2, 'Минимум 2 символа')
    .max(100, 'Максимум 100 символов')
    .describe('Страна получателя'),
  
  /** Код страны */
  countryCode: z.string()
    .length(2, 'Код страны — 2 символа')
    .regex(COUNTRY_ALPHA2_REGEX, 'Неверный формат кода страны')
    .describe('ISO код страны'),
  
  /** Адрес */
  address: z.string()
    .min(5, 'Минимум 5 символов')
    .max(500, 'Максимум 500 символов')
    .describe('Адрес получателя'),
  
  /** Если получатель по поручению другого лица */
  isOnBehalf: z.boolean().default(false).describe('По поручению другого лица'),
  
  /** Данные поручителя */
  principalName: z.string().max(200).optional().describe('Наименование поручителя'),
  principalAddress: z.string().max(500).optional().describe('Адрес поручителя'),
});

// ===========================================
// ГРАФА 9 — ЛИЦО, ОТВЕТСТВЕННОЕ ЗА ФИНАНСОВОЕ УРЕГУЛИРОВАНИЕ
// ===========================================

export const graph9ExportSchema = z.object({
  /** Наименование/ФИО */
  name: z.string()
    .min(2, 'Минимум 2 символа')
    .max(200, 'Максимум 200 символов')
    .describe('Наименование или ФИО'),
  
  /** Адрес */
  address: z.string()
    .min(5, 'Минимум 5 символов')
    .max(500, 'Максимум 500 символов')
    .describe('Местонахождение/место жительства'),
  
  /** Телефон */
  phone: z.string()
    .max(20, 'Максимум 20 символов')
    .optional()
    .describe('Номер телефона'),
  
  /** Email */
  email: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal(''))
    .describe('Адрес электронной почты'),
  
  /** Код статуса лица */
  statusCode: PersonStatusCode.optional().describe('Код статуса лица'),
  
  /** ИНН или ПИНФЛ */
  inn: z.string()
    .refine(
      (val) => INN_REGEX.test(val) || PINFL_REGEX.test(val) || val === '999999999',
      'ИНН (9 цифр), ПИНФЛ (14 цифр) или 999999999'
    )
    .describe('ИНН/ПИНФЛ'),
  
  /** Код района */
  regionCode: z.string()
    .regex(REGION_CODE_REGEX, 'Код района: 7 цифр, начинается с 17')
    .describe('Код района'),
}).optional(); // НЕ ЗАПОЛНЯЕТСЯ при безвозмездных поставках

// ===========================================
// ГРАФА 11 — ТОРГУЮЩАЯ СТРАНА
// ===========================================

export const graph11ExportSchema = z.object({
  /** Цифровой код страны */
  countryCode: z.string()
    .regex(COUNTRY_NUMERIC_REGEX, 'Цифровой код страны — 3 цифры')
    .describe('Код торгующей страны'),
  
  /** Признак оффшорной зоны */
  offshoreIndicator: z.enum(['1', '2']).describe('1 — оффшор, 2 — не оффшор'),
});

// ===========================================
// ГРАФА 17, 17а — СТРАНА НАЗНАЧЕНИЯ
// ===========================================

export const graph17ExportSchema = z.object({
  /** Краткое наименование страны */
  countryName: z.string()
    .min(2, 'Минимум 2 символа')
    .max(100, 'Максимум 100 символов')
    .describe('Наименование страны назначения'),
  
  /** Цифровой код страны (графа 17а) */
  countryCode: z.string()
    .regex(COUNTRY_NUMERIC_REGEX, 'Цифровой код страны — 3 цифры')
    .describe('Код страны назначения'),
});

// ===========================================
// ГРАФА 18 — ТРАНСПОРТНОЕ СРЕДСТВО ПРИ ОТПРАВЛЕНИИ
// ===========================================

export const graph18ExportSchema = z.object({
  /** Количество транспортных средств */
  vehicleCount: z.number().int().positive().describe('Количество ТС'),
  
  /** Тип транспорта */
  transportType: TransportTypeCode.describe('Тип транспорта'),
  
  /** Номера транспортных средств */
  vehicleNumbers: z.string()
    .min(1, 'Укажите номер ТС')
    .describe('Номера ТС через точку с запятой'),
  
  /** Код страны ТС */
  vehicleCountryCode: z.string()
    .refine(
      (val) => COUNTRY_NUMERIC_REGEX.test(val) || val === '999',
      'Код страны — 3 цифры или 999 для нескольких стран'
    )
    .describe('Код страны регистрации ТС'),
  
  /** Список транспортных средств (для электронной ГТД) */
  vehicles: z.array(transportVehicleSchema).optional().describe('Детали ТС'),
  
  /** Тип автотранспорта (для АВТО) */
  autoType: AutoTransportType.optional().describe('Тип автотранспорта'),
  
  /** VIN-номер */
  vinNumber: z.string().max(20).optional().describe('VIN-номер'),
  
  /** Код страны завершения перевозки */
  destinationCountryCode: z.string()
    .regex(COUNTRY_NUMERIC_REGEX, 'Код страны — 3 цифры')
    .optional()
    .describe('Страна завершения перевозки'),
  
  /** Сведения о перевозчике */
  carrierName: z.string().max(200).optional().describe('Наименование/ФИО перевозчика'),
  carrierInn: z.string()
    .refine(
      (val) => !val || INN_REGEX.test(val) || PINFL_REGEX.test(val) || val === '99999999999999',
      'ИНН, ПИНФЛ или 99999999999999'
    )
    .optional()
    .describe('ИНН/ПИНФЛ перевозчика'),
  
  /** Сведения о водителе */
  driverName: z.string().max(100).optional().describe('ФИО водителя'),
  driverPinfl: z.string()
    .refine(
      (val) => !val || PINFL_REGEX.test(val),
      'ПИНФЛ — 14 цифр'
    )
    .optional()
    .describe('ПИНФЛ водителя'),
  driverPassport: z.string().max(20).optional().describe('Паспорт водителя'),
});

// ===========================================
// ГРАФА 20 — УСЛОВИЯ ПОСТАВКИ
// ===========================================

export const graph20ExportSchema = z.object({
  /** Цифровой код Incoterms */
  incotermsCode: z.string()
    .max(2, 'Цифровой код — до 2 символов')
    .describe('Цифровой код условия поставки'),
  
  /** Буквенный код Incoterms + географический пункт */
  incotermsAlpha: z.string()
    .min(3, 'Минимум 3 символа')
    .max(3, 'Буквенный код — 3 символа')
    .describe('Буквенный код Incoterms'),
  
  /** Географический пункт */
  deliveryPlace: z.string()
    .max(200, 'Максимум 200 символов')
    .describe('Географический пункт поставки'),
  
  /** Код формы расчётов */
  paymentFormCode: PaymentFormCode.describe('Форма расчётов'),
  
  /** Код формы отправки */
  shippingFormCode: ShippingFormCode.describe('Форма отправки'),
});

// ===========================================
// ГРАФА 31 — ГРУЗОВЫЕ МЕСТА И ОПИСАНИЕ ТОВАРА
// ===========================================

export const graph31ExportSchema = z.object({
  /** 1. Описание товара */
  description: z.string()
    .min(10, 'Минимум 10 символов')
    .max(2000, 'Максимум 2000 символов')
    .describe('Наименование и описание товара'),
  
  /** Товарные знаки, марки, модели */
  brandModel: z.string().max(200).optional().describe('Марка/бренд'),
  
  /** Артикул, сорт */
  article: z.string().max(100).optional().describe('Артикул'),
  
  /** Стандарты */
  standards: z.string().max(200).optional().describe('Стандарты'),
  
  /** 2. Упаковка */
  packageQuantity: z.number().int().positive().describe('Количество мест'),
  packageType: z.string()
    .min(1, 'Укажите вид упаковки')
    .max(50, 'Максимум 50 символов')
    .describe('Вид упаковки'),
  packageSubQuantity: z.number().int().positive().optional().describe('Количество упаковок в месте'),
  
  /** Для товаров без упаковки */
  bulkType: PackageType.optional().describe('Тип навала/насыпи/налива'),
  
  /** 3. Контейнеры */
  containerNumbers: z.array(z.string()).optional().describe('Номера контейнеров'),
  isPartialContainer: z.boolean().default(false).describe('Часть контейнера'),
  
  /** 4. Акцизные марки (для подакцизных товаров) */
  exciseMarkSeries: z.string().max(50).optional().describe('Серия акцизных марок'),
  exciseMarkNumbers: z.string().max(200).optional().describe('Номера акцизных марок'),
  exciseMarkQuantity: z.number().int().positive().optional().describe('Количество акцизных марок'),
  
  /** 5. Период поставки (для трубопровода/ЛЭП) */
  deliveryPeriodFrom: z.string().optional().describe('Начало периода поставки'),
  deliveryPeriodTo: z.string().optional().describe('Окончание периода поставки'),
  
  /** Левый нижний угол: ИНН/ПИНФЛ изготовителя */
  manufacturerInn: z.string()
    .refine(
      (val) => INN_REGEX.test(val) || PINFL_REGEX.test(val),
      'ИНН (9 цифр) или ПИНФЛ (14 цифр)'
    )
    .describe('ИНН/ПИНФЛ изготовителя'),
  manufacturerRegionCode: z.string()
    .regex(REGION_CODE_REGEX, 'Код района — 7 цифр')
    .describe('Код района изготовителя'),
  
  /** Правый нижний угол: дополнительная единица измерения */
  supplementaryQuantity: z.number()
    .positive('Должно быть больше 0')
    .optional()
    .describe('Количество в доп. единицах'),
  supplementaryUnit: z.string().max(10).optional().describe('Доп. единица измерения'),
});

// ===========================================
// ГРАФА 37 — ПРОЦЕДУРА (для экспорта)
// ===========================================

export const graph37ExportSchema = z.object({
  /** Полный код процедуры (7 цифр: XXYYZZZ) */
  procedureCode: z.string()
    .length(7, 'Код процедуры — 7 цифр')
    .regex(PROCEDURE_CODE_REGEX, 'Для экспорта код должен начинаться с 10')
    .describe('Код процедуры'),
  
  /** Заявляемый режим (XX) — всегда 10 для экспорта */
  currentRegime: z.literal('10').default('10').describe('Заявляемый режим'),
  
  /** Предшествующий режим (YY) — 00 если нет */
  previousRegime: z.string()
    .length(2, 'Код предшествующего режима — 2 цифры')
    .default('00')
    .describe('Предшествующий режим'),
  
  /** Особенность перемещения (ZZZ) — 000 если нет */
  movementSpecific: z.string()
    .length(3, 'Код особенности — 3 цифры')
    .default('000')
    .describe('Особенность перемещения'),
});

// ===========================================
// ГРАФА 43 — МЕТОД ОПРЕДЕЛЕНИЯ
// ===========================================

export const graph43ExportSchema = z.object({
  /** Код метода */
  methodCode: ProductionMethodCode.describe('0 — не собств. производство, 1 — собств. производство'),
});

// ===========================================
// ГРАФА 47 — ИСЧИСЛЕНИЕ ТАМОЖЕННЫХ ПЛАТЕЖЕЙ
// ===========================================

export const graph47ExportSchema = z.object({
  /** Платежи */
  payments: z.array(exportPaymentSchema).min(1, 'Добавьте хотя бы один платёж').describe('Список платежей'),
  
  /** Итого */
  totalAmount: z.number().min(0).describe('Итого к уплате'),
});

// ===========================================
// ГРАФА 50 — ДОВЕРИТЕЛЬ
// ===========================================

export const graph50ExportSchema = z.object({
  /** ФИО */
  fullName: z.string()
    .min(5, 'Минимум 5 символов')
    .max(200, 'Максимум 200 символов')
    .describe('ФИО ответственного лица'),
  
  /** Должность */
  position: z.string()
    .max(100, 'Максимум 100 символов')
    .optional()
    .describe('Должность'),
  
  /** Телефон */
  phone: z.string().max(20).optional().describe('Телефон'),
  
  /** ПИНФЛ */
  pinfl: z.string()
    .refine(
      (val) => PINFL_REGEX.test(val) || val === '99999999999999',
      'ПИНФЛ — 14 цифр или 99999999999999 для нерезидентов'
    )
    .describe('ПИНФЛ'),
  
  /** Если доверенное лицо */
  isProxy: z.boolean().default(false).describe('Действует по доверенности'),
  proxyNumber: z.string().max(50).optional().describe('Номер доверенности'),
  proxyDate: z.string().optional().describe('Дата доверенности'),
  proxyValidUntil: z.string().optional().describe('Срок действия доверенности'),
});

// ===========================================
// ГРАФА 54 — МЕСТО И ДАТА
// ===========================================

export const graph54ExportSchema = z.object({
  /** 1. Место заполнения ГТД */
  fillingPlace: z.string()
    .min(3, 'Минимум 3 символа')
    .max(200, 'Максимум 200 символов')
    .describe('Место заполнения ГТД'),
  
  /** 2. ФИО декларирующего лица */
  declarantFullName: z.string()
    .min(5, 'Минимум 5 символов')
    .max(200, 'Максимум 200 символов')
    .describe('ФИО декларирующего лица'),
  
  /** Email декларирующего лица */
  declarantEmail: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal(''))
    .describe('Email декларирующего лица'),
  
  /** 3. Номер телефона */
  declarantPhone: z.string()
    .min(5, 'Минимум 5 символов')
    .max(20, 'Максимум 20 символов')
    .describe('Телефон декларирующего лица'),
  
  /** 4. Номер договора с брокером (если применимо) */
  brokerContractNumber: z.string().max(50).optional().describe('Номер договора с брокером'),
  brokerContractDate: z.string().optional().describe('Дата договора с брокером'),
  
  /** 5. Номер ГТД */
  gtdNumber: z.string()
    .describe('Номер ГТД: ПИНФЛ/ДД.ММ.ГГГГ/НОМЕР'),
  
  /** Дата заполнения */
  fillingDate: z.string().describe('Дата заполнения ГТД'),
});

// ===========================================
// ГРАФА «С» — ID контракта в ЕЭИС ВТО
// ===========================================

export const graphCExportSchema = z.object({
  /** ID контракта */
  contractId: z.string()
    .min(1, 'Укажите ID контракта')
    .describe('ID внешнеторгового контракта в ЕЭИС ВТО'),
});

// ===========================================
// ТОВАРНАЯ ПОЗИЦИЯ ДЛЯ ЭКСПОРТА (БЛОКИ 31-47)
// ===========================================

export const exportCommodityItemSchema = z.object({
  /** Номер товара (графа 32) */
  itemNumber: z.number().int().positive().describe('Номер товара'),
  
  /** Графа 31: Описание товара */
  graph31: graph31ExportSchema,
  
  /** Графа 33: Код ТН ВЭД */
  hsCode: z.string()
    .regex(HS_CODE_REGEX, 'Код ТН ВЭД — 10 цифр')
    .describe('Код ТН ВЭД'),
  
  /** Графа 34: Страна происхождения */
  originCountryCode: z.string()
    .refine(
      (val) => COUNTRY_NUMERIC_REGEX.test(val) || val === '000' || val === 'EU',
      'Код страны — 3 цифры, 000 (неизвестно) или EU'
    )
    .describe('Код страны происхождения'),
  
  /** Графа 35: Вес брутто */
  grossWeight: z.number()
    .positive('Вес брутто должен быть больше 0')
    .describe('Вес брутто (кг)'),
  
  /** Графа 37: Процедура */
  graph37: graph37ExportSchema,
  
  /** Графа 38: Вес нетто */
  netWeight: z.number()
    .positive('Вес нетто должен быть больше 0')
    .describe('Вес нетто (кг)'),
  
  /** Графа 39: Квота (если есть) */
  quotaRemaining: z.string().max(50).optional().describe('Остаток квоты'),
  
  /** Графа 40: Предшествующий документ */
  previousDocuments: z.array(previousDocumentExportSchema).optional().describe('Предшествующие документы'),
  
  /** Графа 41: Дополнительная единица измерения */
  supplementaryUnit: z.string().max(10).optional().describe('Код доп. единицы'),
  
  /** Графа 42: Фактурная стоимость */
  invoiceValue: z.number()
    .positive('Стоимость должна быть больше 0')
    .describe('Фактурная стоимость'),
  
  /** Графа 43: Метод определения */
  graph43: graph43ExportSchema,
  
  /** Графа 44: Документы */
  documents: z.array(exportDocumentSchema)
    .min(1, 'Добавьте хотя бы один документ')
    .describe('Представленные документы'),
  
  /** Графа 45: Таможенная стоимость */
  customsValue: z.number()
    .positive('Таможенная стоимость должна быть больше 0')
    .describe('Таможенная стоимость'),
  
  /** Графа 46: Статистическая стоимость (в тыс. USD) */
  statisticalValue: z.number()
    .positive('Статистическая стоимость должна быть больше 0')
    .describe('Статистическая стоимость (тыс. USD)'),
  
  /** Графа 47: Платежи */
  graph47: graph47ExportSchema,
})
.refine(
  (data) => data.grossWeight >= data.netWeight,
  { message: 'Вес брутто должен быть >= веса нетто', path: ['netWeight'] }
);

export type ExportCommodityItem = z.infer<typeof exportCommodityItemSchema>;

// ===========================================
// ПОЛНАЯ СХЕМА ГТД ДЛЯ ЭКСПОРТА
// ===========================================

/** Базовая схема объекта (используется для deepPartial) */
const _exportDeclarationBaseSchema = z.object({
  /** Графа 1: Тип декларации */
  graph1: graph1ExportSchema,
  
  /** Графа 2: Экспортер */
  graph2: graph2ExportSchema,
  
  /** Графа 3: Добавочные листы */
  graph3: graph3ExportSchema,
  
  /** Графа 5: Всего наименований товаров */
  totalItems: z.number().int().positive().describe('Всего наименований товаров'),
  
  /** Графа 7: Код таможенного поста */
  customsPostCode: z.string()
    .regex(CUSTOMS_POST_REGEX, 'Код таможенного поста — 5 цифр')
    .describe('Код таможенного поста'),
  
  /** Графа 8: Получатель */
  graph8: graph8ExportSchema,
  
  /** Графа 9: Лицо, ответственное за финансовое урегулирование */
  graph9: graph9ExportSchema,
  
  /** Графа 11: Торгующая страна */
  graph11: graph11ExportSchema,
  
  /** Графа 12: Общая таможенная стоимость */
  totalCustomsValue: z.number().positive().describe('Общая таможенная стоимость'),
  
  /** Валюта (для графы 12) */
  currency: z.string()
    .regex(CURRENCY_NUMERIC_REGEX, 'Код валюты — 3 цифры')
    .describe('Код валюты'),
  
  /** Графа 13: Курс USD */
  usdExchangeRate: z.number().positive().describe('Курс USD к UZS'),
  
  /** Графа 14: Декларант */
  declarantName: z.string().min(2).max(200).describe('Наименование декларанта'),
  declarantAddress: z.string().min(5).max(500).describe('Адрес декларанта'),
  declarantInn: z.string()
    .refine(
      (val) => INN_REGEX.test(val) || PINFL_REGEX.test(val),
      'ИНН (9 цифр) или ПИНФЛ (14 цифр)'
    )
    .describe('ИНН/ПИНФЛ декларанта'),
  declarantPhone: z.string().max(20).optional().describe('Телефон декларанта'),
  declarantEmail: z.string().email().optional().or(z.literal('')).describe('Email декларанта'),
  isBroker: z.boolean().default(false).describe('Декларант — таможенный брокер'),
  brokerInn: z.string().max(9).optional().describe('ИНН брокера'),
  
  /** Графа 17: Страна назначения */
  graph17: graph17ExportSchema,
  
  /** Графа 18: Транспорт при отправлении */
  graph18: graph18ExportSchema,
  
  /** Графа 19: Контейнер */
  containerIndicator: z.enum(['0', '1']).describe('0 — без контейнера, 1 — в контейнере'),
  
  /** Графа 20: Условия поставки */
  graph20: graph20ExportSchema,
  
  /** Графа 22: Валюта и общая фактурная стоимость */
  contractCurrency: z.string()
    .regex(CURRENCY_NUMERIC_REGEX, 'Код валюты — 3 цифры')
    .describe('Код валюты контракта'),
  totalInvoiceValue: z.number().positive().describe('Общая фактурная стоимость'),
  
  /** Графа 23: Курс валюты контракта */
  contractCurrencyRate: z.string().describe('Курс валюты: КОЛИЧЕСТВО/КУРС'),
  
  /** Графа 24: Характер сделки */
  transactionNatureCode: z.string().max(2).describe('Код характера сделки'),
  settlementCurrencyCode: z.string()
    .regex(CURRENCY_NUMERIC_REGEX, 'Код валюты — 3 цифры')
    .describe('Код валюты расчётов'),
  
  /** Графа 25: Вид транспорта на границе */
  borderTransportType: TransportTypeCode.describe('Вид транспорта на границе'),
  
  /** Графа 26: Вид транспорта внутри страны */
  inlandTransportType: TransportTypeCode.describe('Вид транспорта внутри страны'),
  
  /** Графа 28: Финансовые сведения */
  payerInn: z.string()
    .refine(
      (val) => INN_REGEX.test(val) || PINFL_REGEX.test(val),
      'ИНН (9 цифр) или ПИНФЛ (14 цифр)'
    )
    .describe('ИНН плательщика таможенных платежей'),
  
  /** Графа 29: Таможня на границе */
  borderCustomsPostCode: z.string()
    .regex(CUSTOMS_POST_REGEX, 'Код таможенного поста — 5 цифр')
    .describe('Код таможенного поста вывоза'),
  borderCustomsPostName: z.string().max(200).describe('Наименование таможенного поста вывоза'),
  
  /** Графа 30: Местонахождение товаров */
  goodsLocation: z.string()
    .min(5, 'Минимум 5 символов')
    .max(500, 'Максимум 500 символов')
    .optional() // Не заполняется для трубопровода/ЛЭП
    .describe('Местонахождение товаров'),
  goodsLocationRegionCode: z.string()
    .regex(REGION_CODE_REGEX, 'Код района — 7 цифр')
    .optional()
    .describe('Код района местонахождения'),
  
  /** Товарные позиции */
  items: z.array(exportCommodityItemSchema)
    .min(1, 'Добавьте хотя бы один товар')
    .describe('Товарные позиции'),
  
  /** Графа 48: Отсрочка платежей */
  deferredPayments: z.array(z.object({
    paymentTypeCode: z.string().max(2).describe('Код вида платежа'),
    dueDate: z.string().describe('Срок уплаты'),
  })).optional().describe('Отсрочка платежей'),
  
  /** Графа 49: Наименование склада */
  warehouseLicenseNumber: z.string().max(50).optional().describe('Номер лицензии склада'),
  warehouseLicenseDate: z.string().optional().describe('Дата лицензии склада'),
  
  /** Графа 50: Доверитель */
  graph50: graph50ExportSchema,
  
  /** Графа 54: Место и дата */
  graph54: graph54ExportSchema,
  
  /** Графа «С»: ID контракта в ЕЭИС ВТО */
  graphC: graphCExportSchema,
});

/** Базовая схема без кросс-валидаций (для создания draft) */
export const exportDeclarationBaseSchema = _exportDeclarationBaseSchema;

/** Полная схема с кросс-валидациями */
export const exportDeclarationSchema = _exportDeclarationBaseSchema
  // Кросс-валидации
  .refine(
    (data) => data.totalItems === data.items.length,
    { message: 'Количество товаров (графа 5) должно соответствовать количеству позиций', path: ['totalItems'] }
  )
  .refine(
    (data) => {
      const sumCustomsValue = data.items.reduce((sum, item) => sum + item.customsValue, 0);
      return Math.abs(data.totalCustomsValue - sumCustomsValue) < 0.01;
    },
    { message: 'Общая таможенная стоимость (графа 12) должна равняться сумме граф 45', path: ['totalCustomsValue'] }
  )
  .refine(
    (data) => {
      const sumInvoiceValue = data.items.reduce((sum, item) => sum + item.invoiceValue, 0);
      return Math.abs(data.totalInvoiceValue - sumInvoiceValue) < 0.01;
    },
    { message: 'Общая фактурная стоимость (графа 22) должна равняться сумме граф 42', path: ['totalInvoiceValue'] }
  );

export type ExportDeclaration = z.infer<typeof exportDeclarationSchema>;

// ===========================================
// СХЕМА ЧЕРНОВИКА ДЛЯ ЭКСПОРТА
// ===========================================

/**
 * Схема черновика — упрощённая валидация для промежуточного сохранения.
 * Использует z.any() для сложных графов из-за наличия .refine() в вложенных схемах.
 * При отправке на валидацию используется полная схема exportDeclarationSchema.
 */
export const exportDeclarationDraftSchema = z.object({
  // Графы с простыми схемами (без refine)
  graph1: z.any().optional(),
  graph2: z.any().optional(),
  graph3: z.any().optional(),
  totalItems: z.number().int().nonnegative().optional(),
  customsPostCode: z.string().max(5).optional(),
  graph8: z.any().optional(),
  graph9: z.any().optional(),
  graph11: z.any().optional(),
  totalCustomsValue: z.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
  usdExchangeRate: z.number().nonnegative().optional(),
  declarantName: z.string().max(200).optional(),
  declarantAddress: z.string().max(500).optional(),
  declarantInn: z.string().max(14).optional(),
  declarantPhone: z.string().max(20).optional(),
  declarantEmail: z.string().optional(),
  isBroker: z.boolean().optional(),
  brokerInn: z.string().max(9).optional(),
  graph17: z.any().optional(),
  graph18: z.any().optional(),
  containerIndicator: z.enum(['0', '1']).optional(),
  graph20: z.any().optional(),
  contractCurrency: z.string().max(3).optional(),
  totalInvoiceValue: z.number().nonnegative().optional(),
  contractCurrencyRate: z.string().optional(),
  transactionNatureCode: z.string().max(2).optional(),
  settlementCurrencyCode: z.string().max(3).optional(),
  borderTransportType: TransportTypeCode.optional(),
  inlandTransportType: TransportTypeCode.optional(),
  payerInn: z.string().max(14).optional(),
  borderCustomsPostCode: z.string().max(5).optional(),
  borderCustomsPostName: z.string().max(200).optional(),
  goodsLocation: z.string().max(500).optional(),
  goodsLocationRegionCode: z.string().max(7).optional(),
  // Товарные позиции - упрощённая схема для черновика
  items: z.array(z.any()).optional(),
  deferredPayments: z.array(z.any()).optional(),
  warehouseLicenseNumber: z.string().max(50).optional(),
  warehouseLicenseDate: z.string().optional(),
  graph50: z.any().optional(),
  graph54: z.any().optional(),
  graphC: z.any().optional(),
});

export type ExportDeclarationDraft = z.infer<typeof exportDeclarationDraftSchema>;

// ===========================================
// ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ ДЛЯ ЭКСПОРТА
// ===========================================

export const defaultExportDeclarationValues: Partial<ExportDeclarationDraft> = {
  graph1: {
    direction: 'ЭК',
    regimeCode: '10',
    subCode: '',
  },
  graph2: {
    scenario: 'same_person', // Экспортер и отправитель — одно лицо
    exporterPersonType: 'legal_entity', // Юр. лицо по умолчанию
    exporterName: '',
    exporterAddress: '',
    exporterPhone: '',
    exporterEmail: '',
    exporterOkpo: '', // 8 цифр или 99999999/00000001
    exporterInn: '',
    regionCode: '',
    // Для сценария different_persons
    senderPersonType: undefined,
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    senderEmail: '',
    senderOkpo: '',
    senderInn: '',
    // Для сценария subdivision
    parentOrgName: '',
    parentOrgAddress: '',
    parentOrgPhone: '',
    parentOrgEmail: '',
  },
  graph3: {
    currentSheet: 1,
    totalSheets: 1,
  },
  totalItems: 1,
  containerIndicator: '0',
  graph18: {
    vehicleCount: 1,
    transportType: '30', // Авто по умолчанию
    vehicleNumbers: '',
    vehicleCountryCode: '860', // Узбекистан
  },
  graph20: {
    paymentFormCode: '10', // Предоплата
    shippingFormCode: '01', // Напрямую
  },
  borderTransportType: '30',
  inlandTransportType: '30',
  items: [],
};
