/**
 * Справочные данные для заполнения ГТД
 * Источник: Постановление ГТК РУз от 29.02.2016 №01-02/15-07
 * "Инструкция о порядке заполнения грузовой таможенной декларации"
 * Зарегистрировано МЮ 06.04.2016 г. №2773
 */

// =============================================================================
// ГРАФА 1 - ТИП ДЕКЛАРАЦИИ
// =============================================================================

/**
 * Направление перемещения товаров (первый подраздел графы 1)
 */
export const MOVEMENT_DIRECTIONS = [
  { code: 'ЭК', name: 'Экспорт', description: 'Вывоз товаров из Республики Узбекистан' },
  { code: 'ИМ', name: 'Импорт', description: 'Ввоз товаров в Республику Узбекистан' },
  { code: 'ТР', name: 'Транзит', description: 'Транзитное перемещение через территорию РУз' },
] as const;

/**
 * Классификатор таможенных режимов (Приложение №3)
 * Используется во втором подразделе графы 1
 */
export const CUSTOMS_REGIMES = [
  { code: '10', name: 'Экспорт' },
  { code: '11', name: 'Реэкспорт' },
  { code: '31', name: 'Временный ввоз (вывоз)' },
  { code: '40', name: 'Выпуск для свободного обращения (импорт)' },
  { code: '41', name: 'Реимпорт' },
  { code: '51', name: 'Переработка на таможенной территории' },
  { code: '61', name: 'Переработка вне таможенной территории' },
  { code: '70', name: 'Временное хранение' },
  { code: '71', name: 'Свободная таможенная зона' },
  { code: '72', name: 'Магазин беспошлинной торговли' },
  { code: '73', name: 'Свободный склад' },
  { code: '74', name: 'Таможенный склад' },
  { code: '75', name: 'Отказ в пользу государства' },
  { code: '76', name: 'Уничтожение' },
  { code: '80', name: 'Транзит' },
] as const;

// =============================================================================
// ГРАФА 2, 9, 14 - КОДЫ ДЛЯ ИДЕНТИФИКАЦИИ ЛИЦ
// =============================================================================

/**
 * Специальные коды для идентификации типа лица
 * Указываются в верхней правой части графы после знака "№"
 */
export const PERSON_TYPE_CODES = [
  { code: '00000001', name: 'Физическое лицо - резидент' },
  { code: '00000002', name: 'Физическое лицо - нерезидент' },
  { code: '00000003', name: 'Организация с государственной долей в уставном капитале' },
  { code: '88888888', name: 'Представительства международных организаций' },
  { code: '99999999', name: 'Дипломатические представительства и консульские учреждения' },
  { code: '999999999', name: 'Лица без ИНН/ПИНФЛ' },
] as const;

// =============================================================================
// ГРАФА 11 - ТОРГУЮЩАЯ СТРАНА
// =============================================================================

/**
 * Индикатор офшорной зоны (правый подраздел графы 11)
 */
export const OFFSHORE_INDICATORS = [
  { code: '1', name: 'Офшорная зона', description: 'Страна включена в перечень офшорных зон' },
  { code: '2', name: 'Не офшорная зона', description: 'Страна не включена в перечень офшорных зон' },
] as const;

// =============================================================================
// ГРАФА 18 - ТРАНСПОРТНОЕ СРЕДСТВО
// =============================================================================

/**
 * Классификатор видов транспорта (Приложение №6)
 */
export const TRANSPORT_TYPES = [
  { code: '10', name: 'Морской', abbr: 'МОР' },
  { code: '20', name: 'Железнодорожный', abbr: 'ЖД' },
  { code: '30', name: 'Автомобильный', abbr: 'АВТО' },
  { code: '40', name: 'Авиационный', abbr: 'АВИА' },
  { code: '50', name: 'Почтовое отправление', abbr: 'ПОЧТА' },
  { code: '71', name: 'Трубопроводный', abbr: 'ТРУБОПРОВОД' },
  { code: '72', name: 'Линии электропередачи', abbr: 'ЛЭП' },
  { code: '80', name: 'Речной (внутренний водный)', abbr: 'РЕЧ' },
  { code: '90', name: 'Самоходом', abbr: 'САМОХОД' },
] as const;

/**
 * Коды типов автотранспортных средств
 * Используется в графе 18 для детализации автотранспорта
 */
export const AUTO_VEHICLE_TYPES = [
  { code: '10', name: 'Легковой автомобиль', description: 'Не более 8 сидячих мест, не считая места водителя' },
  { code: '21', name: 'Грузовой автомобиль (до 10т)', description: 'Грузоподъемность до 10 тонн' },
  { code: '22', name: 'Грузовой автомобиль (10-20т)', description: 'Грузоподъемность от 10 до 20 тонн' },
  { code: '23', name: 'Грузовой автомобиль (более 20т)', description: 'Грузоподъемность более 20 тонн' },
  { code: '31', name: 'Автобус малый', description: 'До 12 сидячих мест, не считая места водителя' },
  { code: '32', name: 'Автобус средний', description: 'От 13 до 30 сидячих мест, не считая места водителя' },
  { code: '33', name: 'Автобус большой', description: 'Более 30 сидячих мест, не считая места водителя' },
  { code: '40', name: 'Микроавтобус' },
  { code: '50', name: 'Трактор' },
  { code: '60', name: 'Мототранспорт' },
  { code: '70', name: 'Специальный транспорт' },
] as const;

// =============================================================================
// ГРАФА 19 - КОНТЕЙНЕР
// =============================================================================

/**
 * Индикатор контейнера
 */
export const CONTAINER_INDICATORS = [
  { code: '0', name: 'Товары перемещаются не в контейнере' },
  { code: '1', name: 'Товары перемещаются в контейнере или контейнер оформляется как товар' },
] as const;

