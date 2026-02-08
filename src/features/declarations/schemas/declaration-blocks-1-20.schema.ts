import { z } from 'zod';

// Enum для типа декларации (Блок 1) - Таможенные режимы согласно законодательству Узбекистана
export const DeclarationTypeEnum = z.enum([
  'EXPORT',           // Экспорт - код 10
  'REEXPORT',         // Реэкспорт - код 11
  'TEMP_EXPORT',      // Временный вывоз - код 12
  'IMPORT',           // Выпуск для свободного обращения (импорт) - код 40
  'REIMPORT',         // Реимпорт - код 41
  'TEMP_IMPORT',      // Временный ввоз - код 42
  'PROCESSING_IN',    // Переработка на таможенной территории - код 51
  'PROCESSING_OUT',   // Переработка вне таможенной территории - код 61
  'TEMP_STORAGE',     // Временное хранение - код 70
  'FREE_ZONE',        // Свободная таможенная зона - код 71
  'DUTY_FREE',        // Беспошлинная торговля - код 72
  'FREE_WAREHOUSE',   // Свободный склад - код 73
  'CUSTOMS_WAREHOUSE', // Таможенный склад - код 74
  'STATE_ABANDON',    // Отказ в пользу государства - код 75
  'DESTRUCTION',      // Уничтожение - код 76
  'TRANSIT',          // Таможенный транзит - код 80
]);
export type DeclarationTypeValue = z.infer<typeof DeclarationTypeEnum>;

// Enum для статуса декларанта
export const DeclarantStatusEnum = z.enum(['DECLARANT', 'REPRESENTATIVE']);
export type DeclarantStatusValue = z.infer<typeof DeclarantStatusEnum>;

// Regex паттерны
const INN_REGEX = /^\d{9}$/;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;
const CONTAINER_NUMBER_REGEX = /^[A-Z]{4}\d{7}$/;

