/**
 * Координаты полей для ГТД (Грузовая Таможенная Декларация)
 * 
 * Размеры страницы A4: 595 x 842 точек (PDF points)
 * Координаты измеряются от левого нижнего угла страницы
 * 
 * ВАЖНО: Эти координаты откалиброваны по официальному бланку ГТД
 */

export interface FieldCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  multiline?: boolean;
  font?: 'helvetica' | 'courier' | 'times';
  maxLines?: number;
}

export interface GTDCoordinates {
  [fieldName: string]: FieldCoordinates;
}

/**
 * Функция для получения координат с учётом смещения для добавочных листов
 * @param coords - базовые координаты
 * @param itemIndex - индекс товара (0 = первый товар, 1, 2, ... = товары на ТД2)
 * @param td2Offset - смещение Y для каждого товара на ТД2 (218 pts)
 */
export function getCoords(
  coords: FieldCoordinates,
  itemIndex: number = 0,
  td2Offset: number = 218
): FieldCoordinates {
  if (itemIndex === 0) return coords;
  
  return {
    ...coords,
    y: coords.y - (td2Offset * itemIndex),
  };
}

/**
 * Координаты полей для ТД1 (Основной лист)
 * Откалибровано по официальному бланку
 */
export const TD1_COORDINATES: GTDCoordinates = {
  // ========================================
  // БЛОК 1 - Тип декларации
  // ========================================
  declarationType: { x: 525, y: 815, width: 45, height: 20, fontSize: 12, align: 'center', font: 'courier' },
  declarationTypeCode: { x: 525, y: 800, width: 45, height: 15, fontSize: 10, align: 'center', font: 'courier' },
  declarationSubCode: { x: 525, y: 785, width: 45, height: 15, fontSize: 10, align: 'center', font: 'courier' },
  
  // ========================================
  // БЛОК A - Служебные отметки
  // ========================================
  blockA: { x: 480, y: 815, width: 100, height: 40, fontSize: 7, multiline: true },
  
  // ========================================
  // БЛОК 2 - Экспортер/Грузоотправитель
  // ========================================
  exporterName: { x: 85, y: 765, width: 250, height: 65, fontSize: 8, multiline: true, maxLines: 4 },
  exporterAddress: { x: 85, y: 735, width: 250, height: 25, fontSize: 7, multiline: true, maxLines: 2 },
  exporterTin: { x: 85, y: 708, width: 100, height: 12, fontSize: 8, font: 'courier' },
  exporterCountryCode: { x: 300, y: 708, width: 30, height: 12, fontSize: 9, align: 'center', font: 'courier' },
  
  // ========================================
  // БЛОКИ 3-7 (вторая строка)
  // ========================================
  additionalSheets: { x: 355, y: 765, width: 35, height: 20, fontSize: 11, align: 'center', font: 'courier' },
  loadingSpecs: { x: 395, y: 765, width: 45, height: 20, fontSize: 9, align: 'center' },
  totalItems: { x: 355, y: 740, width: 45, height: 20, fontSize: 11, align: 'center', font: 'courier' },
  totalPackages: { x: 405, y: 740, width: 55, height: 20, fontSize: 10, align: 'center', font: 'courier' },
  declarationNumber: { x: 465, y: 740, width: 110, height: 20, fontSize: 9, font: 'courier' },
  declarationDate: { x: 465, y: 725, width: 80, height: 12, fontSize: 8 },
  
  // ========================================
  // БЛОК 8 - Импортер/Грузополучатель
  // ========================================
  consigneeName: { x: 85, y: 705, width: 250, height: 60, fontSize: 8, multiline: true, maxLines: 4 },
  consigneeAddress: { x: 85, y: 675, width: 250, height: 25, fontSize: 7, multiline: true, maxLines: 2 },
  consigneeTin: { x: 85, y: 648, width: 100, height: 12, fontSize: 8, font: 'courier' },
  
  // ========================================
  // БЛОК 9 - Лицо, ответственное за финансовое урегулирование
  // ========================================
  financialResponsibleName: { x: 350, y: 705, width: 220, height: 60, fontSize: 7, multiline: true, maxLines: 4 },
  financialResponsibleTin: { x: 350, y: 660, width: 100, height: 12, fontSize: 8, font: 'courier' },
  
  // ========================================
  // БЛОКИ 10-13 (страны и стоимость)
  // ========================================
  firstDestinationCountry: { x: 85, y: 645, width: 60, height: 15, fontSize: 8 },
  tradingCountry: { x: 150, y: 645, width: 80, height: 15, fontSize: 8 },
  tradingCountryCode: { x: 150, y: 630, width: 35, height: 12, fontSize: 9, align: 'center', font: 'courier' },
  offshoreIndicator: { x: 190, y: 630, width: 20, height: 12, fontSize: 9, align: 'center' },
  totalCustomsValue: { x: 240, y: 645, width: 100, height: 15, fontSize: 10, align: 'right', font: 'courier' },
  totalCustomsValueCurrency: { x: 345, y: 645, width: 30, height: 15, fontSize: 8 },
  block13: { x: 380, y: 645, width: 40, height: 15, fontSize: 7 },
  
  // ========================================
  // БЛОК 14 - Декларант/Таможенный брокер
  // ========================================
  declarantName: { x: 85, y: 645, width: 250, height: 60, fontSize: 8, multiline: true, maxLines: 3 },
  declarantAddress: { x: 85, y: 615, width: 250, height: 20, fontSize: 7, multiline: true },
  declarantTin: { x: 85, y: 598, width: 100, height: 12, fontSize: 8, font: 'courier' },
  
  // ========================================
  // БЛОКИ 15-17 (страны)
  // ========================================
  dispatchCountry: { x: 350, y: 645, width: 150, height: 15, fontSize: 8 },
  dispatchCountryCode: { x: 510, y: 645, width: 40, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  destinationCountryCode: { x: 555, y: 645, width: 40, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  originCountry: { x: 350, y: 625, width: 200, height: 15, fontSize: 8 },
  destinationCountry: { x: 350, y: 605, width: 150, height: 15, fontSize: 8 },
  
  // ========================================
  // БЛОК 18 - Транспортное средство
  // ========================================
  transportCount: { x: 85, y: 615, width: 25, height: 20, fontSize: 9, align: 'center', font: 'courier' },
  departureTransportType: { x: 115, y: 615, width: 70, height: 20, fontSize: 8 },
  departureTransportNumber: { x: 190, y: 615, width: 120, height: 20, fontSize: 8, font: 'courier' },
  transportNationality: { x: 315, y: 615, width: 30, height: 20, fontSize: 9, align: 'center', font: 'courier' },
  
  // ========================================
  // БЛОК 19 - Контейнер
  // ========================================
  containerIndicator: { x: 350, y: 615, width: 20, height: 20, fontSize: 11, align: 'center', font: 'courier' },
  
  // ========================================
  // БЛОК 20 - Условия поставки (Incoterms)
  // ========================================
  incotermsCode: { x: 350, y: 640, width: 40, height: 15, fontSize: 9, font: 'courier' },
  deliveryPlace: { x: 395, y: 640, width: 80, height: 15, fontSize: 7, multiline: true },
  
  // ========================================
  // БЛОК 21 - Транспортное средство на границе
  // ========================================
  borderTransportNumber: { x: 85, y: 590, width: 250, height: 20, fontSize: 8, font: 'courier' },
  
  // ========================================
  // БЛОК 22 - Валюта и общая фактурная стоимость
  // ========================================
  currency: { x: 350, y: 615, width: 35, height: 20, fontSize: 10, font: 'courier' },
  totalInvoiceAmount: { x: 390, y: 615, width: 110, height: 20, fontSize: 10, align: 'right', font: 'courier' },
  
  // ========================================
  // БЛОК 23 - Курс валюты
  // ========================================
  exchangeRate: { x: 510, y: 590, width: 60, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // ========================================
  // БЛОК 24 - Характер сделки
  // ========================================
  transactionNature: { x: 510, y: 615, width: 30, height: 20, fontSize: 9, align: 'center', font: 'courier' },
  transactionCurrencyCode: { x: 540, y: 615, width: 30, height: 20, fontSize: 9, align: 'center', font: 'courier' },
  
  // ========================================
  // БЛОКИ 25-28 (транспорт и банк)
  // ========================================
  borderTransportMode: { x: 85, y: 565, width: 40, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  inlandTransportMode: { x: 130, y: 565, width: 40, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  loadingPlace: { x: 175, y: 565, width: 160, height: 15, fontSize: 7, multiline: true },
  bankDetails: { x: 350, y: 565, width: 220, height: 30, fontSize: 7, multiline: true, maxLines: 3 },
  
  // ========================================
  // БЛОКИ 29-30 (таможня и местонахождение)
  // ========================================
  entryCustomsOffice: { x: 85, y: 540, width: 250, height: 15, fontSize: 8 },
  goodsLocation: { x: 350, y: 540, width: 220, height: 15, fontSize: 7 },
  
  // ========================================
  // ТОВАРНАЯ ПОЗИЦИЯ (блоки 31-46)
  // ========================================
  
  // Блок 31 - Грузовые места и описание товара
  goodsDescription: { x: 85, y: 495, width: 460, height: 110, fontSize: 8, multiline: true, maxLines: 10 },
  marksNumbers: { x: 45, y: 468, width: 290, height: 12, fontSize: 7, multiline: true },
  packageType: { x: 85, y: 455, width: 100, height: 12, fontSize: 7 },
  packageQuantity: { x: 190, y: 455, width: 50, height: 12, fontSize: 8, align: 'center', font: 'courier' },
  
  // Блок 32 - Товар №
  itemNumber: { x: 355, y: 520, width: 35, height: 25, fontSize: 14, align: 'center', font: 'courier' },
  
  // Блок 33 - Код товара (ТН ВЭД)
  hsCode: { x: 355, y: 590, width: 160, height: 15, fontSize: 10, font: 'courier' },
  
  // Блок 34 - Код страны происхождения
  itemOriginCountryCode: { x: 355, y: 575, width: 50, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  
  // Блок 35 - Вес брутто (кг)
  grossWeight: { x: 520, y: 575, width: 55, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 36 - Преференция
  preferenceCode: { x: 520, y: 560, width: 55, height: 12, fontSize: 8 },
  
  // Блок 37 - Процедура
  procedureCode: { x: 355, y: 555, width: 30, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  previousProcedureCode: { x: 390, y: 555, width: 30, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  movementCode: { x: 425, y: 555, width: 50, height: 15, fontSize: 8 },
  
  // Блок 38 - Вес нетто (кг)
  netWeight: { x: 520, y: 555, width: 55, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 39 - Квота
  quotaNumber: { x: 520, y: 540, width: 55, height: 12, fontSize: 8 },
  
  // Блок 40 - Общая декларация/предшествующий документ
  previousDocument: { x: 355, y: 525, width: 220, height: 15, fontSize: 7 },
  
  // Блок 41 - Дополнительные единицы измерения
  supplementaryQuantity: { x: 355, y: 505, width: 60, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  supplementaryUnit: { x: 420, y: 505, width: 40, height: 15, fontSize: 8 },
  
  // Блок 42 - Фактурная стоимость товара
  itemPrice: { x: 465, y: 505, width: 80, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 43 - Метод определения таможенной стоимости
  valuationMethodCode: { x: 555, y: 505, width: 20, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  
  // Блок 44 - Дополнительная информация/представленные документы
  additionalInfo: { x: 85, y: 385, width: 460, height: 80, fontSize: 7, multiline: true, maxLines: 8 },
  
  // Блок 45 - Таможенная стоимость
  customsValue: { x: 355, y: 380, width: 100, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 46 - Статистическая стоимость
  statisticalValue: { x: 465, y: 380, width: 100, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // ========================================
  // БЛОК 47 - Исчисление таможенных платежей
  // Таблица начинается с y=345
  // Колонки X: Вид: 85, Основа: 125, Ставка: 210, Сумма: 280, СП: 485
  // ========================================
  // Пошлина (строка 1)
  dutyType: { x: 85, y: 345, width: 35, height: 12, fontSize: 7 },
  dutyBase: { x: 125, y: 345, width: 80, height: 12, fontSize: 7, align: 'right', font: 'courier' },
  dutyRate: { x: 210, y: 345, width: 65, height: 12, fontSize: 7, align: 'center' },
  dutyAmount: { x: 280, y: 345, width: 80, height: 12, fontSize: 8, align: 'right', font: 'courier' },
  dutyPaymentMethod: { x: 485, y: 345, width: 25, height: 12, fontSize: 7, align: 'center' },
  
  // НДС (строка 2)
  vatType: { x: 85, y: 330, width: 35, height: 12, fontSize: 7 },
  vatBase: { x: 125, y: 330, width: 80, height: 12, fontSize: 7, align: 'right', font: 'courier' },
  vatRate: { x: 210, y: 330, width: 65, height: 12, fontSize: 7, align: 'center' },
  vatAmount: { x: 280, y: 330, width: 80, height: 12, fontSize: 8, align: 'right', font: 'courier' },
  vatPaymentMethod: { x: 485, y: 330, width: 25, height: 12, fontSize: 7, align: 'center' },
  
  // Сбор (строка 3)
  feeType: { x: 85, y: 315, width: 35, height: 12, fontSize: 7 },
  feeBase: { x: 125, y: 315, width: 80, height: 12, fontSize: 7, align: 'right', font: 'courier' },
  feeRate: { x: 210, y: 315, width: 65, height: 12, fontSize: 7, align: 'center' },
  feeAmount: { x: 280, y: 315, width: 80, height: 12, fontSize: 8, align: 'right', font: 'courier' },
  feePaymentMethod: { x: 485, y: 315, width: 25, height: 12, fontSize: 7, align: 'center' },
  
  // Итого
  totalPayment: { x: 280, y: 295, width: 80, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 48 - Отсрочка платежей
  deferredPayment: { x: 365, y: 345, width: 115, height: 40, fontSize: 7, multiline: true },
  
  // Блок 49 - Наименование склада
  warehouseName: { x: 520, y: 345, width: 55, height: 40, fontSize: 6, multiline: true },
  
  // ========================================
  // БЛОКИ B, C, D, 50-54 (нижняя часть)
  // ========================================
  // Блок B - Подробности подсчёта
  calculationDetails: { x: 85, y: 260, width: 280, height: 30, fontSize: 6, multiline: true },
  
  // Блок 50 - Доверитель
  principalName: { x: 85, y: 220, width: 280, height: 35, fontSize: 7, multiline: true },
  principalPosition: { x: 85, y: 190, width: 150, height: 12, fontSize: 7 },
  
  // Блок 51 - Таможня страны транзита
  transitCustomsOffice: { x: 85, y: 160, width: 280, height: 25, fontSize: 7, multiline: true },
  
  // Блок 52 - Гарантия недействительна для
  guaranteeInvalid: { x: 85, y: 120, width: 280, height: 35, fontSize: 7, multiline: true },
  
  // Блок C
  blockC: { x: 380, y: 220, width: 100, height: 60, fontSize: 6, multiline: true },
  
  // Блок 53 - Таможня и страна назначения
  exitCustomsOffice: { x: 380, y: 120, width: 190, height: 35, fontSize: 7, multiline: true },
  
  // Блок D - Таможенный контроль
  customsControl: { x: 85, y: 80, width: 280, height: 30, fontSize: 6, multiline: true },
  
  // Блок 54 - Место и дата
  declarationPlace: { x: 480, y: 100, width: 90, height: 15, fontSize: 8 },
  declarationDateField: { x: 480, y: 85, width: 90, height: 12, fontSize: 8 },
  signatoryName: { x: 480, y: 70, width: 90, height: 12, fontSize: 7 },
  signatoryPhone: { x: 480, y: 55, width: 90, height: 12, fontSize: 6 },
};

/**
 * Координаты полей для ТД2 (Добавочный лист)
 * На одном листе размещается до 3 товарных позиций
 * Смещение Y между товарами: 218 pts
 */
export const TD2_COORDINATES: GTDCoordinates = {
  // Заголовок
  exporterNameShort: { x: 85, y: 810, width: 150, height: 15, fontSize: 7 },
  consigneeNameShort: { x: 250, y: 810, width: 150, height: 15, fontSize: 7 },
  declarationNumberTD2: { x: 450, y: 810, width: 120, height: 15, fontSize: 8, font: 'courier' },
  additionalSheetsNumber: { x: 85, y: 790, width: 30, height: 15, fontSize: 9, align: 'center' },
};

/**
 * Координаты для одной товарной позиции на ТД2
 * Базовые значения для первого товара (item_index = 0)
 */
export const TD2_ITEM_COORDINATES: GTDCoordinates = {
  // Блок 31 - Описание товара
  goodsDescription: { x: 85, y: 760, width: 250, height: 100, fontSize: 7, multiline: true, maxLines: 10 },
  marksNumbers: { x: 45, y: 660, width: 290, height: 12, fontSize: 6 },
  
  // Блок 32 - Товар №
  itemNumber: { x: 355, y: 760, width: 35, height: 25, fontSize: 14, align: 'center', font: 'courier' },
  
  // Блок 33 - Код товара
  hsCode: { x: 400, y: 760, width: 160, height: 15, fontSize: 10, font: 'courier' },
  
  // Блок 34 - Код страны происхождения
  originCountryCode: { x: 355, y: 735, width: 50, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  
  // Блок 35 - Вес брутто
  grossWeight: { x: 420, y: 735, width: 55, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 36 - Преференция
  preferenceCode: { x: 520, y: 735, width: 55, height: 12, fontSize: 8 },
  
  // Блок 37 - Процедура
  procedureCode: { x: 355, y: 715, width: 30, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  previousProcedureCode: { x: 390, y: 715, width: 30, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  
  // Блок 38 - Вес нетто
  netWeight: { x: 420, y: 715, width: 55, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 39 - Квота
  quotaNumber: { x: 520, y: 715, width: 55, height: 12, fontSize: 8 },
  
  // Блок 40 - Предшествующий документ
  previousDocument: { x: 355, y: 695, width: 220, height: 15, fontSize: 7 },
  
  // Блок 41 - Доп. единицы
  supplementaryQuantity: { x: 355, y: 675, width: 60, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  supplementaryUnit: { x: 420, y: 675, width: 40, height: 15, fontSize: 8 },
  
  // Блок 42 - Фактурная стоимость
  itemPrice: { x: 465, y: 675, width: 80, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 43 - Метод оценки
  valuationMethodCode: { x: 555, y: 675, width: 20, height: 15, fontSize: 9, align: 'center', font: 'courier' },
  
  // Блок 44 - Дополнительная информация
  additionalInfo: { x: 85, y: 650, width: 250, height: 60, fontSize: 6, multiline: true, maxLines: 6 },
  
  // Блок 45 - Таможенная стоимость
  customsValue: { x: 355, y: 630, width: 100, height: 15, fontSize: 9, align: 'right', font: 'courier' },
  
  // Блок 46 - Статистическая стоимость
  statisticalValue: { x: 465, y: 630, width: 100, height: 15, fontSize: 9, align: 'right', font: 'courier' },
};

/**
 * Вертикальное смещение между товарными позициями на ТД2
 */
export const TD2_ITEM_Y_OFFSET = 218;

/**
 * Вспомогательная функция для получения координат товара на ТД2
 */
export function getItemCoordinatesForTD2(itemIndex: number): GTDCoordinates {
  const yOffset = itemIndex * TD2_ITEM_Y_OFFSET;
  const result: GTDCoordinates = {};
  
  for (const [key, coords] of Object.entries(TD2_ITEM_COORDINATES)) {
    result[key] = {
      ...coords,
      y: coords.y - yOffset,
    };
  }
  
  return result;
}

/**
 * Координаты блока 47 (платежи) для товара на ТД2
 */
export function getPaymentCoordinatesForTD2(itemIndex: number, isLeftColumn: boolean): GTDCoordinates {
  const baseY = 600 - (itemIndex * TD2_ITEM_Y_OFFSET);
  const baseX = isLeftColumn ? 85 : 350;
  
  return {
    dutyType: { x: baseX, y: baseY, width: 30, height: 12, fontSize: 6 },
    dutyBase: { x: baseX + 35, y: baseY, width: 60, height: 12, fontSize: 6, align: 'right', font: 'courier' },
    dutyRate: { x: baseX + 100, y: baseY, width: 40, height: 12, fontSize: 6, align: 'center' },
    dutyAmount: { x: baseX + 145, y: baseY, width: 60, height: 12, fontSize: 7, align: 'right', font: 'courier' },
    dutyPaymentMethod: { x: baseX + 210, y: baseY, width: 20, height: 12, fontSize: 6, align: 'center' },
    
    vatType: { x: baseX, y: baseY - 15, width: 30, height: 12, fontSize: 6 },
    vatBase: { x: baseX + 35, y: baseY - 15, width: 60, height: 12, fontSize: 6, align: 'right', font: 'courier' },
    vatRate: { x: baseX + 100, y: baseY - 15, width: 40, height: 12, fontSize: 6, align: 'center' },
    vatAmount: { x: baseX + 145, y: baseY - 15, width: 60, height: 12, fontSize: 7, align: 'right', font: 'courier' },
    vatPaymentMethod: { x: baseX + 210, y: baseY - 15, width: 20, height: 12, fontSize: 6, align: 'center' },
    
    totalPayment: { x: baseX + 100, y: baseY - 35, width: 105, height: 12, fontSize: 8, align: 'right', font: 'courier' },
  };
}

/**
 * Лейблы полей для отладки
 */
export const FIELD_LABELS: Record<string, string> = {
  declarationType: '1. Type',
  exporterName: '2. Exporter',
  additionalSheets: '3. Add. sheets',
  loadingSpecs: '4. Load. specs',
  totalItems: '5. Total items',
  totalPackages: '6. Packages',
  declarationNumber: '7. GTD No.',
  consigneeName: '8. Consignee',
  financialResponsibleName: '9. Financial resp.',
  firstDestinationCountry: '10. First dest.',
  tradingCountry: '11. Trading country',
  totalCustomsValue: '12. Customs value',
  declarantName: '14. Declarant',
  dispatchCountry: '15. Dispatch country',
  originCountry: '16. Origin country',
  destinationCountry: '17. Dest. country',
  departureTransportType: '18. Transport',
  containerIndicator: '19. Container',
  incotermsCode: '20. Incoterms',
  borderTransportNumber: '21. Border transp.',
  currency: '22. Currency',
  exchangeRate: '23. Exch. rate',
  transactionNature: '24. Transaction',
  borderTransportMode: '25. Border mode',
  inlandTransportMode: '26. Inland mode',
  loadingPlace: '27. Loading place',
  bankDetails: '28. Bank details',
  entryCustomsOffice: '29. Entry customs',
  goodsLocation: '30. Goods location',
  goodsDescription: '31. Description',
  itemNumber: '32. Item No.',
  hsCode: '33. HS Code',
  itemOriginCountryCode: '34. Origin code',
  grossWeight: '35. Gross weight',
  preferenceCode: '36. Preference',
  procedureCode: '37. Procedure',
  netWeight: '38. Net weight',
  quotaNumber: '39. Quota',
  previousDocument: '40. Prev. doc.',
  supplementaryQuantity: '41. Suppl. qty',
  itemPrice: '42. Invoice value',
  valuationMethodCode: '43. Method',
  additionalInfo: '44. Add. info',
  customsValue: '45. Customs value',
  statisticalValue: '46. Stat. value',
  dutyAmount: '47. Duty',
  vatAmount: '47. VAT',
  totalPayment: '47. Total',
};