// =============================================================================
// ГРАФА 20 - УСЛОВИЯ ПОСТАВКИ (INCOTERMS)
// =============================================================================

/**
 * Классификатор условий поставки (Приложение №7)
 */
export const DELIVERY_TERMS = [
  { code: '01', abbr: 'EXW', name: 'Франко предприятие', group: 'E', sellerRisk: 'Минимальный' },
  { code: '02', abbr: 'FCA', name: 'Франко перевозчик', group: 'F', sellerRisk: 'Низкий' },
  { code: '03', abbr: 'FAS', name: 'Свободно у борта судна', group: 'F', sellerRisk: 'Низкий' },
  { code: '04', abbr: 'FOB', name: 'Свободно на борту', group: 'F', sellerRisk: 'Низкий' },
  { code: '05', abbr: 'CFR', name: 'Стоимость и фрахт', group: 'C', sellerRisk: 'Средний' },
  { code: '06', abbr: 'CIF', name: 'Стоимость, страхование и фрахт', group: 'C', sellerRisk: 'Средний' },
  { code: '07', abbr: 'CPT', name: 'Фрахт оплачен до', group: 'C', sellerRisk: 'Средний' },
  { code: '08', abbr: 'CIP', name: 'Фрахт и страхование оплачены до', group: 'C', sellerRisk: 'Средний' },
  { code: '09', abbr: 'DAF', name: 'Поставка франко-граница', group: 'D', sellerRisk: 'Высокий' },
  { code: '10', abbr: 'DES', name: 'Поставка франко-судно', group: 'D', sellerRisk: 'Высокий' },
  { code: '11', abbr: 'DEQ', name: 'Поставка франко-причал', group: 'D', sellerRisk: 'Высокий' },
  { code: '12', abbr: 'DDU', name: 'Поставка без уплаты пошлины', group: 'D', sellerRisk: 'Высокий' },
  { code: '13', abbr: 'DDP', name: 'Поставка с уплатой пошлины', group: 'D', sellerRisk: 'Максимальный' },
  // Incoterms 2010/2020 дополнения
  { code: '14', abbr: 'DAP', name: 'Поставка в месте назначения', group: 'D', sellerRisk: 'Высокий' },
  { code: '15', abbr: 'DPU', name: 'Поставка в месте выгрузки', group: 'D', sellerRisk: 'Высокий' },
  { code: '99', abbr: 'XXX', name: 'Иное условие поставки', group: '-', sellerRisk: '-' },
] as const;

/**
 * Формы расчетов за экспортируемые товары (третий подраздел графы 20)
 */
export const PAYMENT_FORMS = [
  { code: '10', name: 'Предоплата' },
  { code: '20', name: 'Аккредитив' },
  { code: '30', name: 'Гарантия банка' },
  { code: '40', name: 'Полис страхования экспортных контрактов' },
  { code: '50', name: 'По факту экспорта' },
  { code: '60', name: 'По консигнации' },
  { code: '70', name: 'Бартерная операция' },
  { code: '80', name: 'Поставка на безвозмездной основе' },
] as const;

/**
 * Формы отправки товаров
 */
export const SHIPMENT_FORMS = [
  { code: '01', name: 'Товар отправляется напрямую в адрес контрагента' },
  { code: '02', name: 'Товар не отправляется напрямую в адрес контрагента' },
] as const;

// =============================================================================
// ГРАФА 24 - ХАРАКТЕР СДЕЛКИ
// =============================================================================

/**
 * Классификатор характера сделки (Приложение №9)
 */
export const TRANSACTION_TYPES = [
  { code: '010', name: 'Купля-продажа' },
  { code: '020', name: 'Бартер (мена)' },
  { code: '030', name: 'Безвозмездная передача' },
  { code: '040', name: 'Аренда (лизинг)' },
  { code: '050', name: 'Ремонт и техническое обслуживание' },
  { code: '060', name: 'Давальческое сырье' },
  { code: '070', name: 'Переработка' },
  { code: '080', name: 'Операции правительственного уровня' },
  { code: '090', name: 'Прочие' },
] as const;

// =============================================================================
// ГРАФА 37 - ПРОЦЕДУРА
// =============================================================================

/**
 * Особенности перемещения товаров
 */
export const MOVEMENT_FEATURES = [
  { code: '01', name: 'Безвозмездная помощь по линии государств/правительств' },
  { code: '02', name: 'Гуманитарная помощь' },
  { code: '03', name: 'Техническая помощь' },
  { code: '04', name: 'Товары, передаваемые в качестве дара' },
  { code: '05', name: 'Ликвидация последствий аварий и катастроф' },
  { code: '06', name: 'Для государственных нужд' },
  { code: '07', name: 'Материально-техническое снабжение для международных перевозок' },
  { code: '14', name: 'Вклад в уставный фонд предприятий с иностранными инвестициями' },
  { code: '18', name: 'Гарантийное обслуживание' },
  { code: '21', name: 'Выставочные экспонаты' },
  { code: '22', name: 'Рекламные материалы и сувениры' },
  { code: '23', name: 'Аренда сроком до 1 года' },
  { code: '24', name: 'Аренда (лизинг) сроком более 1 года' },
  { code: '25', name: 'Консигнация' },
  { code: '28', name: 'Многооборотная тара' },
  { code: '29', name: 'Товары физических лиц, не для коммерческой деятельности' },
  { code: '31', name: 'Образцы товаров' },
  { code: '36', name: 'Условный выпуск' },
  { code: '39', name: 'Возврат по рекламации' },
  { code: '40', name: 'Ремонт' },
  { code: '45', name: 'Обратный вывоз временно ввезенных товаров' },
  { code: '52', name: 'Обратный ввоз временно вывезенных товаров' },
  { code: '54', name: 'Переработка (кроме ремонта)' },
] as const;

