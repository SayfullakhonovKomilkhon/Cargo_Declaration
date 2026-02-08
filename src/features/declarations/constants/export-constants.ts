/**
 * Константы для режима ЭКСПОРТ (код 10)
 * Согласно Инструкции ГТК РУз №2773 и Приложениям
 */

// ===========================================
// ГРАФА 1 — ТИП ДЕКЛАРАЦИИ
// ===========================================

export const EXPORT_DIRECTION = 'ЭК' as const;
export const EXPORT_REGIME_CODE = '10' as const;

// ===========================================
// ВИДЫ ТРАНСПОРТА (Приложение №6)
// ===========================================

export const TRANSPORT_TYPES = [
  { code: '10', name: 'Морской', shortName: 'МОР' },
  { code: '20', name: 'Железнодорожный', shortName: 'ЖД' },
  { code: '30', name: 'Автомобильный', shortName: 'АВТО' },
  { code: '40', name: 'Авиационный', shortName: 'АВИА' },
  { code: '50', name: 'Почтовое отправление', shortName: 'ПОЧТА' },
  { code: '71', name: 'Трубопроводный', shortName: 'ТРУБОПРОВОД' },
  { code: '72', name: 'Линии электропередачи', shortName: 'ЛЭП' },
  { code: '80', name: 'Речной', shortName: 'РЕЧ' },
  { code: '90', name: 'Самоходом', shortName: 'САМОХОД' },
] as const;

export const TRANSPORT_TYPE_MAP = Object.fromEntries(
  TRANSPORT_TYPES.map(t => [t.code, t])
);

// ===========================================
// ТИПЫ АВТОТРАНСПОРТА (для графы 18)
// ===========================================

export const AUTO_TRANSPORT_TYPES = [
  { code: '10', name: 'Легковой автомобиль (до 8 мест)' },
  { code: '21', name: 'Грузовой до 10т' },
  { code: '22', name: 'Грузовой 10-20т' },
  { code: '23', name: 'Грузовой более 20т' },
  { code: '31', name: 'Автобус до 12 мест' },
  { code: '32', name: 'Автобус 13-30 мест' },
  { code: '33', name: 'Автобус более 30 мест' },
  { code: '40', name: 'Микроавтобус' },
  { code: '50', name: 'Трактор' },
  { code: '60', name: 'Мототранспорт' },
  { code: '70', name: 'Специальный транспорт' },
] as const;

// ===========================================
// УСЛОВИЯ ПОСТАВКИ — INCOTERMS (Приложение №7)
// ===========================================

export const INCOTERMS = [
  // Группа E — отгрузка
  { code: '11', alpha: 'EXW', name: 'Франко-завод', group: 'E' },
  
  // Группа F — основная перевозка не оплачена
  { code: '12', alpha: 'FCA', name: 'Франко-перевозчик', group: 'F' },
  { code: '21', alpha: 'FAS', name: 'Свободно вдоль борта судна', group: 'F' },
  { code: '22', alpha: 'FOB', name: 'Свободно на борту', group: 'F' },
  
  // Группа C — основная перевозка оплачена
  { code: '31', alpha: 'CFR', name: 'Стоимость и фрахт', group: 'C' },
  { code: '32', alpha: 'CIF', name: 'Стоимость, страхование и фрахт', group: 'C' },
  { code: '13', alpha: 'CPT', name: 'Перевозка оплачена до', group: 'C' },
  { code: '14', alpha: 'CIP', name: 'Перевозка и страхование оплачены до', group: 'C' },
  
  // Группа D — прибытие
  { code: '14', alpha: 'DAP', name: 'Поставка в месте назначения', group: 'D' },
  { code: '15', alpha: 'DPU', name: 'Поставка в месте выгрузки', group: 'D' },
  { code: '17', alpha: 'DDP', name: 'Поставка с оплатой пошлины', group: 'D' },
  
  // Устаревшие (но могут встречаться)
  { code: '41', alpha: 'DAF', name: 'Поставка на границе', group: 'D', deprecated: true },
  { code: '42', alpha: 'DES', name: 'Поставка с судна', group: 'D', deprecated: true },
  { code: '43', alpha: 'DEQ', name: 'Поставка с причала', group: 'D', deprecated: true },
  { code: '44', alpha: 'DDU', name: 'Поставка без оплаты пошлины', group: 'D', deprecated: true },
] as const;

