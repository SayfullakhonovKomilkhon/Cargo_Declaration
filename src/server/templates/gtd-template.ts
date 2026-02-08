import type { Declaration, DeclarationItem } from '@prisma/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface GTDTemplateData {
  declaration: Declaration;
  items: DeclarationItem[];
  organization?: {
    name: string;
    inn: string;
    address?: string | null;
  } | null;
}

// Форматирование даты
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
};

// Форматирование числа с разделителями
const formatNumber = (num: number | null | undefined | unknown): string => {
  if (num === null || num === undefined) return '';
  const value = typeof num === 'object' ? Number(num) : Number(num);
  if (isNaN(value)) return '';
  return Math.round(value).toLocaleString('ru-RU');
};

// Форматирование курса валюты (с десятичными знаками)
const formatExchangeRate = (num: number | null | undefined | unknown): string => {
  if (num === null || num === undefined) return '';
  const value = typeof num === 'object' ? Number(num) : Number(num);
  if (isNaN(value)) return '';
  // Курс валюты показываем с 2 десятичными знаками
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

// Форматирование веса
const formatWeight = (num: number | null | undefined | unknown): string => {
  if (num === null || num === undefined) return '';
  const value = typeof num === 'object' ? Number(num) : Number(num);
  return isNaN(value) ? '' : value.toString();
};

// Тип декларации
const getDeclarationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    IMPORT: 'ИМ',
    EXPORT: 'ЭК',
    TRANSIT: 'ТР',
  };
  return labels[type] || 'ИМ';
};

// Код режима
const getRegimeCode = (type: string): string => {
  const codes: Record<string, string> = {
    IMPORT: '40',
    EXPORT: '12',
    TRANSIT: '80',
  };
  return codes[type] || '40';
};

// Справочник стран
const COUNTRIES: Record<string, string> = {
  'UZ': 'УЗБЕКИСТАН', 'CN': 'КИТАЙ', 'RU': 'РОССИЯ', 'KZ': 'КАЗАХСТАН',
  'KR': 'КОРЕЯ', 'DE': 'ГЕРМАНИЯ', 'US': 'США', 'TR': 'ТУРЦИЯ',
  'KG': 'КЫРГЫЗСТАН', 'TJ': 'ТАДЖИКИСТАН', 'BY': 'БЕЛАРУСЬ',
};

const getCountryName = (code: string | null | undefined): string => {
  if (!code) return '';
  return COUNTRIES[code.toUpperCase()] || code;
};

// CSS стили - точные координаты в мм для формы ГТД
const getStyles = (): string => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page { 
    size: A4; 
    margin: 0; 
  }
  
  html {
    overflow-x: hidden;
    overflow-y: auto;
  }
  
  body {
    font-family: Arial, sans-serif;
    font-size: 8pt;
    line-height: 1.2;
    background: #f5f5f5;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  /* Страница A4 с абсолютным позиционированием */
  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    background: white;
    page-break-after: always;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    flex-shrink: 0;
  }
  
  .page:last-child { page-break-after: auto; }
  
  @media print {
    html, body { background: white !important; padding: 0 !important; }
    body { display: block; }
    .page { box-shadow: none !important; margin: 0 !important; }
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact;
  }
  
  /* Базовая ячейка с абсолютным позиционированием */
  .cell {
    position: absolute;
    border: 0.2mm solid black;
    padding: 1mm;
    overflow: hidden;
    background: white;
  }
  
  /* Ячейка без рамки */
  .cell.nb { border: none; }
  
  /* Номер графы в левом верхнем углу */
  .cell-num {
    font-size: 5pt;
    font-weight: bold;
    display: inline-block;
    padding-right: 0.5mm;
    margin-right: 0.5mm;
    border-right: 0.15mm solid black;
    vertical-align: top;
    line-height: 1;
  }
  
  /* Название графы */
  .cell-label {
    font-size: 4pt;
    color: #333;
    line-height: 1;
  }
  
  /* Значение в ячейке */
  .cell-value {
    font-size: 7pt;
    margin-top: 0.5mm;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.1;
  }
  
  .cell-value.sm { font-size: 5pt; }
  .cell-value.xs { font-size: 4pt; }
  .cell-value.lg { font-size: 9pt; font-weight: bold; }
  .cell-value.b { font-weight: bold; }
  .cell-value.c { text-align: center; }
  .cell-value.r { text-align: right; }
  .cell-value.nowrap { white-space: nowrap; }
  
  /* Заголовок ГТД */
  .header-title {
    font-weight: bold;
    font-size: 9pt;
    line-height: 1.1;
  }
  
  /* ED */
  .ed-text {
    font-weight: bold;
    font-size: 16pt;
    text-align: center;
  }
  
  /* Блок 47 таблица */
  .t47 {
    width: 100%;
    border-collapse: collapse;
    font-size: 6pt;
  }
  
  .t47 td, .t47 th {
    border: 0.2mm solid black;
    padding: 0.5mm;
    text-align: center;
  }
  
  .t47 th { font-weight: bold; font-size: 5pt; }
  .t47 .r { text-align: right; }