// =============================================================================
// ГРАФА 44 - ДОКУМЕНТЫ
// =============================================================================

/**
 * Классификатор видов документов и сведений (Приложение №12)
 */
export const DOCUMENT_CODES = [
  // Разрешительные документы (100-199)
  { code: '101', abbr: 'ЛИЦЕНЗИЯ', name: 'Лицензия', category: 'permit' },
  { code: '102', abbr: 'СЕРТ', name: 'Сертификат соответствия', category: 'permit' },
  { code: '103', abbr: 'ФИТО', name: 'Фитосанитарный сертификат', category: 'permit' },
  { code: '104', abbr: 'ВЕТ', name: 'Ветеринарный сертификат', category: 'permit' },
  { code: '105', abbr: 'КАРАНТ', name: 'Карантинный сертификат', category: 'permit' },
  { code: '106', abbr: 'ГИГИЕН', name: 'Гигиенический сертификат', category: 'permit' },
  { code: '107', abbr: 'ЭКСП', name: 'Экспортный сертификат', category: 'permit' },
  
  // Транспортные документы (200-299)
  { code: '201', abbr: 'КРГ', name: 'Каргоманифест', category: 'transport' },
  { code: '202', abbr: 'СМР', name: 'CMR (международная автомобильная накладная)', category: 'transport' },
  { code: '203', abbr: 'КНСМ', name: 'Коносамент', category: 'transport' },
  { code: '204', abbr: 'TIR', name: 'TIR-карнет', category: 'transport' },
  { code: '205', abbr: 'АВИА', name: 'Авиационная накладная (AWB)', category: 'transport' },
  { code: '206', abbr: 'НКПЧТ', name: 'Почтовая накладная', category: 'transport' },
  { code: '207', abbr: 'СМГС', name: 'Железнодорожная накладная (СМГС)', category: 'transport' },
  { code: '208', abbr: 'ТТН', name: 'Товарно-транспортная накладная', category: 'transport' },
  { code: '209', abbr: 'ПАСПОРТ', name: 'Паспорт транспортного средства', category: 'transport' },
  
  // Коммерческие документы (220-299)
  { code: '220', abbr: 'ИНВ', name: 'Инвойс (счёт-фактура)', category: 'commercial' },
  { code: '221', abbr: 'ПАКИНГ', name: 'Упаковочный лист', category: 'commercial' },
  { code: '222', abbr: 'СПЕЦФ', name: 'Спецификация', category: 'commercial' },
  
  // Контрактные документы (300-399)
  { code: '301', abbr: 'КНТ', name: 'Контракт (договор)', category: 'contract' },
  { code: '302', abbr: 'ДОПЛС', name: 'Дополнительное соглашение', category: 'contract' },
  { code: '303', abbr: 'ЗАЯВКА', name: 'Заявка на товар', category: 'contract' },
  
  // Финансовые документы (400-499)
  { code: '401', abbr: 'БАНК', name: 'Банковский документ', category: 'financial' },
  { code: '402', abbr: 'АККРЕД', name: 'Аккредитив', category: 'financial' },
  { code: '403', abbr: 'ГАРАНТ', name: 'Банковская гарантия', category: 'financial' },
  { code: '404', abbr: 'СТРАХ', name: 'Страховой полис', category: 'financial' },
  
  // Таможенные документы (500-599)
  { code: '501', abbr: 'ПРЕДГТД', name: 'Предшествующая ГТД', category: 'customs' },
  { code: '502', abbr: 'КЛАСС', name: 'Предварительное решение о классификации', category: 'customs' },
  { code: '503', abbr: 'ПРОИСХ', name: 'Сертификат происхождения', category: 'customs' },
  
  // Документы-основания для льгот (600-699)
  { code: '601', abbr: 'ЛЬГОТА', name: 'Документ-основание для льготы', category: 'benefit' },
  { code: '602', abbr: 'ИНВЕСТ', name: 'Инвестиционный сертификат', category: 'benefit' },
  
  // Прочие документы (800-899)
  { code: '801', abbr: 'ДОВЕР', name: 'Доверенность', category: 'other' },
  { code: '802', abbr: 'АКЦЕПТ', name: 'Акцепт', category: 'other' },
  { code: '803', abbr: 'АКТ', name: 'Акт приёма-передачи', category: 'other' },
  
  // Служебные коды (830-899)
  { code: '836', abbr: 'ОТКАЗ', name: 'Разрешение на отказ в пользу государства', category: 'service' },
  { code: '837', abbr: 'УНИЧТ', name: 'Разрешение на уничтожение', category: 'service' },
] as const;

// =============================================================================
// ГРАФА 47 - ТАМОЖЕННЫЕ ПЛАТЕЖИ
// =============================================================================

/**
 * Классификатор таможенных платежей (Приложение №10)
 */