export const INCOTERMS_MAP = Object.fromEntries(
  INCOTERMS.map(i => [i.code, i])
);

export const INCOTERMS_ALPHA_MAP = Object.fromEntries(
  INCOTERMS.map(i => [i.alpha, i])
);

// ===========================================
// ФОРМЫ РАСЧЁТОВ (Графа 20, подраздел 3)
// ===========================================

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

export const PAYMENT_FORM_MAP = Object.fromEntries(
  PAYMENT_FORMS.map(p => [p.code, p])
);

// ===========================================
// ФОРМЫ ОТПРАВКИ (Графа 20, подраздел 3)
// ===========================================

export const SHIPPING_FORMS = [
  { code: '01', name: 'Товар отправляется напрямую контрагенту' },
  { code: '02', name: 'Товар НЕ отправляется напрямую контрагенту' },
] as const;

// ===========================================
// ХАРАКТЕР СДЕЛКИ (Приложение №9)
// ===========================================

export const TRANSACTION_TYPES = [
  // Группа 1: Операции с правом собственности
  { code: '11', name: 'Продажа с расчётом в денежной форме', group: '1' },
  { code: '12', name: 'Возврат товаров', group: '1' },
  { code: '13', name: 'Реализация на торгах', group: '1' },
  
  // Группа 2: Безвозмездные операции
  { code: '21', name: 'Безвозмездные операции между резидентами', group: '2' },
  { code: '22', name: 'Гуманитарная помощь', group: '2' },
  { code: '23', name: 'Техническая помощь', group: '2' },
  
  // Группа 3: Бартер
  { code: '31', name: 'Бартерные операции', group: '3' },
  { code: '32', name: 'Компенсационная торговля', group: '3' },
  
  // Группа 4: Переработка
  { code: '41', name: 'Переработка на таможенной территории', group: '4' },
  { code: '42', name: 'Переработка вне таможенной территории', group: '4' },
  
  // Группа 5: Аренда/лизинг
  { code: '51', name: 'Операционный лизинг/аренда', group: '5' },
  { code: '52', name: 'Финансовый лизинг', group: '5' },
  
  // Группа 6: Прочие
  { code: '60', name: 'Прочие операции', group: '6' },
] as const;

export const TRANSACTION_TYPE_MAP = Object.fromEntries(
  TRANSACTION_TYPES.map(t => [t.code, t])
);

// ===========================================
// СПОСОБЫ ПЛАТЕЖА (Графа 47, колонка СП)
// ===========================================

export const PAYMENT_METHODS = [
  { code: 'БН', name: 'Безналичный расчёт' },
  { code: 'КТ', name: 'Наличными' },
  { code: 'УН', name: 'Условное начисление' },
  { code: 'ОП', name: 'Отсрочка' },
  { code: 'РП', name: 'Рассрочка' },
  { code: 'ВЗ', name: 'Взаимозачёт НДС' },
  { code: 'ОО', name: 'Платёж не производится' },
] as const;

export const PAYMENT_METHOD_MAP = Object.fromEntries(
  PAYMENT_METHODS.map(p => [p.code, p])
);

// ===========================================
// ВИДЫ ТАМОЖЕННЫХ ПЛАТЕЖЕЙ (Приложение №13)
// ===========================================