`;

/**
 * Генерация ТД1 - основной лист с точными координатами в мм
 */
function generateTD1(data: GTDTemplateData): string {
  const { declaration, items, organization } = data;
  const item = items[0]; // Первый товар
  
  // Итоги
  const totalDuty = items.reduce((s, i) => s + (Number(i.dutyAmount) || 0), 0);
  const totalVat = items.reduce((s, i) => s + (Number(i.vatAmount) || 0), 0);
  const totalFee = items.reduce((s, i) => s + (Number(i.feeAmount) || 0), 0);
  const grandTotal = totalDuty + totalVat + totalFee;
  const addSheets = items.length > 1 ? Math.ceil((items.length - 1) / 3) : 0;
  
  // Регистрационный номер
  const regNumber = declaration.declarationNumber || '';
  const regDate = formatDate(declaration.declarationDate || declaration.createdAt);

  return `
<div class="page">
  <!-- ЗАГОЛОВОК: X=5, Y=5, W=80, H=12 -->
  <div class="cell" style="left:5mm; top:5mm; width:80mm; height:12mm; border-width:0.5mm;">
    <div class="header-title">ГРУЗОВАЯ ТАМОЖЕННАЯ<br>ДЕКЛАРАЦИЯ</div>
  </div>
  
  <!-- ED: X=86, Y=5, W=14, H=12 (без рамки) -->
  <div class="cell nb" style="left:86mm; top:5mm; width:14mm; height:12mm;">
    <div class="ed-text">ED</div>
  </div>
  
  <!-- БЛОК 1: Тип декларации X=100, Y=5, W=35, H=12 -->
  <div class="cell" style="left:100mm; top:5mm; width:35mm; height:12mm;">
    <span class="cell-num">1.</span><span class="cell-label">Тип декларации</span>
    <div class="cell-value lg c">${getDeclarationTypeLabel(declaration.type)} | ${getRegimeCode(declaration.type)} |</div>
  </div>
  
  <!-- БЛОК 2: Экспортер X=5, Y=17, W=95, H=23 -->
  <div class="cell" style="left:5mm; top:17mm; width:95mm; height:23mm;">
    <span class="cell-num">2.</span><span class="cell-label">Экспортер/Грузоотправитель</span>
    <div class="cell-value xs">${declaration.exporterName || ''}</div>
    <div class="cell-value xs">${declaration.exporterAddress || ''}</div>
    <div class="cell-value xs">${declaration.exporterCountryCode ? getCountryName(declaration.exporterCountryCode) : ''} ИНН: ${declaration.exporterInn || ''}</div>
  </div>
  
  <!-- БЛОК 3: Доб.лист X=100, Y=17, W=17, H=11 -->
  <div class="cell" style="left:100mm; top:17mm; width:17mm; height:11mm;">
    <span class="cell-num">3</span><span class="cell-label">Доб.лист</span>
    <div class="cell-value lg c">${addSheets}</div>
  </div>
  
  <!-- БЛОК 4: Отгр.спец. X=117, Y=17, W=18, H=11 -->
  <div class="cell" style="left:117mm; top:17mm; width:18mm; height:11mm;">
    <span class="cell-num">4</span><span class="cell-label">Отгр.спец.</span>
    <div class="cell-value c"></div>
  </div>
  
  <!-- БЛОК 5: Всего наим.товаров X=100, Y=28, W=17, H=12 -->
  <div class="cell" style="left:100mm; top:28mm; width:17mm; height:12mm;">
    <span class="cell-num">5.</span><span class="cell-label">Всего наим.<br>товаров</span>
    <div class="cell-value lg c">${declaration.totalItems || items.length}</div>
  </div>
  
  <!-- БЛОК 6: Кол-во мест X=117, Y=28, W=18, H=12 -->
  <div class="cell" style="left:117mm; top:28mm; width:18mm; height:12mm;">
    <span class="cell-num">6.</span><span class="cell-label">Кол-во мест</span>
    <div class="cell-value lg c">${declaration.totalPackages || ''}</div>
  </div>
  
  <!-- БЛОК 7: Регистр.номер ГТД X=135, Y=5, W=70, H=35 -->
  <div class="cell" style="left:135mm; top:5mm; width:70mm; height:35mm;">
    <span class="cell-num">7.</span><span class="cell-label">Регистр. номер ГТД</span>
    <div class="cell-value">${regNumber}</div>
  </div>
  
  <!-- БЛОК 8: Импортер X=5, Y=40, W=95, H=20 -->
  <div class="cell" style="left:5mm; top:40mm; width:95mm; height:20mm;">
    <span class="cell-num">8.</span><span class="cell-label">Импортер/грузополучатель</span>
    <div class="cell-value xs">${declaration.consigneeName || ''}</div>
    <div class="cell-value xs">${declaration.consigneeAddress || ''}</div>
    <div class="cell-value xs">${declaration.consigneeCountryCode ? getCountryName(declaration.consigneeCountryCode) : 'УЗБЕКИСТАН'} ИНН: ${declaration.consigneeInn || ''}</div>
  </div>
  
  <!-- БЛОК 9: Лицо отв. за фин. X=100, Y=40, W=105, H=20 -->
  <div class="cell" style="left:100mm; top:40mm; width:105mm; height:20mm;">
    <span class="cell-num">9</span><span class="cell-label">Лицо отв. за фин. урегулир-е</span>
    <div class="cell-value xs">${declaration.financialResponsible || declaration.consigneeName || ''}</div>
  </div>
  
  <!-- БЛОК 10: Стр.1-го наз. X=5, Y=60, W=22, H=10 -->
  <div class="cell" style="left:5mm; top:60mm; width:22mm; height:10mm;">
    <span class="cell-num">10.</span><span class="cell-label">Стр.1-го наз.</span>
    <div class="cell-value c">${declaration.destinationCountryCode || 'UZ'}</div>
  </div>
  
  <!-- БЛОК 11: Торг.страна X=27, Y=60, W=22, H=10 -->
  <div class="cell" style="left:27mm; top:60mm; width:22mm; height:10mm;">
    <span class="cell-num">11.</span><span class="cell-label">Торг.страна</span>
    <div class="cell-value c">${declaration.tradingCountryCode || declaration.departureCountryCode || ''}</div>
  </div>
  
  <!-- БЛОК 12: Общ.там.стоим. X=49, Y=60, W=46, H=10 -->
  <div class="cell" style="left:49mm; top:60mm; width:46mm; height:10mm;">
    <span class="cell-num">12.</span><span class="cell-label">Общ.там.стоим.</span>
    <div class="cell-value b">${formatNumber(declaration.totalCustomsValue)}</div>
  </div>
  
  <!-- БЛОК 13: Индикатор оффшора X=95, Y=60, W=110, H=10 -->
  <div class="cell" style="left:95mm; top:60mm; width:110mm; height:10mm;">
    <span class="cell-num">13.</span>
    <div class="cell-value c">${declaration.offshoreIndicator || '2'}</div>
  </div>
  
  <!-- БЛОК 14: Декларант X=5, Y=70, W=90, H=18 -->
  <div class="cell" style="left:5mm; top:70mm; width:90mm; height:18mm;">
    <span class="cell-num">14.</span><span class="cell-label">Декларант/таможенный брокер</span>
    <div class="cell-value xs">${declaration.declarantName || organization?.name || ''}</div>
    <div class="cell-value xs">${declaration.declarantAddress || organization?.address || ''}</div>
    <div class="cell-value xs">ИНН: ${declaration.declarantInn || organization?.inn || ''}</div>
  </div>
  
  <!-- БЛОК 15: Страна отп. X=95, Y=70, W=35, H=9 -->
  <div class="cell" style="left:95mm; top:70mm; width:35mm; height:9mm;">
    <span class="cell-num">15.</span><span class="cell-label">Страна отп.</span>
    <div class="cell-value c">${getCountryName(declaration.departureCountryCode)}</div>
  </div>
  
  <!-- БЛОК 15а: Код стр.отп. X=130, Y=70, W=25, H=9 -->
  <div class="cell" style="left:130mm; top:70mm; width:25mm; height:9mm;">
    <span class="cell-num">15а.</span><span class="cell-label">Код стр.отп.</span>
    <div class="cell-value c b">${declaration.departureCountryCode || ''}</div>
  </div>
  
  <!-- БЛОК 17а: Код стр.назн. X=155, Y=70, W=50, H=9 -->
  <div class="cell" style="left:155mm; top:70mm; width:50mm; height:9mm;">
    <span class="cell-num">17а.</span><span class="cell-label">Код стр.назн.</span>
    <div class="cell-value c b">${declaration.destinationCountryCode || 'UZ'}</div>
  </div>
  
  <!-- БЛОК 16: Страна происх. X=95, Y=79, W=35, H=9 -->
  <div class="cell" style="left:95mm; top:79mm; width:35mm; height:9mm;">
    <span class="cell-num">16.</span><span class="cell-label">Страна происх.</span>
    <div class="cell-value c">${getCountryName(declaration.originCountryCode || item?.originCountryCode)}</div>
  </div>
  
  <!-- БЛОК 17: Страна назн. X=130, Y=79, W=75, H=9 -->
  <div class="cell" style="left:130mm; top:79mm; width:75mm; height:9mm;">
    <span class="cell-num">17.</span><span class="cell-label">Страна назначения</span>
    <div class="cell-value c">${getCountryName(declaration.destinationCountryCode) || 'УЗБЕКИСТАН'}</div>
  </div>
  
  <!-- БЛОК 18: Транспорт при отпр. X=5, Y=88, W=65, H=12 -->
  <div class="cell" style="left:5mm; top:88mm; width:65mm; height:12mm;">
    <span class="cell-num">18.</span><span class="cell-label">Транспорт при отпр./прибытии</span>
    <div class="cell-value sm">${declaration.departureTransportMode || ''} ${declaration.departureTransportNumber || ''}</div>
  </div>
  
  <!-- БЛОК 19: Контейнер X=70, Y=88, W=15, H=12 -->
  <div class="cell" style="left:70mm; top:88mm; width:15mm; height:12mm;">
    <span class="cell-num">19.</span><span class="cell-label">Конт.</span>
    <div class="cell-value lg c">${declaration.containerIndicator || '0'}</div>
  </div>
  
  <!-- БЛОК 20: Условия поставки X=85, Y=88, W=55, H=12 -->
  <div class="cell" style="left:85mm; top:88mm; width:55mm; height:12mm;">
    <span class="cell-num">20.</span><span class="cell-label">Условия поставки</span>
    <div class="cell-value">${declaration.deliveryTermsCode || ''} ${declaration.deliveryTermsPlace || ''}</div>
  </div>
  
  <!-- БЛОК 21: Транспорт на границе X=140, Y=88, W=65, H=12 -->
  <div class="cell" style="left:140mm; top:88mm; width:65mm; height:12mm;">
    <span class="cell-num">21.</span><span class="cell-label">Транспорт на границе</span>
    <div class="cell-value">${declaration.borderTransportNumber || ''}</div>
  </div>
  
  <!-- БЛОК 22: Валюта и стоимость X=5, Y=100, W=50, H=10 -->
  <div class="cell" style="left:5mm; top:100mm; width:50mm; height:10mm;">
    <span class="cell-num">22.</span><span class="cell-label">Вал. и общ.факт.стоим.</span>
    <div class="cell-value b">${declaration.invoiceCurrencyCode || 'USD'} ${formatNumber(declaration.totalInvoiceAmount)}</div>
  </div>
  
  <!-- БЛОК 23: Курс валюты X=55, Y=100, W=30, H=10 -->
  <div class="cell" style="left:55mm; top:100mm; width:30mm; height:10mm;">
    <span class="cell-num">23.</span><span class="cell-label">Курс вал.</span>
    <div class="cell-value">1 / ${formatExchangeRate(declaration.exchangeRate)}</div>
  </div>
  
  <!-- БЛОК 24: Хар-р сделки X=85, Y=100, W=55, H=10 -->
  <div class="cell" style="left:85mm; top:100mm; width:55mm; height:10mm;">
    <span class="cell-num">24.</span><span class="cell-label">Хар-р сделки</span>
    <div class="cell-value c">${declaration.transactionNatureCode || ''} ${declaration.transactionCurrencyCode || ''}</div>
  </div>
  
  <!-- БЛОК 25: Вид транс на границе X=140, Y=100, W=32, H=10 -->
  <div class="cell" style="left:140mm; top:100mm; width:32mm; height:10mm;">
    <span class="cell-num">25.</span><span class="cell-label">Вид тр.на гр.</span>
    <div class="cell-value c">${declaration.borderTransportModeCode || ''}</div>
  </div>
  
  <!-- БЛОК 26: Вид транс внутр X=172, Y=100, W=33, H=10 -->
  <div class="cell" style="left:172mm; top:100mm; width:33mm; height:10mm;">
    <span class="cell-num">26.</span><span class="cell-label">Вид тр.внутр.</span>
    <div class="cell-value c">${declaration.inlandTransportModeCode || ''}</div>
  </div>
  
  <!-- БЛОК 27: Место погрузки X=5, Y=110, W=55, H=10 -->
  <div class="cell" style="left:5mm; top:110mm; width:55mm; height:10mm;">
    <span class="cell-num">27.</span><span class="cell-label">Место погр./разгр.</span>
    <div class="cell-value sm">${declaration.loadingPlace || ''}</div>
  </div>
  
  <!-- БЛОК 28: Фин.банк.сведения X=60, Y=110, W=80, H=10 -->
  <div class="cell" style="left:60mm; top:110mm; width:80mm; height:10mm;">
    <span class="cell-num">28.</span><span class="cell-label">Фин. и банк. сведения</span>
    <div class="cell-value sm">${declaration.declarantInn || ''}</div>
  </div>
  
  <!-- БЛОК 29: Таможня на границе X=140, Y=110, W=32, H=10 -->
  <div class="cell" style="left:140mm; top:110mm; width:32mm; height:10mm;">
    <span class="cell-num">29.</span><span class="cell-label">Там.на гр.</span>
    <div class="cell-value sm">${declaration.entryCustomsOffice || ''}</div>
  </div>
  
  <!-- БЛОК 30: Местонахождение товаров X=172, Y=110, W=33, H=10 -->
  <div class="cell" style="left:172mm; top:110mm; width:33mm; height:10mm;">
    <span class="cell-num">30.</span><span class="cell-label">Местонах.тов.</span>
    <div class="cell-value sm">${declaration.goodsLocation || ''}</div>
  </div>
  
  <!-- БЛОК 31: Описание товара X=5, Y=120, W=100, H=45 -->
  <div class="cell" style="left:5mm; top:120mm; width:100mm; height:45mm;">
    <span class="cell-num">31.</span><span class="cell-label">Грузовые места и описание товаров</span>
    <div class="cell-value xs" style="margin-top:1mm; max-height:38mm; overflow:hidden;">${item?.goodsDescription || ''}</div>
    <div class="cell-value xs">${item?.marksAndNumbers || ''}</div>
  </div>
  
  <!-- БЛОК 32: Товар № X=105, Y=120, W=20, H=10 -->
  <div class="cell" style="left:105mm; top:120mm; width:20mm; height:10mm;">
    <span class="cell-num">32.</span><span class="cell-label">Товар №</span>
    <div class="cell-value lg c">1</div>
  </div>
  
  <!-- БЛОК 33: Код товара X=125, Y=120, W=80, H=10 -->
  <div class="cell" style="left:125mm; top:120mm; width:80mm; height:10mm;">
    <span class="cell-num">33.</span><span class="cell-label">Код товара</span>
    <div class="cell-value b">${item?.hsCode || ''}</div>
  </div>
  
  <!-- БЛОК 34: Код стр.происх. X=105, Y=130, W=20, H=10 -->
  <div class="cell" style="left:105mm; top:130mm; width:20mm; height:10mm;">
    <span class="cell-num">34.</span><span class="cell-label">Код стр.пр.</span>
    <div class="cell-value c">${item?.originCountryCode || ''}</div>
  </div>
  
  <!-- БЛОК 35: Вес брутто X=125, Y=130, W=40, H=10 -->
  <div class="cell" style="left:125mm; top:130mm; width:40mm; height:10mm;">
    <span class="cell-num">35.</span><span class="cell-label">Вес брутто (кг)</span>
    <div class="cell-value r">${formatWeight(item?.grossWeight)}</div>
  </div>
  
  <!-- БЛОК 36: Преференция X=165, Y=130, W=40, H=10 -->
  <div class="cell" style="left:165mm; top:130mm; width:40mm; height:10mm;">
    <span class="cell-num">36.</span><span class="cell-label">Преференция</span>
    <div class="cell-value c">${item?.preferenceCode || ''}</div>
  </div>
  
  <!-- БЛОК 37: Процедура X=105, Y=140, W=20, H=10 -->
  <div class="cell" style="left:105mm; top:140mm; width:20mm; height:10mm;">
    <span class="cell-num">37.</span><span class="cell-label">Процедура</span>
    <div class="cell-value c">${item?.procedureCode || ''}</div>
  </div>
  
  <!-- БЛОК 38: Вес нетто X=125, Y=140, W=40, H=10 -->
  <div class="cell" style="left:125mm; top:140mm; width:40mm; height:10mm;">
    <span class="cell-num">38.</span><span class="cell-label">Вес нетто (кг)</span>
    <div class="cell-value r">${formatWeight(item?.netWeight)}</div>
  </div>
  
  <!-- БЛОК 39: Квота X=165, Y=140, W=40, H=10 -->
  <div class="cell" style="left:165mm; top:140mm; width:40mm; height:10mm;">
    <span class="cell-num">39.</span><span class="cell-label">Квота</span>
    <div class="cell-value c">${item?.quotaNumber || ''}</div>
  </div>
  
  <!-- БЛОК 40: Предшеств.документ X=105, Y=150, W=100, H=10 -->
  <div class="cell" style="left:105mm; top:150mm; width:100mm; height:10mm;">
    <span class="cell-num">40.</span><span class="cell-label">Общая декл./предшеств.док.</span>
    <div class="cell-value sm">${item?.previousDocumentNumber || ''}</div>
  </div>
  
  <!-- БЛОК 41: Доп.ед. X=105, Y=160, W=25, H=5 -->
  <div class="cell" style="left:105mm; top:160mm; width:25mm; height:5mm;">
    <span class="cell-num">41.</span>
    <div class="cell-value c sm">${item?.supplementaryUnit || ''}</div>
  </div>
  
  <!-- БЛОК 42: Факт.стоимость X=130, Y=160, W=35, H=5 -->
  <div class="cell" style="left:130mm; top:160mm; width:35mm; height:5mm;">
    <span class="cell-num">42.</span><span class="cell-label">Факт.стоим.</span>
    <div class="cell-value r">${formatNumber(item?.itemPrice)}</div>
  </div>
  
  <!-- БЛОК 43: Метод X=165, Y=160, W=40, H=5 -->
  <div class="cell" style="left:165mm; top:160mm; width:40mm; height:5mm;">
    <span class="cell-num">43.</span>
    <div class="cell-value c">${item?.valuationMethodCode || '1'}</div>
  </div>
  
  <!-- БЛОК 44: Доп.информация X=5, Y=165, W=100, H=15 -->
  <div class="cell" style="left:5mm; top:165mm; width:100mm; height:15mm;">
    <span class="cell-num">44.</span><span class="cell-label">Доп. информация/представляемые документы</span>
    <div class="cell-value sm">${item?.additionalInfo || ''}</div>
  </div>
  
  <!-- БЛОК 45: Там.стоимость X=105, Y=165, W=50, H=8 -->
  <div class="cell" style="left:105mm; top:165mm; width:50mm; height:8mm;">
    <span class="cell-num">45.</span><span class="cell-label">Там.стоим.</span>
    <div class="cell-value b r">${formatNumber(item?.customsValue)}</div>
  </div>
  
  <!-- БЛОК 46: Стат.стоимость X=155, Y=165, W=50, H=8 -->
  <div class="cell" style="left:155mm; top:165mm; width:50mm; height:8mm;">
    <span class="cell-num">46.</span><span class="cell-label">Стат.стоим.</span>
    <div class="cell-value r">${formatNumber(item?.statisticalValue)}</div>
  </div>
  
  <!-- БЛОК 47: Исчисление пошлин X=5, Y=180, W=100, H=35 -->
  <div class="cell" style="left:5mm; top:180mm; width:100mm; height:35mm; padding:0;">
    <div style="padding:1mm;"><span class="cell-num">47.</span><span class="cell-label">Исчисление таможенных пошлин и сборов</span></div>
    <table class="t47">
      <tr><th>Вид</th><th>Осн.начисл.</th><th>Ставка</th><th>Сумма</th><th>СП</th></tr>
      <tr><td>10</td><td class="r">${formatNumber(declaration.totalCustomsValue)}</td><td>4 БРВ</td><td class="r">${formatNumber(totalFee || 1648000)}</td><td>БН</td></tr>
      ${totalDuty > 0 ? `<tr><td>20</td><td class="r">${formatNumber(declaration.totalCustomsValue)}</td><td>${item?.dutyRate || 0}%</td><td class="r">${formatNumber(totalDuty)}</td><td>БН</td></tr>` : ''}
      ${totalVat > 0 ? `<tr><td>29</td><td class="r">ТС+пошл.</td><td>12%</td><td class="r">${formatNumber(totalVat)}</td><td>БН</td></tr>` : ''}
      <tr><th colspan="3" class="r">Всего:</th><th class="r">${formatNumber(grandTotal || totalFee || 1648000)}</th><th></th></tr>
    </table>
  </div>
  
  <!-- БЛОК 48: Отсрочка платежей X=105, Y=173, W=50, H=7 -->
  <div class="cell" style="left:105mm; top:173mm; width:50mm; height:7mm;">
    <span class="cell-num">48.</span><span class="cell-label">Отсрочка платежей</span>
    <div class="cell-value c">${declaration.deferredPayment || ''}</div>
  </div>
  
  <!-- БЛОК 49: Наименование склада X=155, Y=173, W=50, H=7 -->
  <div class="cell" style="left:155mm; top:173mm; width:50mm; height:7mm;">
    <span class="cell-num">49.</span><span class="cell-label">Наим.склада</span>
    <div class="cell-value c">${declaration.warehouseId || ''}</div>
  </div>
  
  <!-- БЛОК B: Подробности подсчета X=105, Y=180, W=100, H=35 -->
  <div class="cell" style="left:105mm; top:180mm; width:100mm; height:35mm; padding:0;">
    <div style="padding:1mm;"><span class="cell-num">B.</span><span class="cell-label">Подробности подсчета</span></div>
    <table class="t47">
      <tr><td style="width:40%;">10</td><td class="r">${formatNumber(totalFee || 1648000)} сум.</td></tr>
      ${totalDuty > 0 ? `<tr><td>20</td><td class="r">${formatNumber(totalDuty)} сум.</td></tr>` : ''}
      ${totalVat > 0 ? `<tr><td>29</td><td class="r">${formatNumber(totalVat)} сум.</td></tr>` : ''}
      <tr><th class="r">Всего:</th><th class="r">${formatNumber(grandTotal || totalFee || 1648000)}</th></tr>
    </table>
  </div>
  
  <!-- БЛОК 50: Доверитель X=5, Y=215, W=75, H=20 -->
  <div class="cell" style="left:5mm; top:215mm; width:75mm; height:20mm;">
    <span class="cell-num">50.</span><span class="cell-label">Доверитель</span>
    <div class="cell-value sm">${declaration.principalName || ''}</div>
    <div class="cell-value sm">${declaration.principalAddress || ''}</div>
  </div>
  
  <!-- БЛОК C: X=80, Y=215, W=25, H=20 -->
  <div class="cell" style="left:80mm; top:215mm; width:25mm; height:20mm;">
    <span class="cell-num">C.</span>
    <div class="cell-value sm">1.</div>
    <div class="cell-value sm">2.</div>
  </div>
  
  <!-- БЛОК 54: Место и дата X=105, Y=215, W=100, H=20 -->
  <div class="cell" style="left:105mm; top:215mm; width:100mm; height:20mm;">
    <span class="cell-num">54.</span><span class="cell-label">Место и дата:</span>
    <div class="cell-value sm">1. ${declaration.declarationPlace || ''}</div>
    <div class="cell-value sm">2. ${declaration.authorizedRepName || ''}</div>
    <div class="cell-value sm">3. ${regDate}</div>
  </div>
  
  <!-- БЛОК D: Таможенный контроль X=5, Y=235, W=100, H=57 -->
  <div class="cell" style="left:5mm; top:235mm; width:100mm; height:57mm;">
    <span class="cell-num">D.</span><span class="cell-label">Таможенный контроль</span>
  </div>
  
  <!-- БЛОК A: X=105, Y=235, W=100, H=57 -->
  <div class="cell" style="left:105mm; top:235mm; width:100mm; height:57mm;">
    <span class="cell-num">A.</span>
  </div>