export const CUSTOMS_PAYMENTS = [
  // Таможенные сборы (10-19)
  { code: '10', name: 'Таможенные сборы за таможенное оформление товаров', category: 'fees' },
  { code: '11', name: 'Таможенные сборы за оформление товаров в режиме транзита', category: 'fees' },
  { code: '12', name: 'Таможенные сборы за оформление вне мест/времени работы', category: 'fees' },
  { code: '13', name: 'Таможенные сборы за оформление в СТЗ и свободных складах', category: 'fees' },
  
  // Пошлины и налоги (20-29)
  { code: '20', name: 'Ввозная таможенная пошлина', category: 'duty' },
  { code: '25', name: 'Вывозная таможенная пошлина', category: 'duty' },
  { code: '27', name: 'Акцизный налог на ввоз', category: 'tax' },
  { code: '28', name: 'Акцизный налог на вывоз', category: 'tax' },
  { code: '29', name: 'Налог на добавленную стоимость', category: 'tax' },
  
  // Платежи физических лиц (30-39)
  { code: '30', name: 'Сбор с товаров, ввозимых физическими лицами', category: 'individual' },
  { code: '31', name: 'Единый таможенный платеж для физических лиц', category: 'individual' },
  
  // Иные сборы (40-49)
  { code: '40', name: 'Сбор за хранение на таможенном складе', category: 'storage' },
  { code: '41', name: 'Сбор за таможенное сопровождение', category: 'escort' },
  { code: '42', name: 'Сбор за выдачу лицензии', category: 'license' },
  { code: '43', name: 'Иные таможенные сборы', category: 'other' },
  
  // Плата за услуги (50-59)
  { code: '50', name: 'Плата за принятие предварительного решения', category: 'service' },
  
  // Средства и штрафы (60-69)
  { code: '60', name: 'Средства от реализации конфискатов', category: 'confiscation' },
  { code: '61', name: 'Средства от реализации залога', category: 'pledge' },
  { code: '62', name: 'Штрафы', category: 'penalty' },
  
  // Иные таможенные платежи (70-79)
  { code: '70', name: 'Проценты за отсрочку таможенного платежа', category: 'interest' },
  { code: '71', name: 'Проценты за рассрочку таможенного платежа', category: 'interest' },
  { code: '72', name: 'Пеня', category: 'penalty' },
  { code: '74', name: 'Иные виды таможенных платежей', category: 'other' },
  { code: '75', name: 'Сумма обеспечения уплаты таможенных платежей', category: 'guarantee' },
  { code: '76', name: 'Сбор на реэкспорт потребительских товаров', category: 'special' },
  
  // Особые пошлины (80-89)
  { code: '80', name: 'Специальная пошлина', category: 'special_duty' },
  { code: '81', name: 'Временная специальная пошлина', category: 'special_duty' },
  { code: '82', name: 'Антидемпинговая пошлина', category: 'special_duty' },
  { code: '83', name: 'Временная антидемпинговая пошлина', category: 'special_duty' },
  { code: '84', name: 'Компенсационная пошлина', category: 'special_duty' },
  { code: '85', name: 'Временная компенсационная пошлина', category: 'special_duty' },
] as const;

/**
 * Способы уплаты таможенных платежей
 */
export const PAYMENT_METHODS = [
  { code: 'БН', name: 'Безналичный расчет' },
  { code: 'НЛ', name: 'Наличный расчет' },
  { code: 'ОТ', name: 'Отсрочка платежа' },
  { code: 'РС', name: 'Рассрочка платежа' },
  { code: 'ЗЛ', name: 'Залог' },
  { code: 'ГР', name: 'Банковская гарантия' },
  { code: 'ПР', name: 'Поручительство' },
] as const;

// =============================================================================
// ПРАВИЛА РАСЧЕТА ТАМОЖЕННОЙ СТОИМОСТИ
// =============================================================================

/**
 * Группы Incoterms для расчета таможенной стоимости
 * Если Incoterms начинается на E или F, нужно добавить транспортные расходы
 */
export const INCOTERMS_GROUPS = {
  E: {
    name: 'E-terms (EXW)',
    description: 'Продавец предоставляет товар покупателю на своем предприятии',
    addTransportToCustomsValue: true,
    addInsuranceToCustomsValue: true,
  },
  F: {
    name: 'F-terms (FCA, FAS, FOB)',
    description: 'Основная перевозка не оплачена продавцом',
    addTransportToCustomsValue: true,
    addInsuranceToCustomsValue: true,
  },
  C: {
    name: 'C-terms (CFR, CIF, CPT, CIP)',
    description: 'Основная перевозка оплачена продавцом',
    addTransportToCustomsValue: false,
    addInsuranceToCustomsValue: false,
  },
  D: {
    name: 'D-terms (DAF, DES, DEQ, DDU, DDP, DAP, DPU)',
    description: 'Доставка до места назначения',
    addTransportToCustomsValue: false,
    addInsuranceToCustomsValue: false,
  },
} as const;

// =============================================================================
// ГРАФА 40 - ТИПЫ ПРЕДШЕСТВУЮЩИХ ДОКУМЕНТОВ
// =============================================================================

/**
 * Классификатор типов предшествующих документов для графы 40
 * Указывается при помещении товара под таможенный режим после другого режима
 */
export const PREVIOUS_DOCUMENT_TYPES = [
  { code: '10101', name: 'ГТД', description: 'Грузовая таможенная декларация' },
  { code: '10102', name: 'ТД', description: 'Транзитная декларация' },
  { code: '10103', name: 'ТД-2', description: 'Добавочный лист к таможенной декларации' },
  { code: '10201', name: 'ТПО', description: 'Документ таможенного приходного ордера' },
  { code: '10301', name: 'ВТТ', description: 'Документ внутреннего таможенного транзита' },
  { code: '10401', name: 'МДП', description: 'Книжка МДП (Carnet TIR)' },
  { code: '10402', name: 'ККДГ', description: 'Книжка контроля доставки груза' },
  { code: '10501', name: 'СКД', description: 'Складской документ (таможенный склад)' },
  { code: '10601', name: 'ДТС', description: 'Декларация таможенной стоимости' },
  { code: '10701', name: 'КТС', description: 'Корректировка таможенной стоимости' },
  { code: '10801', name: 'ДКД', description: 'Документ контроля доставки' },
  { code: '10802', name: 'МВ', description: 'Обязательство о возврате транспортного средства' },
  { code: '10901', name: 'ЗСТ', description: 'Заявление свободной таможенной зоны' },
] as const;