export const CUSTOMS_PAYMENT_TYPES = [
  // Сборы за оформление
  { code: '10', name: 'Сбор за таможенное оформление', category: 'fees' },
  { code: '11', name: 'Сбор за оформление (переработка, транзит)', category: 'fees' },
  { code: '12', name: 'Сбор за оформление вне времени работы', category: 'fees' },
  { code: '13', name: 'Сбор за досмотр вне места/времени', category: 'fees' },
  { code: '14', name: 'Сбор за оформление валюты', category: 'fees' },
  
  // Пошлины и налоги
  { code: '20', name: 'Импортная таможенная пошлина', category: 'duties' },
  { code: '25', name: 'Экспортная таможенная пошлина', category: 'duties' },
  { code: '27', name: 'Акцизный налог (ввоз)', category: 'taxes' },
  { code: '28', name: 'Акцизный налог (вывоз)', category: 'taxes' },
  { code: '29', name: 'НДС', category: 'taxes' },
  { code: '30', name: 'Единый таможенный платёж', category: 'taxes' },
] as const;

export const CUSTOMS_PAYMENT_MAP = Object.fromEntries(
  CUSTOMS_PAYMENT_TYPES.map(p => [p.code, p])
);

// Платежи для экспорта
export const EXPORT_PAYMENT_TYPES = ['10', '25', '28'] as const;

// ===========================================
// КОДЫ ДОКУМЕНТОВ (Приложение №12) — для экспорта
// ===========================================

export const EXPORT_DOCUMENT_TYPES = [
  // Лицензии (1XX)
  { code: '101', name: 'Лицензия', abbr: 'ЛИЦЕНЗИЯ' },
  { code: '102', name: 'Разрешение (квота)', abbr: 'РАЗРЕШ' },
  
  // Транспортные документы (2XX)
  { code: '201', name: 'Коносамент', abbr: 'КОНОСАМЕНТ' },
  { code: '204', name: 'ЖД накладная', abbr: 'ЖД' },
  { code: '205', name: 'Авианакладная', abbr: 'АВИА' },
  { code: '206', name: 'CMR', abbr: 'CMR' },
  { code: '210', name: 'Товарно-транспортная накладная', abbr: 'ТТН' },
  { code: '220', name: 'Инвойс', abbr: 'ИНВ' },
  { code: '221', name: 'Проформа-инвойс', abbr: 'ПРОФ' },
  { code: '224', name: 'Упаковочный лист', abbr: 'УПЛ' },
  
  // Контракты (3XX)
  { code: '301', name: 'Контракт', abbr: 'КНТ' },
  { code: '302', name: 'Дополнение к контракту', abbr: 'ДОП' },
  { code: '303', name: 'Протокол разногласий', abbr: 'ПРОТ' },
  { code: '304', name: 'Спецификация', abbr: 'СПЕЦ' },
  
  // Разрешения и сертификаты (4XX)
  { code: '401', name: 'Ветеринарный сертификат', abbr: 'ВЕТС' },
  { code: '402', name: 'Карантинное разрешение', abbr: 'КАРАНТ' },
  { code: '417', name: 'Сертификат соответствия', abbr: 'ССТ' },
  { code: '418', name: 'Санитарно-эпидемиологическое заключение', abbr: 'СЭЗ' },
  { code: '419', name: 'Фитосанитарный сертификат', abbr: 'ФТСС' },
  
  // Регистрация (5XX)
  { code: '501', name: 'Регистрация контракта МИВТ', abbr: 'рег МИВТ' },
  { code: '502', name: 'Свидетельство о регистрации ИП', abbr: 'СвИПБЮЛ' },
  
  // Льготы (6XX)
  { code: '601', name: 'Документ освобождения от сбора', abbr: 'ЛЬГОТ' },
  { code: '602', name: 'Документ освобождения от пошлины', abbr: 'ЛЬГОТ' },
  { code: '603', name: 'Документ освобождения от акциза', abbr: 'ЛЬГОТ' },
  { code: '604', name: 'Документ освобождения от НДС', abbr: 'ЛЬГОТ' },
  
  // Сертификаты происхождения (7XX)
  { code: '701', name: 'Сертификат происхождения форма А', abbr: 'СПА' },
  { code: '702', name: 'Сертификат происхождения СНГ', abbr: 'СПТЭК' },
  { code: '703', name: 'Сертификат происхождения общей формы', abbr: 'СПО' },
  
  // Акты (8XX)
  { code: '817', name: 'Акт передачи товаров', abbr: 'АКТ' },
  { code: '818', name: 'Акт уничтожения', abbr: 'АКТ' },
] as const;

