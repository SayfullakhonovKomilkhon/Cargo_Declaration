import { z } from 'zod';

// Regex паттерны
const HS_CODE_REGEX = /^\d{10}$/;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

// ==========================================
// Схема документа для блока 44
// ==========================================
export const itemDocumentSchema = z.object({
  code: z.string().min(1, 'Укажите код документа'),
  number: z.string().min(1, 'Укажите номер документа'),
  date: z.string().min(1, 'Укажите дату документа'),
});

export type ItemDocument = z.infer<typeof itemDocumentSchema>;

// Типы документов для товарной позиции (блок 44)
export const ITEM_DOCUMENT_TYPES = [
  { code: 'INV', name: 'Инвойс (счёт-фактура)' },
  { code: 'CMR', name: 'CMR (накладная)' },
  { code: 'AWB', name: 'Авиагрузовая накладная' },
  { code: 'BL', name: 'Коносамент' },
  { code: 'PKL', name: 'Упаковочный лист' },
  { code: 'COO', name: 'Сертификат происхождения' },
  { code: 'CTR', name: 'Контракт' },
  { code: 'LIC', name: 'Лицензия' },
  { code: 'CRT', name: 'Сертификат соответствия' },
  { code: 'SAN', name: 'Санитарное заключение' },
  { code: 'VET', name: 'Ветеринарный сертификат' },
  { code: 'PHY', name: 'Фитосанитарный сертификат' },
  { code: 'OTH', name: 'Другой документ' },
] as const;