</div>
`;
}

/**
 * Генерация одного товара для ТД2 с абсолютным позиционированием
 */
function generateTD2Item(item: DeclarationItem, index: number, yOffset: number): string {
  // Высота блока одного товара - примерно 75mm
  const y = yOffset;
  
  return `
  <!-- ТОВАР ${item.itemNumber} -->
  <!-- БЛОК 31: Описание товара -->
  <div class="cell" style="left:5mm; top:${y}mm; width:100mm; height:50mm;">
    <span class="cell-num">31.</span><span class="cell-label">Грузовые места и описание товаров</span>
    <div class="cell-value" style="margin-top:2mm;">${item.goodsDescription || ''}</div>
  </div>
  
  <!-- БЛОК 32: Товар № -->
  <div class="cell" style="left:105mm; top:${y}mm; width:20mm; height:10mm;">
    <span class="cell-num">32.</span><span class="cell-label">Товар №</span>
    <div class="cell-value lg c">${item.itemNumber}</div>
  </div>
  
  <!-- БЛОК 33: Код товара -->
  <div class="cell" style="left:125mm; top:${y}mm; width:80mm; height:10mm;">
    <span class="cell-num">33.</span><span class="cell-label">Код товара</span>
    <div class="cell-value b">${item.hsCode || ''}</div>
  </div>
  
  <!-- БЛОК 34: Код стр.происх. -->
  <div class="cell" style="left:105mm; top:${y + 10}mm; width:20mm; height:10mm;">
    <span class="cell-num">34.</span><span class="cell-label">Код стр.пр.</span>
    <div class="cell-value c">${item.originCountryCode || ''}</div>
  </div>
  
  <!-- БЛОК 35: Вес брутто -->
  <div class="cell" style="left:125mm; top:${y + 10}mm; width:40mm; height:10mm;">
    <span class="cell-num">35.</span><span class="cell-label">Вес брутто</span>
    <div class="cell-value r">${formatWeight(item.grossWeight)}</div>
  </div>
  
  <!-- БЛОК 36: Преференция -->
  <div class="cell" style="left:165mm; top:${y + 10}mm; width:40mm; height:10mm;">
    <span class="cell-num">36.</span><span class="cell-label">Преференция</span>
    <div class="cell-value c">${item.preferenceCode || ''}</div>
  </div>
  
  <!-- БЛОК 37: Процедура -->
  <div class="cell" style="left:105mm; top:${y + 20}mm; width:20mm; height:10mm;">
    <span class="cell-num">37.</span><span class="cell-label">Процедура</span>
    <div class="cell-value c">${item.procedureCode || ''}</div>
  </div>
  
  <!-- БЛОК 38: Вес нетто -->
  <div class="cell" style="left:125mm; top:${y + 20}mm; width:40mm; height:10mm;">
    <span class="cell-num">38.</span><span class="cell-label">Вес нетто</span>
    <div class="cell-value r">${formatWeight(item.netWeight)}</div>
  </div>
  
  <!-- БЛОК 39: Квота -->
  <div class="cell" style="left:165mm; top:${y + 20}mm; width:40mm; height:10mm;">
    <span class="cell-num">39.</span><span class="cell-label">Квота</span>
    <div class="cell-value c">${item.quotaNumber || ''}</div>
  </div>
  
  <!-- БЛОК 41: Доп.ед. -->
  <div class="cell" style="left:105mm; top:${y + 30}mm; width:20mm; height:8mm;">
    <span class="cell-num">41.</span>
    <div class="cell-value c sm">${item.supplementaryUnit || ''}</div>
  </div>
  
  <!-- БЛОК 42: Факт.стоимость -->
  <div class="cell" style="left:125mm; top:${y + 30}mm; width:40mm; height:8mm;">
    <span class="cell-num">42.</span><span class="cell-label">Факт.стоим.</span>
    <div class="cell-value r">${formatNumber(item.itemPrice)}</div>
  </div>
  
  <!-- БЛОК 43: Метод -->
  <div class="cell" style="left:165mm; top:${y + 30}mm; width:40mm; height:8mm;">
    <span class="cell-num">43.</span>
    <div class="cell-value c">${item.valuationMethodCode || '1'}</div>
  </div>
  
  <!-- БЛОК 44: Доп.информация -->
  <div class="cell" style="left:5mm; top:${y + 50}mm; width:100mm; height:12mm;">
    <span class="cell-num">44.</span><span class="cell-label">Доп. информация</span>
    <div class="cell-value sm">${item.additionalInfo || ''}</div>
  </div>
  
  <!-- БЛОК 45: Там.стоимость -->
  <div class="cell" style="left:105mm; top:${y + 38}mm; width:50mm; height:12mm;">
    <span class="cell-num">45.</span><span class="cell-label">Там.стоим.</span>
    <div class="cell-value b r">${formatNumber(item.customsValue)}</div>
  </div>
  
  <!-- БЛОК 46: Стат.стоимость -->
  <div class="cell" style="left:155mm; top:${y + 38}mm; width:50mm; height:12mm;">
    <span class="cell-num">46.</span><span class="cell-label">Стат.стоим.</span>
    <div class="cell-value r">${formatNumber(item.statisticalValue)}</div>
  </div>
  `;
}

/**
 * Генерация ТД2 - добавочный лист (до 3 товаров) с абсолютным позиционированием
 */
function generateTD2(data: GTDTemplateData, pageItems: DeclarationItem[], pageNumber: number): string {
  const { declaration } = data;
  
  const pageTotal = pageItems.reduce((s, i) => 
    s + (Number(i.dutyAmount) || 0) + (Number(i.vatAmount) || 0) + (Number(i.feeAmount) || 0), 0);

  // Генерация товаров с разным Y offset (каждый товар ~65mm высотой)
  const itemsHtml = pageItems.map((item, idx) => 
    generateTD2Item(item, idx, 35 + idx * 70)
  ).join('');

  return `