export const EXPORT_DOCUMENT_MAP = Object.fromEntries(
  EXPORT_DOCUMENT_TYPES.map(d => [d.code, d])
);

// ===========================================
// ОСОБЕННОСТИ ПЕРЕМЕЩЕНИЯ (Приложение №11)
// ===========================================

export const MOVEMENT_SPECIFICS = [
  { code: '000', name: 'Без особенностей' },
  { code: '001', name: 'Гуманитарная помощь' },
  { code: '002', name: 'Техническая помощь' },
  { code: '003', name: 'Инвестиционные товары' },
  { code: '004', name: 'Товары для личного пользования' },
  { code: '005', name: 'Образцы товаров' },
  { code: '006', name: 'Выставочные экспонаты' },
  { code: '014', name: 'Ремонт' },
  { code: '015', name: 'Гарантийная замена' },
  { code: '020', name: 'Переработка на таможенной территории' },
  { code: '021', name: 'Переработка вне таможенной территории' },
] as const;

export const MOVEMENT_SPECIFIC_MAP = Object.fromEntries(
  MOVEMENT_SPECIFICS.map(m => [m.code, m])
);

// ===========================================
// КОДЫ СТАТУСА ЛИЦА
// ===========================================

/**
 * Коды статуса лица (правый верхний угол граф 2, 9)
 * Согласно Инструкции ГТК РУз №2773 (в редакции от 03.11.2019 №2773-4)
 * Для прочих лиц (юридических лиц и др.) код НЕ УКАЗЫВАЕТСЯ
 */
export const PERSON_STATUS_CODES = [
  { code: '00000001', name: 'Физическое лицо — резидент' },
  { code: '00000002', name: 'Физическое лицо — нерезидент' },
  { code: '88888888', name: 'Представительства международных межправительственных организаций' },
  { code: '99999999', name: 'Дипломатические представительства и консульские учреждения' },
] as const;

export const PERSON_STATUS_MAP = Object.fromEntries(
  PERSON_STATUS_CODES.map(p => [p.code, p])
);

// ===========================================
// ТИПЫ ЛИЦ (для графы 2)
// ===========================================

export const PERSON_TYPES = [
  { code: 'individual', name: 'Физическое лицо' },
  { code: 'legal_entity', name: 'Юридическое лицо' },
] as const;

// ===========================================
// СЦЕНАРИИ ЗАПОЛНЕНИЯ ГРАФЫ 2
// ===========================================

export const GRAPH2_SCENARIOS = [
  { 
    code: 'same_person', 
    name: 'Экспортер и отправитель — одно лицо',
    description: 'Отправитель является экспортером товаров'
  },
  { 
    code: 'subdivision', 
    name: 'Структурное подразделение',
    description: 'От имени экспортера выступает структурное подразделение (филиал)'
  },
  { 
    code: 'different_persons', 
    name: 'Экспортер и отправитель — разные лица',
    description: 'Отправитель поставляет товар по поручению экспортера'
  },
] as const;

// ===========================================
// МЕТОДЫ ОПРЕДЕЛЕНИЯ (Графа 43)
// ===========================================

export const PRODUCTION_METHODS = [
  { code: '0', name: 'Экспорт продукции НЕ собственного производства' },
  { code: '1', name: 'Экспорт продукции собственного производства' },
] as const;

// ===========================================
// ТИПЫ УПАКОВКИ
// ===========================================