/**
 * Правила заполнения графы 40 в зависимости от предшествующего режима (графа 37)
 * Если в графе 37 вторая часть НЕ равна "00", графа 40 обязательна
 */
export const PREVIOUS_DOCUMENT_RULES = {
  // При реимпорте (41) - ссылка на экспортную декларацию
  '10': { required: true, docTypes: ['10101', '10102'] },
  '11': { required: true, docTypes: ['10101', '10102'] },
  // После таможенного склада
  '74': { required: true, docTypes: ['10501', '10101'] },
  // После переработки
  '51': { required: true, docTypes: ['10101'] },
  '61': { required: true, docTypes: ['10101'] },
  // После временного ввоза
  '31': { required: true, docTypes: ['10101'] },
  // После транзита
  '80': { required: true, docTypes: ['10301', '10401'] },
  // Первичный ввоз/вывоз - не требуется
  '00': { required: false, docTypes: [] },
} as const;

// =============================================================================
// ГРАФА 24 - ХАРАКТЕР СДЕЛКИ
// =============================================================================

/**
 * Коды характера сделки (Приложение к форме ГТД)
 */
export const TRANSACTION_NATURE_CODES = [
  { code: '01', name: 'Купля-продажа', description: 'Обычная купля-продажа', requiresPayment: true },
  { code: '02', name: 'Бартер', description: 'Бартерные операции', requiresPayment: false },
  { code: '03', name: 'Безвозмездная поставка', description: 'Дар, помощь', requiresPayment: false },
  { code: '04', name: 'Аренда/лизинг', description: 'Операционная аренда, лизинг', requiresPayment: true },
  { code: '05', name: 'Возврат товара', description: 'Возврат ранее поставленного товара', requiresPayment: false },
  { code: '06', name: 'Переработка', description: 'Давальческое сырье, переработка', requiresPayment: false },
  { code: '07', name: 'Ремонт', description: 'Ремонт и техобслуживание', requiresPayment: true },
  { code: '08', name: 'Консигнация', description: 'Консигнационные операции', requiresPayment: true },
  { code: '09', name: 'Прочие', description: 'Другие виды сделок', requiresPayment: true },
] as const;

/**
 * Коды условий оплаты (вторая часть графы 24)
 * Связаны с валютой из графы 22
 */
export const PAYMENT_CONDITION_CODES = [
  { code: '100', name: 'Предоплата 100%', description: 'Полная предоплата' },
  { code: '110', name: 'Частичная предоплата', description: 'Аванс + остаток после поставки' },
  { code: '200', name: 'Оплата по факту', description: 'Оплата после поставки' },
  { code: '210', name: 'Отсрочка до 30 дней', description: 'Краткосрочная отсрочка' },
  { code: '220', name: 'Отсрочка 30-90 дней', description: 'Среднесрочная отсрочка' },
  { code: '230', name: 'Отсрочка более 90 дней', description: 'Долгосрочная отсрочка' },
  { code: '300', name: 'Аккредитив', description: 'Документарный аккредитив' },
  { code: '400', name: 'Инкассо', description: 'Документарное инкассо' },
  { code: '500', name: 'Открытый счёт', description: 'Без обеспечения' },
  { code: '000', name: 'Без оплаты', description: 'Безвозмездно, бартер' },
] as const;

// =============================================================================
// ГРАФА 41 - ЕДИНИЦЫ ИЗМЕРЕНИЯ
// =============================================================================

/**
 * Коды единиц измерения (ОКЕИ - Общероссийский классификатор)
 */
export const UNIT_CODES = [
  { code: '006', name: 'м', fullName: 'метр' },
  { code: '055', name: 'м²', fullName: 'квадратный метр' },
  { code: '113', name: 'м³', fullName: 'кубический метр' },
  { code: '166', name: 'кг', fullName: 'килограмм' },
  { code: '168', name: 'т', fullName: 'тонна' },
  { code: '112', name: 'л', fullName: 'литр' },
  { code: '796', name: 'шт', fullName: 'штука' },
  { code: '778', name: 'упак', fullName: 'упаковка' },
  { code: '736', name: 'рулон', fullName: 'рулон' },
  { code: '715', name: 'пара', fullName: 'пара' },
  { code: '625', name: 'лист', fullName: 'лист' },
  { code: '657', name: 'изделие', fullName: 'изделие' },
  { code: '704', name: 'набор', fullName: 'набор' },
  { code: '839', name: 'доза', fullName: 'доза' },
  { code: '868', name: 'ГВт.ч', fullName: 'гигаватт-час' },
  { code: '876', name: 'ТДж', fullName: 'тераджоуль' },
] as const;

// =============================================================================
// ГРАФА 43 - МЕТОДЫ ОПРЕДЕЛЕНИЯ ТАМОЖЕННОЙ СТОИМОСТИ
// =============================================================================

/**
 * Методы определения таможенной стоимости (статья 17-22 ТК РУз)
 */
export const VALUATION_METHOD_CODES = [
  { code: '1', name: 'По стоимости сделки с ввозимыми товарами', description: 'Основной метод (ст.17)' },
  { code: '2', name: 'По стоимости сделки с идентичными товарами', description: 'Метод 2 (ст.18)' },
  { code: '3', name: 'По стоимости сделки с однородными товарами', description: 'Метод 3 (ст.19)' },
  { code: '4', name: 'Метод вычитания', description: 'На основе цены продажи в РУз (ст.20)' },
  { code: '5', name: 'Метод сложения', description: 'На основе расчетной стоимости (ст.21)' },
  { code: '6', name: 'Резервный метод', description: 'При невозможности применения методов 1-5 (ст.22)' },
] as const;