// ==========================================
// Схема для товарной позиции (Блоки 31-47)
// ==========================================
export const commodityItemSchema = z
  .object({
    // ========================================
    // Внутренние поля
    // ========================================
    id: z.string().optional(), // ID из БД (если редактирование)

    // ========================================
    // Блок 32: Товар №
    // ========================================
    itemNumber: z
      .number()
      .int('Должно быть целым числом')
      .positive('Должно быть больше 0')
      .describe('Номер товара'),

    // ========================================
    // Блок 31: Грузовые места и описание товаров
    // ========================================
    description: z
      .string()
      .min(10, 'Минимум 10 символов')
      .max(2000, 'Максимум 2000 символов')
      .describe('Описание товара'),
    brand: z
      .string()
      .max(100, 'Максимум 100 символов')
      .optional()
      .describe('Марка/бренд товара (или «без марки»)'),
    marksNumbers: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Маркировка и номера'),
    packageType: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Тип упаковки (CT, BX, 01-насыпью и т.д.)'),
    packageQuantity: z
      .number()
      .int('Должно быть целым числом')
      .nonnegative()
      .optional()
      .describe('Количество грузовых мест'),
    manufacturerTin: z
      .string()
      .max(20, 'Максимум 20 символов')
      .optional()
      .describe('ИНН/КОД_РАЙОНА изготовителя'),

    // ========================================
    // Блок 33: Код товара (ТН ВЭД)
    // ========================================
    hsCode: z
      .string()
      .regex(HS_CODE_REGEX, 'Код ТН ВЭД должен содержать 10 цифр')
      .describe('Код ТН ВЭД'),
    hsDescription: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Описание кода ТН ВЭД'),

    // ========================================
    // Блок 34: Код страны происхождения
    // ========================================
    originCountryCode: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .describe('Страна происхождения товара'),

    // ========================================
    // Блок 35: Вес брутто (кг)
    // ========================================
    grossWeight: z
      .number()
      .positive('Вес брутто должен быть больше 0')
      .describe('Вес брутто (кг)'),

    // ========================================
    // Блок 36: Преференция
    // ========================================
    preferenceCode: z
      .string()
      .max(6, 'Максимум 6 символов')
      .optional()
      .describe('Код преференции'),

    // ========================================
    // Блок 37: Процедура
    // ========================================
    procedureCode: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(4, 'Максимум 4 символа')
      .describe('Код процедуры'),
    previousProcedureCode: z
      .string()
      .max(4, 'Максимум 4 символа')
      .optional()
      .describe('Код предшествующей процедуры'),

    // ========================================
    // Блок 38: Вес нетто (кг)
    // ========================================
    netWeight: z
      .number()
      .positive('Вес нетто должен быть больше 0')
      .describe('Вес нетто (кг)'),

    // ========================================
    // Блок 39: Квота
    // ========================================
    quotaNumber: z
      .string()
      .max(20, 'Максимум 20 символов')
      .optional()
      .describe('Номер квоты'),

    // ========================================
    // Блок 41: Дополнительные единицы измерения
    // ========================================
    supplementaryUnit: z
      .string()
      .max(10, 'Максимум 10 символов')
      .optional()
      .describe('Дополнительная единица измерения'),
    supplementaryQuantity: z
      .number()
      .positive('Должно быть больше 0')
      .optional()
      .describe('Количество в доп. единицах'),

    // ========================================
    // Блок 42: Фактурная стоимость товара
    // ========================================
    itemPrice: z
      .number()
      .positive('Стоимость должна быть больше 0')
      .describe('Фактурная стоимость товара'),
    itemCurrencyCode: z
      .string()
      .length(3, 'Код валюты должен быть 3 символа')
      .optional()
      .describe('Код валюты товара'),

    // ========================================
    // Блок 43: Код метода оценки стоимости
    // ========================================
    valuationMethodCode: z
      .string()
      .max(2, 'Максимум 2 символа')
      .optional()
      .describe('Код метода оценки'),

    // ========================================
    // Блок 43: Корректировка
    // ========================================
    adjustmentCode: z
      .string()
      .max(10, 'Максимум 10 символов')
      .optional()
      .describe('Код корректировки'),

    // ========================================
    // Блок 44: Дополнительная информация/Представленные документы
    // ========================================
    additionalInfo: z
      .string()
      .max(2000, 'Максимум 2000 символов')
      .optional()
      .describe('Дополнительная информация'),
    documents: z
      .array(itemDocumentSchema)
      .min(1, 'Добавьте хотя бы один документ')
      .describe('Представленные документы'),

    // ========================================
    // Блок 45: Корректировка стоимости / Таможенная стоимость
    // ========================================
    adjustmentAmount: z
      .number()
      .min(0, 'Сумма корректировки не может быть отрицательной')
      .optional()
      .describe('Сумма корректировки'),
    customsValue: z
      .number()
      .positive('Таможенная стоимость должна быть больше 0')
      .describe('Таможенная стоимость'),

    // ========================================
    // Блок 46: Статистическая стоимость
    // ========================================
    statisticalValue: z
      .number()
      .positive('Статистическая стоимость должна быть больше 0')
      .optional()
      .describe('Статистическая стоимость'),

    // ========================================
    // Блок 47: Исчисление платежей
    // ========================================
    dutyRate: z
      .number()
      .min(0, 'Ставка не может быть отрицательной')
      .max(100, 'Ставка не может превышать 100%')
      .optional()
      .describe('Ставка пошлины (%)'),
    dutyAmount: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Сумма пошлины'),
    vatRate: z
      .number()
      .min(0, 'Ставка не может быть отрицательной')
      .max(100, 'Ставка не может превышать 100%')
      .optional()
      .describe('Ставка НДС (%)'),
    vatAmount: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Сумма НДС'),
    exciseRate: z
      .number()
      .min(0, 'Ставка не может быть отрицательной')
      .optional()
      .describe('Ставка акциза'),
    exciseAmount: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Сумма акциза'),
    feeAmount: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Таможенный сбор'),
    totalPayment: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Итого платежей'),
  })
  // Валидация: grossWeight должен быть БОЛЬШЕ netWeight
  .refine(
    (data) => {
      return data.grossWeight > data.netWeight;
    },
    {
      message: 'Вес брутто должен быть больше веса нетто',
      path: ['netWeight'],
    }
  );

export type CommodityItem = z.infer<typeof commodityItemSchema>;

