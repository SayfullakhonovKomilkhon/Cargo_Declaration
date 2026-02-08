import { z } from 'zod';

// ==========================================
// Схема принципала (Блок 50)
// ==========================================
export const principalDataSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(200, 'Максимум 200 символов'),
  tin: z
    .string()
    .length(9, 'ИНН должен содержать 9 цифр')
    .regex(/^\d{9}$/, 'ИНН должен содержать только цифры'),
});

export type PrincipalData = z.infer<typeof principalDataSchema>;

// ==========================================
// Типы гарантий (Блок 52)
// ==========================================
export const GUARANTEE_TYPES = [
  { code: 'BANK', name: 'Банковская гарантия' },
  { code: 'DEPOSIT', name: 'Денежный депозит' },
  { code: 'INSURANCE', name: 'Страховой полис' },
  { code: 'SURETY', name: 'Поручительство' },
  { code: 'NONE', name: 'Без гарантии' },
] as const;

export const GuaranteeTypeEnum = z.enum(['BANK', 'DEPOSIT', 'INSURANCE', 'SURETY', 'NONE']);
export type GuaranteeTypeValue = z.infer<typeof GuaranteeTypeEnum>;

// ==========================================
// Схема для блоков 48-53 ГТД
// ==========================================
export const declarationBlocks48To53Schema = z
  .object({
    // ========================================
    // Блок 48: Отсрочка платежа
    // ========================================
    deferredPaymentInfo: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Информация об отсрочке платежа'),

    // ========================================
    // Блок 49: Идентификация склада
    // ========================================
    warehouseCode: z
      .string()
      .max(20, 'Максимум 20 символов')
      .optional()
      .describe('Код склада временного хранения'),
    warehouseName: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('Наименование склада'),

    // ========================================
    // Блок 50: Принципал (Доверитель)
    // ========================================
    principalPosition: z
      .string()
      .max(100, 'Максимум 100 символов')
      .optional()
      .describe('Должность принципала (Директор и т.д.)'),
    principalName: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('ФИО принципала'),
    principalTin: z
      .string()
      .max(9, 'Максимум 9 символов')
      .optional()
      .describe('ИНН организации принципала'),
    principalAddress: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Адрес принципала'),
    principalObligation: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Обязательство (для временных режимов)'),
    
    // ========================================
    // Блок 54: Место и дата / Подпись декларанта
    // ========================================
    declarationPlace: z
      .string()
      .max(100, 'Максимум 100 символов')
      .optional()
      .describe('Место подачи декларации (город)'),
    declarantSignature: z
      .string()
      .max(100, 'Максимум 100 символов')
      .optional()
      .describe('ФИО подписанта'),
    declarantPhone: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Телефон декларанта'),
    declarationDate: z
      .string()
      .optional()
      .describe('Дата подачи декларации'),
    declarationRegNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Номер договора или аттестата'),

    // ========================================
    // Блок 51: Предполагаемый таможенный орган
    // ========================================
    intendedCustomsOffice: z
      .string()
      .min(1, 'Укажите код таможенного органа')
      .max(8, 'Максимум 8 символов')
      .describe('Код предполагаемого таможенного органа'),
    intendedCustomsOfficeName: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('Наименование таможенного органа'),

    // ========================================
    // Блок 52: Гарантия
    // ========================================
    guaranteeType: GuaranteeTypeEnum.optional().describe('Тип гарантии'),
    guaranteeNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Номер гарантии'),
    guaranteeAmount: z
      .number()
      .min(0, 'Сумма не может быть отрицательной')
      .optional()
      .describe('Сумма гарантии'),
    guaranteeCurrency: z
      .string()
      .length(3, 'Код валюты должен быть 3 символа')
      .optional()
      .describe('Валюта гарантии'),
    guaranteeValidUntil: z
      .string()
      .optional()
      .describe('Срок действия гарантии'),

    // ========================================
    // Блок 53: Таможня отправления/экспорта
    // ========================================
    exportCustomsOffice: z
      .string()
      .max(8, 'Максимум 8 символов')
      .optional()
      .describe('Код таможни экспорта'),
    exportCustomsOfficeName: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('Наименование таможни экспорта'),
  })
  // Conditional validation
  .refine(
    (data) => {
      // Если есть гарантия (не NONE), должен быть номер и сумма
      if (data.guaranteeType && data.guaranteeType !== 'NONE') {
        return !!data.guaranteeNumber && data.guaranteeAmount !== undefined && data.guaranteeAmount > 0;
      }
      return true;
    },
    {
      message: 'Для гарантии укажите номер и сумму',
      path: ['guaranteeNumber'],
    }
  );