// =============================================================================
// ГРАФА 36 - ПРЕФЕРЕНЦИИ
// =============================================================================

/**
 * Коды преференций (льгот по уплате таможенных платежей)
 */
export const PREFERENCE_CODES = [
  { code: '000', name: 'Без преференций', description: 'Льготы не применяются' },
  { code: '100', name: 'Тарифные преференции', description: 'Снижение ставки пошлины' },
  { code: '200', name: 'Освобождение от пошлины', description: 'Полное освобождение' },
  { code: '300', name: 'Освобождение от НДС', description: 'Освобождение от НДС' },
  { code: '400', name: 'Освобождение от акциза', description: 'Освобождение от акциза' },
  { code: '500', name: 'СЭЗ', description: 'Льготы свободной экономической зоны' },
  { code: '600', name: 'Инвестиционные льготы', description: 'Льготы по инвестиционным проектам' },
] as const;

// =============================================================================
// ГРАФА 47 - СТАВКИ ТАМОЖЕННЫХ ПЛАТЕЖЕЙ
// =============================================================================

/**
 * Базовые ставки таможенных платежей в Узбекистане
 */
export const DUTY_RATES = {
  // Стандартная ставка НДС
  VAT_RATE: 12, // 12%
  
  // Базовая ставка таможенной пошлины (средняя)
  DEFAULT_DUTY_RATE: 15, // 15%
  
  // Таможенный сбор за оформление
  CUSTOMS_FEE_RATE: 0.2, // 0.2% от там.стоимости, мин 50 000 сум
  CUSTOMS_FEE_MIN: 50000, // минимальный сбор
  CUSTOMS_FEE_MAX: 3000000, // максимальный сбор
} as const;

/**
 * Примерные ставки пошлин по группам HS кода
 * Первые 2 цифры HS кода определяют группу товаров
 */
export const DUTY_RATES_BY_HS_GROUP: Record<string, { rate: number; description: string }> = {
  '01': { rate: 0, description: 'Живые животные' },
  '02': { rate: 15, description: 'Мясо и мясопродукты' },
  '03': { rate: 10, description: 'Рыба' },
  '04': { rate: 15, description: 'Молочные продукты' },
  '07': { rate: 15, description: 'Овощи' },
  '08': { rate: 15, description: 'Фрукты' },
  '09': { rate: 15, description: 'Кофе, чай, специи' },
  '10': { rate: 0, description: 'Зерновые' },
  '15': { rate: 10, description: 'Жиры и масла' },
  '17': { rate: 30, description: 'Сахар' },
  '20': { rate: 20, description: 'Продукты переработки овощей/фруктов' },
  '21': { rate: 20, description: 'Пищевые продукты' },
  '22': { rate: 50, description: 'Напитки, алкоголь' },
  '24': { rate: 30, description: 'Табак' },
  '27': { rate: 0, description: 'Топливо, нефтепродукты' },
  '28': { rate: 5, description: 'Химические продукты неорганические' },
  '29': { rate: 5, description: 'Химические продукты органические' },
  '30': { rate: 0, description: 'Фармацевтика' },
  '39': { rate: 10, description: 'Пластмассы' },
  '40': { rate: 10, description: 'Каучук, резина' },
  '44': { rate: 15, description: 'Древесина' },
  '48': { rate: 15, description: 'Бумага' },
  '50': { rate: 0, description: 'Шёлк' },
  '52': { rate: 5, description: 'Хлопок' },
  '61': { rate: 30, description: 'Одежда трикотажная' },
  '62': { rate: 30, description: 'Одежда текстильная' },
  '64': { rate: 30, description: 'Обувь' },
  '70': { rate: 15, description: 'Стекло' },
  '72': { rate: 5, description: 'Чёрные металлы' },
  '73': { rate: 15, description: 'Изделия из чёрных металлов' },
  '84': { rate: 0, description: 'Оборудование, машины' },
  '85': { rate: 5, description: 'Электротехника' },
  '87': { rate: 30, description: 'Автомобили' },
  '90': { rate: 0, description: 'Оптика, медтехника' },
  '94': { rate: 20, description: 'Мебель' },
  '95': { rate: 20, description: 'Игрушки' },
};

/**
 * Страны с преференциальным режимом (СНГ и др.)
 */
export const PREFERENTIAL_COUNTRIES: Record<string, { preferenceCode: string; description: string }> = {
  // СНГ - зона свободной торговли
  'RU': { preferenceCode: '200', description: 'Россия - ЗСТ СНГ' },
  'KZ': { preferenceCode: '200', description: 'Казахстан - ЗСТ СНГ' },
  'KG': { preferenceCode: '200', description: 'Кыргызстан - ЗСТ СНГ' },
  'TJ': { preferenceCode: '200', description: 'Таджикистан - ЗСТ СНГ' },
  'BY': { preferenceCode: '200', description: 'Беларусь - ЗСТ СНГ' },
  'AZ': { preferenceCode: '200', description: 'Азербайджан - ЗСТ СНГ' },
  'AM': { preferenceCode: '200', description: 'Армения - ЗСТ СНГ' },
  'MD': { preferenceCode: '200', description: 'Молдова - ЗСТ СНГ' },
  'UA': { preferenceCode: '100', description: 'Украина - частичные преференции' },
  // GSP+ страны могут иметь сниженные ставки
  'TR': { preferenceCode: '100', description: 'Турция - соглашение о торговле' },
  'GE': { preferenceCode: '100', description: 'Грузия - соглашение о торговле' },
};

// =============================================================================
// МАППИНГ ДОКУМЕНТОВ К ГРАФАМ ГТД
// =============================================================================

/**
 * Какие данные можно извлечь из каждого типа документа
 * и в какие графы ГТД они попадают
 */
