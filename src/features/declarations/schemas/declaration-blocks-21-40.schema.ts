import { z } from 'zod';

// ==========================================
// ENUMS для блоков 21-40
// ==========================================

// Блок 18, 21, 25, 26: Виды транспорта (единый справочник)
export const TransportModeEnum = z.enum(['10', '20', '30', '40', '71', '72', '80', '90']);
export type TransportModeValue = z.infer<typeof TransportModeEnum>;

export const TRANSPORT_TYPES = [
  { code: '10', name: 'Морской' },
  { code: '20', name: 'Железнодорожный' },
  { code: '30', name: 'Автомобильный' },
  { code: '40', name: 'Авиационный' },
  { code: '71', name: 'Трубопроводный' },
  { code: '72', name: 'ЛЭП' },
  { code: '80', name: 'Речной' },
  { code: '90', name: 'Самоход' },
] as const;

// Блок 24: Характер сделки
export const TransactionNatureEnum = z.enum([
  'SALE', // Продажа
  'RETURN', // Возврат
  'BARTER', // Бартер
  'LEASING', // Лизинг
  'PROCESSING', // Переработка
  'REPAIR', // Ремонт
  'FREE_SUPPLY', // Безвозмездная поставка
  'OTHER', // Прочее
]);
export type TransactionNatureValue = z.infer<typeof TransactionNatureEnum>;

export const TRANSACTION_NATURES = {
  SALE: 'Купля-продажа',
  RETURN: 'Возврат товаров',
  BARTER: 'Бартерные операции',
  LEASING: 'Лизинг',
  PROCESSING: 'Переработка',
  REPAIR: 'Ремонт/обслуживание',
  FREE_SUPPLY: 'Безвозмездная поставка',
  OTHER: 'Прочие операции',
} as const;

// ==========================================
// Схема предшествующих документов (Блок 40)
// ==========================================
export const previousDocumentSchema = z.object({
  documentType: z.string().min(1, 'Выберите тип документа'),
  documentNumber: z.string().min(1, 'Введите номер документа'),
  documentDate: z.string().min(1, 'Введите дату документа'), // ISO date string
});

export type PreviousDocument = z.infer<typeof previousDocumentSchema>;

export const PREVIOUS_DOCUMENT_TYPES = [
  { code: 'DEC', name: 'Предшествующая декларация' },
  { code: 'TMP', name: 'Временный ввоз' },
  { code: 'TRN', name: 'Транзитная декларация' },
  { code: 'WRH', name: 'Складской документ' },
  { code: 'OTH', name: 'Другой документ' },
] as const;