// Схема для блоков 1-20 ГТД
export const declarationBlocks1To20Schema = z
  .object({
    // ========================================
    // Блок 1: Тип декларации
    // ========================================
    declarationType: DeclarationTypeEnum.describe('Тип декларации'),
    declarationTypeCode: z
      .string()
      .max(2, 'Максимум 2 символа')
      .optional()
      .describe('Код таможенного режима'),
    declarationSubCode: z
      .string()
      .max(3, 'Максимум 3 символа')
      .optional()
      .describe('Подкод декларации'),

    // ========================================
    // Блок 2: Экспортер/Грузоотправитель
    // ========================================
    exporterName: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(200, 'Максимум 200 символов')
      .describe('Наименование экспортера'),
    exporterAddress: z
      .string()
      .min(5, 'Минимум 5 символов')
      .max(500, 'Максимум 500 символов')
      .describe('Адрес экспортера'),
    exporterCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны (например: US, CN)')
      .describe('Страна экспортера'),
    exporterTin: z
      .string()
      .regex(INN_REGEX, 'ИНН должен содержать 9 цифр')
      .optional()
      .describe('ИНН экспортера (для резидентов Узбекистана)'),

    // ========================================
    // Блок 4: Справочный номер
    // ========================================
    referenceNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Справочный номер'),

    // ========================================
    // Блок 5: Общее количество мест
    // ========================================
    totalPackages: z
      .number()
      .int('Должно быть целым числом')
      .positive('Должно быть больше 0')
      .optional()
      .describe('Общее количество мест'),
    packageType: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Тип упаковки'),

    // ========================================
    // Блок 6: Общее количество товара
    // ========================================
    totalQuantity: z
      .number()
      .positive('Должно быть больше 0')
      .optional()
      .describe('Общее количество товара'),
    quantityUnit: z
      .string()
      .max(20, 'Максимум 20 символов')
      .optional()
      .describe('Единица измерения'),

    // ========================================
    // Блок 7: Регистрационный номер ГТД
    // ========================================
    customsPostCode: z
      .string()
      .max(10, 'Максимум 10 символов')
      .optional()
      .describe('Код таможенного поста'),
    registrationDate: z
      .string()
      .optional()
      .describe('Дата регистрации декларации'),
    registrationSequence: z
      .string()
      .max(20, 'Максимум 20 символов')
      .optional()
      .describe('Порядковый номер декларации'),
    internalReference: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Внутренний справочный номер'),

    // ========================================
    // Блок 8: Грузополучатель
    // ========================================
    consigneeName: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(200, 'Максимум 200 символов')
      .describe('Наименование грузополучателя'),
    consigneeAddress: z
      .string()
      .min(5, 'Минимум 5 символов')
      .max(500, 'Максимум 500 символов')
      .describe('Адрес грузополучателя'),
    consigneeTin: z
      .string()
      .regex(INN_REGEX, 'ИНН должен содержать 9 цифр')
      .optional()
      .or(z.literal(''))
      .describe('ИНН грузополучателя (опционально)'),
    consigneeCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .describe('Страна грузополучателя'),

    // ========================================
    // Блок 9: Лицо, ответственное за финансовое урегулирование
    // ========================================
    financialResponsibleName: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('Наименование финансово ответственного лица'),
    financialResponsibleAddress: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('Адрес финансово ответственного лица'),
    financialResponsibleTin: z
      .string()
      .max(9, 'ИНН должен содержать 9 цифр')
      .optional()
      .describe('ИНН финансово ответственного лица'),
    responsiblePerson: z
      .string()
      .max(500, 'Максимум 500 символов')
      .optional()
      .describe('ФИО ответственного лица'),
    responsiblePosition: z
      .string()
      .max(100, 'Максимум 100 символов')
      .optional()
      .describe('Должность'),

    // ========================================
    // Блок 10: Страна назначения
    // ========================================
    destinationCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .describe('Страна назначения'),

    // ========================================
    // Блок 11: Торговая страна
    // ========================================
    tradingCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .optional()
      .describe('Торговая страна (буквенный код)'),
    tradingCountryCode: z
      .string()
      .max(3, 'Код страны должен быть 3 цифры')
      .optional()
      .describe('Торговая страна (цифровой код)'),
    offshoreIndicator: z
      .enum(['1', '2'])
      .optional()
      .describe('Признак оффшора: 1 - оффшорная зона, 2 - не оффшорная'),

    // ========================================
    // Блок 12: Общая таможенная стоимость
    // ========================================
    totalCustomsValue: z
      .number()
      .positive('Должно быть больше 0')
      .describe('Общая таможенная стоимость'),
    currency: z
      .string()
      .length(3, 'Код валюты должен быть 3 символа')
      .regex(CURRENCY_CODE_REGEX, 'Неверный формат кода валюты (например: USD, EUR)')
      .describe('Код валюты'),

    // ========================================
    // Блок 13: Курс валюты
    // ========================================
    exchangeRate: z
      .string()
      .optional()
      .describe('Курс USD от ЦБ Узбекистана'),
    exchangeRateDate: z
      .string()
      .optional()
      .describe('Дата курса валюты'),
    additionalInfo: z
      .string()
      .max(2000, 'Максимум 2000 символов')
      .optional()
      .describe('Дополнительная информация'),

    // ========================================
    // Блок 14: Декларант / Таможенный брокер
    // ========================================
    declarantType: z
      .enum(['SELF', 'BROKER'])
      .describe('Тип декларанта: SELF - сам экспортёр, BROKER - таможенный брокер'),
    declarantName: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(200, 'Максимум 200 символов')
      .describe('Наименование декларанта'),
    declarantTin: z
      .string()
      .regex(INN_REGEX, 'ИНН должен содержать 9 цифр')
      .describe('ИНН декларанта'),
    declarantAddress: z
      .string()
      .min(5, 'Минимум 5 символов')
      .max(500, 'Максимум 500 символов')
      .describe('Адрес декларанта'),
    declarantStatus: DeclarantStatusEnum.describe('Статус декларанта'),
    // Поля для брокера (если declarantType = BROKER)
    brokerLicense: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Номер лицензии таможенного брокера'),
    brokerContractNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Номер договора с брокером'),
    brokerContractDate: z
      .string()
      .optional()
      .describe('Дата договора с брокером'),

    // ========================================
    // Блок 15: Страна отправления
    // ========================================
    dispatchCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .describe('Страна отправления'),
    dispatchRegion: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Регион отправления'),

    // ========================================
    // Блок 16: Страна происхождения
    // ========================================
    originCountry: z
      .string()
      .max(10, 'Максимум 10 символов')
      .describe('Страна происхождения (код или VARIOUS/UNKNOWN)'),
    originCountryCode: z
      .string()
      .max(3, 'Максимум 3 символа')
      .optional()
      .describe('Цифровой код страны происхождения'),

    // ========================================
    // Блок 17: Страна назначения для транзита
    // ========================================
    transitDestinationCountry: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .optional()
      .describe('Страна назначения (транзит)'),

    // ========================================
    // Блок 18: Транспорт при отправлении
    // ========================================
    transportCount: z
      .number()
      .min(1, 'Минимум 1')
      .optional()
      .describe('Количество транспортных средств'),
    departureTransportType: z
      .string()
      .max(2, 'Код типа транспорта')
      .optional()
      .describe('Тип транспорта (10-морской, 20-ЖД, 30-авто, 40-авиа, 71-труба, 72-ЛЭП, 80-речной, 90-самоход)'),
    departureTransportNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Госномер транспортного средства'),
    transportNationality: z
      .string()
      .length(2, 'Код страны должен быть 2 символа')
      .regex(COUNTRY_CODE_REGEX, 'Неверный формат кода страны')
      .optional()
      .describe('Страна регистрации транспортного средства'),
    transportNumber: z
      .string()
      .max(50, 'Максимум 50 символов')
      .optional()
      .describe('Номер транспортного средства'),
    // Список транспортных средств (для нескольких машин)
    transportVehicles: z
      .array(z.object({
        plateNumber: z.string().max(20).optional().describe('Госномер тягача'),
        trailerNumber: z.string().max(20).optional().describe('Госномер прицепа'),
        countryCode: z.string().max(2).optional().describe('Код страны регистрации'),
      }))
      .optional()
      .describe('Список транспортных средств'),

    // ========================================
    // Блок 19: Контейнер
    // ========================================
    containerIndicator: z
      .enum(['0', '1'])
      .optional()
      .describe('Признак контейнера: 0 - без контейнера, 1 - в контейнере'),
    containerNumbers: z
      .array(
        z
          .string()
          .regex(
            CONTAINER_NUMBER_REGEX,
            'Формат контейнера: 4 буквы + 7 цифр (например: ABCD1234567)'
          )
      )
      .optional()
      .describe('Номера контейнеров'),

    // ========================================
    // Блок 20: Условия поставки
    // ========================================
    incotermsCode: z
      .string()
      .max(2, 'Цифровой код Инкотермс')
      .optional()
      .describe('Цифровой код Инкотермс (11-EXW, 12-FCA, 14-DAP и т.д.)'),
    incoterms: z
      .string()
      .min(3, 'Минимум 3 символа')
      .max(3, 'Максимум 3 символа')
      .describe('Буквенный код Инкотермс (EXW, FCA, DAP и т.д.)'),
    deliveryPlace: z
      .string()
      .max(200, 'Максимум 200 символов')
      .optional()
      .describe('Географический пункт поставки'),
    paymentForm: z
      .string()
      .max(2, 'Код формы расчётов')
      .optional()
      .describe('Форма расчётов: 10-предоплата, 20-аккредитив, 50-по факту и т.д.'),
    shippingForm: z
      .string()
      .max(2, 'Код формы отправки')
      .optional()
      .describe('Форма отправки: 01-напрямую, 02-через посредника'),
  })
  // Conditional validation: если тип TRANSIT, то transitDestinationCountry обязательно
  .refine(
    (data) => {
      if (data.declarationType === 'TRANSIT') {
        return (
          data.transitDestinationCountry !== undefined &&
          data.transitDestinationCountry.length === 2
        );
      }
      return true;
    },
    {
      message: 'Для транзитных деклараций обязательно укажите страну назначения',
      path: ['transitDestinationCountry'],
    }
  );