export const DOCUMENT_TO_GTD_FIELDS = {
  // CMR (международная товарно-транспортная накладная)
  CMR: {
    name: 'CMR (Товарно-транспортная накладная)',
    code: '202',
    extractableFields: {
      // Графа 2 - Отправитель
      exporterName: { graph: '2', label: 'Отправитель', confidence: 0.95 },
      exporterCountry: { graph: '2', label: 'Страна отправителя', confidence: 0.95 },
      // Графа 8 - Получатель  
      consigneeName: { graph: '8', label: 'Получатель', confidence: 0.95 },
      consigneeCountry: { graph: '8', label: 'Страна получателя', confidence: 0.95 },
      // Графа 15 - Страна отправления
      dispatchCountry: { graph: '15', label: 'Страна отправления', confidence: 0.9 },
      dispatchCountryCode: { graph: '15а', label: 'Код страны отправления', confidence: 0.9 },
      // Графа 17 - Страна назначения
      transitDestinationCountry: { graph: '17', label: 'Страна назначения', confidence: 0.9 },
      destinationCountryCode: { graph: '17а', label: 'Код страны назначения', confidence: 0.9 },
      // Графа 18 - Транспорт
      departureTransportType: { graph: '18', label: 'Вид транспорта', confidence: 0.95 },
      departureTransportNumber: { graph: '18', label: 'Гос.номер ТС', confidence: 0.95 },
      transportCount: { graph: '18', label: 'Кол-во ТС', confidence: 0.9 },
      // Графа 19 - Контейнер
      containerIndicator: { graph: '19', label: 'Контейнерная перевозка', confidence: 0.9 },
      containerNumbers: { graph: '19', label: 'Номера контейнеров', confidence: 0.85 },
      // Графа 27 - Место погрузки
      loadingPlace: { graph: '27', label: 'Место погрузки', confidence: 0.85 },
      // Графа 29 - Таможня на границе
      entryCustomsOffice: { graph: '29', label: 'Таможня на границе', confidence: 0.8 },
      // Графа 30 - Местонахождение товаров
      goodsLocation: { graph: '30', label: 'Местонахождение товаров', confidence: 0.8 },
      // Товары - вес брутто
      'items.grossWeight': { graph: '35', label: 'Вес брутто', confidence: 0.9 },
      'items.packageQuantity': { graph: '31', label: 'Количество мест', confidence: 0.9 },
    },
  },

  // Инвойс (коммерческий счёт)
  INVOICE: {
    name: 'Invoice (Счёт-фактура)',
    code: '220',
    extractableFields: {
      // Графа 2 - Продавец/Отправитель
      exporterName: { graph: '2', label: 'Продавец', confidence: 0.95 },
      exporterTin: { graph: '2', label: 'ИНН продавца', confidence: 0.9 },
      exporterCountry: { graph: '2', label: 'Страна продавца', confidence: 0.95 },
      // Графа 8 - Покупатель/Получатель
      consigneeName: { graph: '8', label: 'Покупатель', confidence: 0.95 },
      consigneeTin: { graph: '8', label: 'ИНН покупателя', confidence: 0.95 },
      consigneeCountry: { graph: '8', label: 'Страна покупателя', confidence: 0.9 },
      // Графа 11 - Торговая страна
      tradingCountry: { graph: '11', label: 'Торговая страна', confidence: 0.9 },
      tradingCountryCode: { graph: '11', label: 'Код торговой страны', confidence: 0.9 },
      // Графа 20 - Условия поставки
      incotermsCode: { graph: '20', label: 'Incoterms код', confidence: 0.95 },
      deliveryPlace: { graph: '20', label: 'Место поставки', confidence: 0.85 },
      // Графа 22 - Валюта и стоимость
      currency: { graph: '22', label: 'Валюта', confidence: 0.95 },
      totalInvoiceAmount: { graph: '22', label: 'Общая стоимость', confidence: 0.95 },
      // Графа 24 - Характер сделки
      transactionNature: { graph: '24', label: 'Характер сделки', confidence: 0.8 },
      // Товары
      'items.description': { graph: '31', label: 'Описание товара', confidence: 0.95 },
      'items.hsCode': { graph: '33', label: 'Код ТН ВЭД', confidence: 0.85 },
      'items.originCountryCode': { graph: '34', label: 'Страна происхождения', confidence: 0.9 },
      'items.quantity': { graph: '31', label: 'Количество', confidence: 0.95 },
      'items.itemPrice': { graph: '42', label: 'Цена за единицу', confidence: 0.95 },
      'items.netWeight': { graph: '38', label: 'Вес нетто', confidence: 0.85 },
    },
  },

  // Контракт
  CONTRACT: {
    name: 'Contract (Контракт)',
    code: '240',
    extractableFields: {
      // Стороны контракта
      exporterName: { graph: '2', label: 'Продавец по контракту', confidence: 0.9 },
      consigneeName: { graph: '8', label: 'Покупатель по контракту', confidence: 0.9 },
      // Финансовые условия
      currency: { graph: '22', label: 'Валюта контракта', confidence: 0.9 },
      incotermsCode: { graph: '20', label: 'Базис поставки', confidence: 0.9 },
      transactionNature: { graph: '24', label: 'Тип сделки', confidence: 0.85 },
      transactionCurrencyCode: { graph: '24', label: 'Условия оплаты', confidence: 0.8 },
      // Номер для справки
      referenceNumber: { graph: '4', label: 'Номер контракта', confidence: 0.95 },
    },
  },

  // Сертификат происхождения
  CERTIFICATE: {
    name: 'Certificate of Origin (Сертификат происхождения)',
    code: '102',
    extractableFields: {
      // Страна происхождения
      'items.originCountryCode': { graph: '34', label: 'Страна происхождения', confidence: 0.98 },
      // Преференции
      'items.preferenceCode': { graph: '36', label: 'Преференция', confidence: 0.9 },
    },
  },

  // Упаковочный лист
  PACKING_LIST: {
    name: 'Packing List (Упаковочный лист)',
    code: '271',
    extractableFields: {
      // Данные о товарах
      'items.description': { graph: '31', label: 'Описание товара', confidence: 0.95 },
      'items.packageQuantity': { graph: '31', label: 'Количество мест', confidence: 0.98 },
      'items.packageType': { graph: '31', label: 'Тип упаковки', confidence: 0.9 },
      'items.grossWeight': { graph: '35', label: 'Вес брутто', confidence: 0.95 },
      'items.netWeight': { graph: '38', label: 'Вес нетто', confidence: 0.95 },
      'items.marksNumbers': { graph: '31', label: 'Маркировка', confidence: 0.85 },
      // Общие данные
      totalPackages: { graph: '6', label: 'Всего мест', confidence: 0.98 },
    },
  },

  // Коносамент (Bill of Lading)
  BILL_OF_LADING: {
    name: 'Bill of Lading (Коносамент)',
    code: '207',
    extractableFields: {
      // Отправитель/Получатель
      exporterName: { graph: '2', label: 'Грузоотправитель', confidence: 0.95 },
      consigneeName: { graph: '8', label: 'Грузополучатель', confidence: 0.95 },
      // Транспорт
      departureTransportType: { graph: '18', label: 'Вид транспорта', confidence: 0.95 },
      containerNumbers: { graph: '19', label: 'Номера контейнеров', confidence: 0.95 },
      containerIndicator: { graph: '19', label: 'Контейнерная перевозка', confidence: 0.95 },
      // Порты
      loadingPlace: { graph: '27', label: 'Порт погрузки', confidence: 0.9 },
      // Вес
      'items.grossWeight': { graph: '35', label: 'Вес брутто', confidence: 0.9 },
    },
  },
} as const;