// ==========================================
// Схема для блоков 21-30 ГТД
// ==========================================
export const declarationBlocks21To30Schema = z.object({
  // ========================================
  // Блок 21: Транспортное средство на границе
  // ========================================
  borderTransportChanged: z
    .enum(['0', '1'])
    .optional()
    .describe('Изменилось ли ТС на границе: 0 - нет (= гр.18), 1 - да'),
  borderTransportType: z
    .string()
    .max(2)
    .optional()
    .describe('Тип транспорта на границе (если изменился)'),
  borderTransportNumber: z
    .string()
    .max(50)
    .optional()
    .describe('Номер ТС на границе (если изменился)'),
  borderTransportCountry: z
    .string()
    .max(2)
    .optional()
    .describe('Страна регистрации ТС на границе'),
  borderTransportMode: TransportModeEnum.describe('Вид транспорта на границе'),

  // ========================================
  // Блок 22: Валюта и сумма счета
  // ========================================
  invoiceCurrency: z
    .string()
    .length(3, 'Код валюты должен быть 3 символа')
    .regex(/^[A-Z]{3}$/, 'Неверный формат кода валюты')
    .describe('Код валюты счета'),
  totalInvoiceAmount: z
    .number()
    .positive('Сумма должна быть больше 0')
    .describe('Общая сумма по счету'),

  // ========================================
  // Блок 23: Курс валюты (автозаполнение)
  // ========================================
  exchangeRate: z
    .number()
    .positive('Курс должен быть больше 0')
    .describe('Курс валюты'),
  exchangeRateDate: z
    .string()
    .min(1, 'Укажите дату курса')
    .describe('Дата курса валюты'),

  // ========================================
  // Блок 24: Характер сделки
  // ========================================
  transactionNature: TransactionNatureEnum.describe('Характер сделки'),

  // ========================================
  // Блок 25: Вид транспорта на границе (код)
  // ========================================
  borderTransportModeCode: z
    .string()
    .max(2, 'Максимум 2 символа')
    .optional()
    .describe('Код вида транспорта на границе'),

  // ========================================
  // Блок 26: Вид транспорта внутри страны
  // ========================================
  inlandTransportMode: z
    .string()
    .max(2, 'Максимум 2 символа')
    .optional()
    .describe('Вид транспорта внутри страны'),

  // ========================================
  // Блок 27: Место погрузки/разгрузки
  // ========================================
  loadingUnloadingPlace: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(200, 'Максимум 200 символов')
    .describe('Место погрузки/разгрузки'),

  // ========================================
  // Блок 28: Финансовые и банковские сведения
  // ========================================
  payerTin: z
    .string()
    .max(14, 'Максимум 14 символов')
    .optional()
    .describe('ИНН/ПИНФЛ плательщика таможенных платежей'),
  financialInfo: z
    .string()
    .max(500, 'Максимум 500 символов')
    .optional()
    .describe('Дополнительные банковские реквизиты'),
  bankTin: z
    .string()
    .max(15, 'Максимум 15 символов')
    .optional()
    .describe('ИНН продавца'),
  bankMfo: z
    .string()
    .max(10, 'Максимум 10 символов')
    .optional()
    .describe('МФО банка'),
  bankName: z
    .string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .describe('Название банка (филиал)'),
  bankAddress: z
    .string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .describe('Адрес банка'),

  // ========================================
  // Блок 29: Таможенный орган въезда/выезда
  // ========================================
  exitCustomsOffice: z
    .string()
    .max(8, 'Максимум 8 символов')
    .optional()
    .describe('Код таможенного поста вывоза (экспорт)'),
  entryCustomsOffice: z
    .string()
    .max(8, 'Максимум 8 символов')
    .optional()
    .describe('Код таможенного поста ввоза (импорт)'),
  customsOfficeCode: z
    .string()
    .min(1, 'Выберите таможенный орган')
    .max(8, 'Максимум 8 символов')
    .describe('Код таможенного органа'),

  // ========================================
  // Блок 30: Местонахождение товаров
  // ========================================
  goodsLocationType: z
    .enum(['address', 'warehouse', 'freeZone', 'dutyFree', 'railway'])
    .optional()
    .describe('Тип места нахождения товаров'),
  goodsLocation: z
    .string()
    .max(500, 'Максимум 500 символов')
    .optional()
    .describe('Местонахождение товаров (адрес/номер лицензии/станция)'),
  goodsLocationRegionCode: z
    .string()
    .max(5, 'Максимум 5 символов')
    .optional()
    .describe('Код района по Классификатору (Приложение №15)'),
  goodsLocationCode: z
    .string()
    .max(20, 'Максимум 20 символов')
    .optional()
    .describe('Код местонахождения товаров'),

  // ========================================
  // Блок 40: Предшествующие документы
  // ========================================
  previousDocuments: z.array(previousDocumentSchema).optional().describe('Предшествующие документы'),
});

export type DeclarationBlocks21To30FormData = z.infer<typeof declarationBlocks21To30Schema>;

// ==========================================
// Схема черновика для блоков 21-30
// ==========================================
export const declarationBlocks21To30DraftSchema = z.object({
  borderTransportChanged: z.enum(['0', '1']).optional(),
  borderTransportType: z.string().max(2).optional(),
  borderTransportNumber: z.string().max(50).optional(),
  borderTransportCountry: z.string().max(2).optional(),
  borderTransportMode: z.string().max(20).optional(), // Допускаем любую строку, нормализация на сервере
  invoiceCurrency: z.string().max(3).optional(),
  totalInvoiceAmount: z.number().nonnegative().optional(),
  exchangeRate: z.number().nonnegative().optional(),
  exchangeRateDate: z.string().optional(),
  transactionNature: z.string().max(50).optional(), // Допускаем любую строку, нормализация на сервере
  borderTransportModeCode: z.string().max(2).optional(),
  inlandTransportMode: z.string().max(2).optional(),
  loadingUnloadingPlace: z.string().max(200).optional(),
  bankTin: z.string().max(15).optional(),
  bankMfo: z.string().max(10).optional(),
  bankName: z.string().max(200).optional(),
  bankAddress: z.string().max(200).optional(),
  customsOfficeCode: z.string().max(8).optional(),
  goodsLocation: z.string().max(500).optional(),
  goodsLocationCode: z.string().max(20).optional(),
  previousDocuments: z.array(previousDocumentSchema).optional(),
});

export type DeclarationBlocks21To30DraftFormData = z.infer<typeof declarationBlocks21To30DraftSchema>;

// Значения по умолчанию
export const defaultBlocks21To30Values: Partial<DeclarationBlocks21To30DraftFormData> = {
  borderTransportChanged: '0', // По умолчанию - без изменений
  borderTransportType: '',
  borderTransportNumber: '',
  borderTransportCountry: '',
  borderTransportMode: '30', // Автомобильный по умолчанию
  invoiceCurrency: 'USD',
  totalInvoiceAmount: 0,
  exchangeRate: 0,
  exchangeRateDate: '',
  transactionNature: 'SALE',
  borderTransportModeCode: '',
  inlandTransportMode: '',
  loadingUnloadingPlace: '',
  bankTin: '',
  bankMfo: '',
  bankName: '',
  bankAddress: '',
  customsOfficeCode: '',
  goodsLocation: '',
  goodsLocationCode: '',
  previousDocuments: [],
};