// Тип для формы
export type DeclarationBlocks1To20FormData = z.infer<typeof declarationBlocks1To20Schema>;

// Enum для сценария графы 2
export const Graph2ScenarioEnum = z.enum([
  'same_person',        // Экспортер и отправитель — одно лицо
  'subdivision',        // Структурное подразделение
  'different_persons',  // Разные лица (по поручению)
]);

// Enum для типа лица
export const PersonTypeEnum = z.enum([
  'legal_entity',  // Юридическое лицо
  'individual',    // Физическое лицо
]);

// Схема для черновика (все поля опциональные)
export const declarationDraftSchema = z.object({
  declarationType: DeclarationTypeEnum.optional(),
  declarationTypeCode: z.string().max(2).optional(),
  declarationSubCode: z.string().max(3).optional(),
  
  // ========================================
  // Блок 2: Экспортер/Грузоотправитель (расширенный)
  // ========================================
  
  // Сценарий заполнения
  graph2Scenario: Graph2ScenarioEnum.optional(),
  
  // Тип лица экспортера
  exporterPersonType: PersonTypeEnum.optional(),
  
  // Данные экспортера
  exporterName: z.string().max(200).optional(),
  exporterAddress: z.string().max(500).optional(),
  exporterCountry: z.string().max(2).optional(),
  exporterPhone: z.string().max(30).optional(),
  exporterEmail: z.string().max(100).optional(),
  exporterOkpo: z.string().max(8).optional(),  // Код ОКПО (8 цифр)
  exporterTin: z.string().max(14).optional(),  // ИНН (9 цифр) или ПИНФЛ (14 цифр)
  exporterRegionCode: z.string().max(7).optional(),  // Код региона из Классификатора
  
  // Паспортные данные экспортера (для физ. лиц)
  exporterPassportSeries: z.string().max(2).optional(),
  exporterPassportNumber: z.string().max(9).optional(),
  exporterPassportDate: z.string().optional(),
  exporterPassportIssuedBy: z.string().max(200).optional(),
  
  // Данные грузоотправителя (для сценария different_persons)
  senderPersonType: PersonTypeEnum.optional(),
  senderName: z.string().max(200).optional(),
  senderAddress: z.string().max(500).optional(),
  senderPhone: z.string().max(30).optional(),
  senderEmail: z.string().max(100).optional(),
  senderOkpo: z.string().max(8).optional(),
  senderTin: z.string().max(14).optional(),
  senderRegionCode: z.string().max(7).optional(),
  
  // Паспортные данные отправителя (для физ. лиц)
  senderPassportSeries: z.string().max(2).optional(),
  senderPassportNumber: z.string().max(9).optional(),
  senderPassportDate: z.string().optional(),
  senderPassportIssuedBy: z.string().max(200).optional(),
  
  // Данные головной организации (для сценария subdivision)
  parentOrgName: z.string().max(200).optional(),
  parentOrgAddress: z.string().max(500).optional(),
  parentOrgPhone: z.string().max(30).optional(),
  parentOrgEmail: z.string().max(100).optional(),
  referenceNumber: z.string().max(50).optional(),
  totalPackages: z.number().int().nonnegative().optional(),
  packageType: z.string().max(50).optional(),
  totalQuantity: z.number().nonnegative().optional(),
  quantityUnit: z.string().max(20).optional(),
  customsPostCode: z.string().max(10).optional(),
  registrationDate: z.string().optional(),
  registrationSequence: z.string().max(20).optional(),
  internalReference: z.string().max(50).optional(),
  consigneeName: z.string().max(200).optional(),
  consigneeAddress: z.string().max(500).optional(),
  consigneeTin: z.string().max(9).optional(),
  consigneeCountry: z.string().max(2).optional(),
  // Графа 8: "По поручению" - если получатель принимает по поручению другого лица
  consigneeIsOnBehalf: z.boolean().optional(),
  consigneePrincipalName: z.string().max(200).optional(),
  consigneePrincipalAddress: z.string().max(500).optional(),
  financialResponsibleName: z.string().max(200).optional(),
  financialResponsibleAddress: z.string().max(500).optional(),
  financialResponsibleTin: z.string().max(14).optional(),
  // Графа 9: дополнительные поля
  financialResponsibleStatusCode: z.string().max(8).optional(), // 00000001, 00000002, 99999999 и т.д.
  financialResponsiblePhone: z.string().max(30).optional(),
  financialResponsibleEmail: z.string().max(100).optional(),
  financialResponsibleRegionCode: z.string().max(7).optional(), // Код района
  responsiblePerson: z.string().max(500).optional(),
  responsiblePosition: z.string().max(100).optional(),
  destinationCountry: z.string().max(2).optional(),
  firstDestinationCountry: z.string().max(100).optional(),
  tradingCountry: z.string().max(2).optional(),
  tradingCountryCode: z.string().max(3).optional(),
  offshoreIndicator: z.enum(['1', '2']).optional(),
  totalCustomsValue: z.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
  exchangeRate: z.string().optional(),
  exchangeRateDate: z.string().optional(),
  additionalInfo: z.string().max(2000).optional(),
  declarantType: z.enum(['SELF', 'BROKER']).optional(),
  declarantName: z.string().max(200).optional(),
  declarantTin: z.string().max(14).optional(), // ИНН (9 цифр) или ПИНФЛ (14 цифр)
  declarantAddress: z.string().max(500).optional(),
  declarantPhone: z.string().max(30).optional(),
  declarantEmail: z.string().max(100).optional(),
  declarantStatus: DeclarantStatusEnum.optional(),
  isBroker: z.boolean().optional(),
  brokerInn: z.string().max(9).optional(),
  brokerLicense: z.string().max(50).optional(),
  brokerContractNumber: z.string().max(50).optional(),
  brokerContractDate: z.string().optional(),
  dispatchCountry: z.string().max(2).optional(),
  dispatchRegion: z.string().max(50).optional(),
  originCountry: z.string().max(10).optional(),
  originCountryCode: z.string().max(3).optional(),
  transitDestinationCountry: z.string().max(2).optional(),
  transportCount: z.number().min(1).optional(),
  departureTransportType: z.string().max(2).optional(),
  departureTransportNumber: z.string().max(50).optional(),
  transportNationality: z.string().max(2).optional(),
  transportNumber: z.string().max(50).optional(),
  transportVehicles: z.array(z.object({
    plateNumber: z.string().max(20).optional(),
    trailerNumber: z.string().max(20).optional(),
    countryCode: z.string().max(2).optional(),
  })).optional(),
  containerIndicator: z.enum(['0', '1']).optional(),
  containerNumbers: z.array(z.string()).optional(),
  incotermsCode: z.string().max(2).optional(),
  incoterms: z.string().max(3).optional(),
  deliveryPlace: z.string().max(200).optional(),
  paymentForm: z.string().max(2).optional(),
  shippingForm: z.string().max(2).optional(),
});