/**
 * Типы документов которые обычно загружают пользователи
 */
export const COMMON_DOCUMENT_TYPES = ['CMR', 'INVOICE', 'CONTRACT', 'PACKING_LIST'] as const;

/**
 * Приоритет документов при конфликте данных
 * (если одно поле есть в нескольких документах)
 */
export const DOCUMENT_PRIORITY: Record<string, number> = {
  'CERTIFICATE': 100,  // Сертификат - самый надёжный для происхождения
  'INVOICE': 90,       // Инвойс - надёжный для цен и товаров
  'CMR': 85,           // CMR - надёжный для транспорта
  'BILL_OF_LADING': 80,
  'PACKING_LIST': 75,
  'CONTRACT': 70,
  'OTHER': 50,
};

// =============================================================================
// ПРАВИЛА ВАЛИДАЦИИ
// =============================================================================

/**
 * Правила взаимозависимости граф
 */
export const VALIDATION_RULES = {
  // Вес нетто не может превышать вес брутто
  WEIGHT_VALIDATION: {
    rule: 'netWeight <= grossWeight',
    errorMessage: 'Вес нетто (графа 38) не может превышать вес брутто (графа 35)',
  },
  
  // Расчет таможенной стоимости
  CUSTOMS_VALUE_CALCULATION: {
    rule: 'customsValue = invoiceValue + transportCosts (if Incoterms E/F)',
    description: 'При условиях поставки группы E или F, таможенная стоимость = фактурная стоимость + транспортные расходы',
  },
  
  // Агрегация данных для добавочных листов
  AGGREGATION_RULES: {
    totalItems: 'Графа 5 = количество заполненных граф 31',
    totalGrossWeight: 'Графа 35 основного листа = сумма граф 35 всех товаров',
    totalNetWeight: 'Графа 38 основного листа = сумма граф 38 всех товаров',
    totalCustomsValue: 'Графа 12 = сумма граф 45 всех товаров',
    totalInvoiceValue: 'Графа 22 = сумма граф 42 всех товаров',
  },
  
  // Обязательные документы в зависимости от режима
  REQUIRED_DOCUMENTS_BY_REGIME: {
    '40': ['301', '220', '207'], // Импорт: контракт, инвойс, транспортный документ
    '10': ['301', '220', '207'], // Экспорт: контракт, инвойс, транспортный документ
    '31': ['301', '220', '207', '601'], // Временный ввоз: + документ-основание
  },
} as const;

// =============================================================================
// ЭКСПОРТ ТИПОВ
// =============================================================================

export type MovementDirection = typeof MOVEMENT_DIRECTIONS[number];
export type CustomsRegime = typeof CUSTOMS_REGIMES[number];
export type TransportType = typeof TRANSPORT_TYPES[number];
export type AutoVehicleType = typeof AUTO_VEHICLE_TYPES[number];
export type DeliveryTerm = typeof DELIVERY_TERMS[number];
export type PaymentForm = typeof PAYMENT_FORMS[number];
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type DocumentCode = typeof DOCUMENT_CODES[number];
export type CustomsPayment = typeof CUSTOMS_PAYMENTS[number];
export type IncotermsGroup = keyof typeof INCOTERMS_GROUPS;
export type PreviousDocumentType = typeof PREVIOUS_DOCUMENT_TYPES[number];
export type TransactionNatureCode = typeof TRANSACTION_NATURE_CODES[number];
export type PaymentConditionCode = typeof PAYMENT_CONDITION_CODES[number];
export type UnitCode = typeof UNIT_CODES[number];
export type ValuationMethodCode = typeof VALUATION_METHOD_CODES[number];
export type PreferenceCode = typeof PREFERENCE_CODES[number];