<div class="page">
  <!-- ЗАГОЛОВОК: ДОБАВОЧНЫЙ ЛИСТ -->
  <div class="cell" style="left:5mm; top:5mm; width:80mm; height:10mm; border-width:0.5mm;">
    <div class="header-title">ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ<br><span style="font-size:7pt;">ДОБАВОЧНЫЙ ЛИСТ</span></div>
  </div>
  
  <!-- ED -->
  <div class="cell nb" style="left:86mm; top:5mm; width:14mm; height:10mm;">
    <div class="ed-text" style="font-size:14pt;">ED</div>
  </div>
  
  <!-- БЛОК 2: Экспортер -->
  <div class="cell" style="left:5mm; top:15mm; width:65mm; height:18mm;">
    <span class="cell-num">2.</span><span class="cell-label">Экспортер</span>
    <div class="cell-value sm">${declaration.exporterName || ''}</div>
    <div class="cell-value sm">${declaration.exporterAddress || ''}</div>
  </div>
  
  <!-- БЛОК 8: Получатель -->
  <div class="cell" style="left:70mm; top:15mm; width:65mm; height:18mm;">
    <span class="cell-num">8.</span><span class="cell-label">Получатель</span>
    <div class="cell-value sm">${declaration.consigneeName || ''}</div>
    <div class="cell-value sm">${declaration.consigneeAddress || ''}</div>
  </div>
  
  <!-- БЛОК 7: № ГТД -->
  <div class="cell" style="left:135mm; top:5mm; width:70mm; height:28mm;">
    <span class="cell-num">7.</span><span class="cell-label">№ ГТД</span>
    <div class="cell-value">${declaration.declarationNumber || ''}</div>
  </div>
  
  <!-- БЛОК 3: Доб.лист -->
  <div class="cell" style="left:100mm; top:5mm; width:35mm; height:10mm;">
    <span class="cell-num">3</span><span class="cell-label">Доб.лист</span>
    <div class="cell-value lg c">${pageNumber}</div>
  </div>
  
  ${itemsHtml}
  
  <!-- ИТОГО ПО СТРАНИЦЕ -->
  <div class="cell" style="left:5mm; top:280mm; width:200mm; height:10mm;">
    <span class="cell-label">Итого по странице:</span>
    <span class="cell-value b">${formatNumber(pageTotal)} UZS</span>
  </div>
</div>
`;
}

/**
 * Генерация полного HTML документа
 */
export function generateGTDHTML(data: GTDTemplateData): string {
  const { items } = data;
  
  let html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>ГТД ${data.declaration.declarationNumber || ''}</title>
  <style>${getStyles()}</style>
</head>
<body>
${generateTD1(data)}
`;
  
  // Добавочные листы ТД2
  if (items.length > 1) {
    const additionalItems = items.slice(1);
    const itemsPerPage = 3;
    const pageCount = Math.ceil(additionalItems.length / itemsPerPage);
    
    for (let page = 0; page < pageCount; page++) {
      const pageItems = additionalItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      html += generateTD2(data, pageItems, page + 1);
    }
  }
  
  html += '</body></html>';
  return html;
}

export function generateGTDPreviewHTML(data: GTDTemplateData): string {
  return generateGTDHTML(data);
}