// ==========================================
// Схема черновика для товарной позиции
// ==========================================
export const commodityItemDraftSchema = z.object({
  id: z.string().optional(),
  itemNumber: z.number().int().nonnegative().optional(),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
  marksNumbers: z.string().max(500).optional(),
  packageType: z.string().max(50).optional(),
  packageQuantity: z.number().int().nonnegative().optional(),
  manufacturerTin: z.string().max(20).optional(),
  hsCode: z.string().max(10).optional(),
  hsDescription: z.string().max(500).optional(),
  originCountryCode: z.string().max(2).optional(),
  grossWeight: z.number().nonnegative().optional(),
  preferenceCode: z.string().max(6).optional(),
  procedureCode: z.string().max(4).optional(),
  previousProcedureCode: z.string().max(4).optional(),
  netWeight: z.number().nonnegative().optional(),
  quotaNumber: z.string().max(20).optional(),
  supplementaryUnit: z.string().max(10).optional(),
  supplementaryQuantity: z.number().nonnegative().optional(),
  itemPrice: z.number().nonnegative().optional(),
  itemCurrencyCode: z.string().max(3).optional(),
  valuationMethodCode: z.string().max(2).optional(),
  adjustmentCode: z.string().max(10).optional(),
  additionalInfo: z.string().max(2000).optional(),
  documents: z.array(itemDocumentSchema).optional(),
  adjustmentAmount: z.number().nonnegative().optional(),
  customsValue: z.number().nonnegative().optional(),
  statisticalValue: z.number().nonnegative().optional(),
  dutyRate: z.union([z.number(), z.string()]).optional(), // Может быть "12%" или 12
  dutyAmount: z.number().nonnegative().optional(),
  vatRate: z.union([z.number(), z.string()]).optional(), // Может быть "12%" или 12
  vatAmount: z.number().nonnegative().optional(),
  exciseRate: z.union([z.number(), z.string()]).optional(), // Может быть "5%" или 5
  exciseAmount: z.number().nonnegative().optional(),
  feeAmount: z.number().nonnegative().optional(),
  totalPayment: z.number().nonnegative().optional(),
});

export type CommodityItemDraft = z.infer<typeof commodityItemDraftSchema>;

// Значения по умолчанию для товарной позиции
export const defaultCommodityItemValues: CommodityItemDraft = {
  itemNumber: 1,
  description: '',
  marksNumbers: '',
  packageType: 'CT',
  packageQuantity: 1,
  hsCode: '',
  hsDescription: '',
  originCountryCode: '',
  grossWeight: 0,
  preferenceCode: '',
  procedureCode: '40',
  previousProcedureCode: '',
  netWeight: 0,
  quotaNumber: '',
  supplementaryUnit: '',
  supplementaryQuantity: 0,
  itemPrice: 0,
  itemCurrencyCode: 'USD',
  valuationMethodCode: '1',
  adjustmentCode: '',
  additionalInfo: '',
  documents: [],
  adjustmentAmount: 0,
  customsValue: 0,
  statisticalValue: 0,
  dutyRate: 0,
  dutyAmount: 0,
  vatRate: 0,
  vatAmount: 0,
  exciseRate: 0,
  exciseAmount: 0,
  feeAmount: 0,
  totalPayment: 0,
};

// Типы упаковок
export const PACKAGE_TYPES = [
  { code: 'CT', name: 'Картонная коробка' },
  { code: 'BX', name: 'Ящик' },
  { code: 'PK', name: 'Упаковка' },
  { code: 'BG', name: 'Мешок' },
  { code: 'PL', name: 'Паллета' },
  { code: 'DR', name: 'Барабан' },
  { code: 'CN', name: 'Контейнер' },
  { code: 'TB', name: 'Туба' },
  { code: 'RL', name: 'Рулон' },
  { code: 'NE', name: 'Без упаковки' },
] as const;

// Коды процедур
export const PROCEDURE_CODES = [
  { code: '40', name: 'Выпуск для внутреннего потребления' },
  { code: '10', name: 'Экспорт' },
  { code: '31', name: 'Реэкспорт' },
  { code: '51', name: 'Переработка на таможенной территории' },
  { code: '61', name: 'Переработка вне таможенной территории' },
  { code: '71', name: 'Таможенный склад' },
  { code: '80', name: 'Транзит' },
  { code: '53', name: 'Временный ввоз' },
] as const;

// Методы оценки таможенной стоимости
export const VALUATION_METHODS = [
  { code: '1', name: 'По стоимости сделки с ввозимыми товарами' },
  { code: '2', name: 'По стоимости сделки с идентичными товарами' },
  { code: '3', name: 'По стоимости сделки с однородными товарами' },
  { code: '4', name: 'Метод вычитания' },
  { code: '5', name: 'Метод сложения' },
  { code: '6', name: 'Резервный метод' },
] as const;