export type DeclarationBlocks48To53FormData = z.infer<typeof declarationBlocks48To53Schema>;

// ==========================================
// Схема черновика для блоков 48-53
// ==========================================
export const declarationBlocks48To53DraftSchema = z.object({
  // Блок 47: Итоги платежей (вычисляемые поля)
  dutyBase: z.string().optional(), // Основа начисления
  totalDutyAmount: z.number().optional(), // Итого пошлины
  totalVatAmount: z.number().optional(), // Итого НДС
  totalFeeAmount: z.number().optional(), // Итого сборы
  calcAmount: z.string().optional(), // Сумма в блоке B
  calcTotal: z.string().optional(), // Итого в блоке B
  
  deferredPaymentInfo: z.string().max(500).optional(),
  warehouseCode: z.string().max(20).optional(),
  warehouseName: z.string().max(200).optional(),
  principalPosition: z.string().max(100).optional(),
  principalName: z.string().max(200).optional(),
  principalTin: z.string().max(9).optional(),
  principalAddress: z.string().max(500).optional(),
  principalObligation: z.string().max(500).optional(),
  intendedCustomsOffice: z.string().max(8).optional(),
  intendedCustomsOfficeName: z.string().max(200).optional(),
  guaranteeType: GuaranteeTypeEnum.optional(),
  guaranteeNumber: z.string().max(50).optional(),
  guaranteeAmount: z.number().min(0).optional(),
  guaranteeCurrency: z.string().max(3).optional(),
  guaranteeValidUntil: z.string().optional(),
  exportCustomsOffice: z.string().max(8).optional(),
  exportCustomsOfficeName: z.string().max(200).optional(),
  // Блок 54
  declarationPlace: z.string().max(100).optional(),
  declarantSignature: z.string().max(100).optional(),
  declarantPhone: z.string().max(50).optional(),
  declarationDate: z.string().optional(),
  declarationRegNumber: z.string().max(50).optional(),
});

export type DeclarationBlocks48To53DraftFormData = z.infer<typeof declarationBlocks48To53DraftSchema>;

// Значения по умолчанию
export const defaultBlocks48To53Values: DeclarationBlocks48To53DraftFormData = {
  // Блок 47: Итоги платежей
  dutyBase: '',
  totalDutyAmount: 0,
  totalVatAmount: 0,
  totalFeeAmount: 0,
  calcAmount: '',
  calcTotal: '',
  
  deferredPaymentInfo: '',
  warehouseCode: '',
  warehouseName: '',
  principalPosition: '',
  principalName: '',
  principalTin: '',
  principalAddress: '',
  principalObligation: '',
  intendedCustomsOffice: '',
  intendedCustomsOfficeName: '',
  guaranteeType: undefined,
  guaranteeNumber: '',
  guaranteeAmount: 0,
  guaranteeCurrency: 'UZS',
  guaranteeValidUntil: '',
  exportCustomsOffice: '',
  exportCustomsOfficeName: '',
  // Блок 54
  declarationPlace: '',
  declarantSignature: '',
  declarantPhone: '',
  declarationDate: new Date().toISOString().split('T')[0],
  declarationRegNumber: '',
};