export type DeclarationDraftFormData = z.infer<typeof declarationDraftSchema>;

// Значения по умолчанию для формы
export const defaultDeclarationFormValues: Partial<DeclarationDraftFormData> = {
  declarationType: 'IMPORT',
  declarationTypeCode: '40',
  declarationSubCode: '',
  
  // Графа 2 — значения по умолчанию
  graph2Scenario: 'same_person',
  exporterPersonType: 'legal_entity',
  exporterName: '',
  exporterAddress: '',
  exporterCountry: '',
  exporterPhone: '',
  exporterEmail: '',
  exporterOkpo: '',
  exporterTin: '',
  exporterRegionCode: '',
  exporterPassportSeries: '',
  exporterPassportNumber: '',
  exporterPassportDate: '',
  exporterPassportIssuedBy: '',
  senderPersonType: undefined,
  senderName: '',
  senderAddress: '',
  senderPhone: '',
  senderEmail: '',
  senderOkpo: '',
  senderTin: '',
  senderRegionCode: '',
  senderPassportSeries: '',
  senderPassportNumber: '',
  senderPassportDate: '',
  senderPassportIssuedBy: '',
  parentOrgName: '',
  parentOrgAddress: '',
  parentOrgPhone: '',
  parentOrgEmail: '',
  referenceNumber: '',
  totalPackages: 0,
  packageType: '',
  totalQuantity: 0,
  quantityUnit: '',
  customsPostCode: '',
  registrationDate: new Date().toISOString().split('T')[0], // Сегодняшняя дата
  registrationSequence: '',
  internalReference: '',
  consigneeName: '',
  consigneeAddress: '',
  consigneeTin: '',
  consigneeCountry: 'UZ',
  consigneeIsOnBehalf: false,
  consigneePrincipalName: '',
  consigneePrincipalAddress: '',
  financialResponsibleName: '',
  financialResponsibleAddress: '',
  financialResponsibleTin: '',
  financialResponsibleStatusCode: '',
  financialResponsiblePhone: '',
  financialResponsibleEmail: '',
  financialResponsibleRegionCode: '',
  responsiblePerson: '',
  responsiblePosition: '',
  destinationCountry: 'UZ',
  firstDestinationCountry: '',
  tradingCountry: '',
  tradingCountryCode: '',
  offshoreIndicator: '2', // По умолчанию - не оффшор
  totalCustomsValue: 0,
  currency: 'USD',
  exchangeRate: '',
  exchangeRateDate: '',
  additionalInfo: '',
  declarantType: 'SELF', // По умолчанию - сам экспортёр
  declarantName: '',
  declarantTin: '',
  declarantAddress: '',
  declarantPhone: '',
  declarantEmail: '',
  declarantStatus: 'DECLARANT',
  isBroker: false,
  brokerInn: '',
  brokerLicense: '',
  brokerContractNumber: '',
  brokerContractDate: '',
  dispatchCountry: '',
  dispatchRegion: '',
  originCountry: '',
  originCountryCode: '',
  transitDestinationCountry: '',
  transportCount: 1,
  departureTransportType: '30', // По умолчанию - АВТО
  departureTransportNumber: '',
  transportNationality: 'UZ', // По умолчанию - Узбекистан
  transportNumber: '',
  transportVehicles: [], // Пустой список - используются поля departureTransportNumber и transportNationality
  containerIndicator: '0', // По умолчанию - без контейнера
  containerNumbers: [],
  incotermsCode: '14', // По умолчанию DAP
  incoterms: 'DAP',
  deliveryPlace: '',
  paymentForm: '10', // По умолчанию - предоплата
  shippingForm: '01', // По умолчанию - напрямую покупателю
};