export const PACKAGE_TYPES = [
  { code: 'CT', name: 'Картонная коробка' },
  { code: 'BX', name: 'Ящик (деревянный)' },
  { code: 'PK', name: 'Упаковка' },
  { code: 'BG', name: 'Мешок' },
  { code: 'PL', name: 'Паллета' },
  { code: 'DR', name: 'Барабан' },
  { code: 'CN', name: 'Контейнер' },
  { code: 'TB', name: 'Туба' },
  { code: 'RL', name: 'Рулон' },
  { code: 'CR', name: 'Ящик пластиковый' },
  { code: 'NE', name: 'Без упаковки' },
] as const;

export const BULK_TYPES = [
  { code: '01', name: 'Насыпью' },
  { code: '02', name: 'Навалом' },
  { code: '03', name: 'Наливом' },
] as const;

// ===========================================
// ВАЛИДАЦИОННЫЕ КОНСТАНТЫ
// ===========================================

export const VALIDATION = {
  /** Максимальная длина описания товара */
  MAX_DESCRIPTION_LENGTH: 2000,
  
  /** Максимальное количество товаров в одной ГТД */
  MAX_ITEMS: 999,
  
  /** Максимальное количество документов на товар */
  MAX_DOCUMENTS_PER_ITEM: 99,
  
  /** Точность округления стоимости */
  VALUE_PRECISION: 2,
  
  /** Точность округления веса (кг) */
  WEIGHT_PRECISION: 3,
  
  /** Точность округления для малых весов */
  SMALL_WEIGHT_PRECISION: 6,
  
  /** Порог для малых весов (кг) */
  SMALL_WEIGHT_THRESHOLD: 0.001,
  
  /** Точность статистической стоимости (тыс. USD) */
  STAT_VALUE_PRECISION: 3,
} as const;

// ===========================================
// УТИЛИТЫ ФОРМАТИРОВАНИЯ
// ===========================================

/**
 * Форматирование номера ТС для графы 18
 */
export function formatTransportNumber(
  count: number,
  transportType: string,
  numbers: string[]
): string {
  const shortName = TRANSPORT_TYPE_MAP[transportType]?.shortName || transportType;
  return `${count} ${shortName}: ${numbers.join('; ')}`;
}

/**
 * Форматирование кода процедуры для графы 37
 */
export function formatProcedureCode(
  currentRegime: string = '10',
  previousRegime: string = '00',
  movementSpecific: string = '000'
): string {
  return `${currentRegime}${previousRegime}${movementSpecific}`;
}

/**
 * Форматирование ИНН/ПИНФЛ с кодом района
 */
export function formatInnWithRegion(inn: string, regionCode: string): string {
  return `${inn}/${regionCode}`;
}

/**
 * Форматирование курса валюты для графы 23
 */
export function formatExchangeRate(quantity: number, rate: number): string {
  return `${quantity}/${rate.toFixed(2).replace('.', ',')}`;
}

/**
 * Округление веса согласно правилам
 */
export function roundWeight(weight: number): number {
  if (weight < VALIDATION.SMALL_WEIGHT_THRESHOLD) {
    return Number(weight.toFixed(VALIDATION.SMALL_WEIGHT_PRECISION));
  }
  return Number(weight.toFixed(VALIDATION.WEIGHT_PRECISION));
}

/**
 * Округление стоимости
 */
export function roundValue(value: number): number {
  return Number(value.toFixed(VALIDATION.VALUE_PRECISION));
}

/**
 * Расчёт статистической стоимости (в тыс. USD)
 */
export function calculateStatisticalValue(
  customsValue: number,
  currencyRate: number,
  usdRate: number
): number {
  const valueInUzs = customsValue * currencyRate;
  const valueInUsd = valueInUzs / usdRate;
  return Number((valueInUsd / 1000).toFixed(VALIDATION.STAT_VALUE_PRECISION));
}
