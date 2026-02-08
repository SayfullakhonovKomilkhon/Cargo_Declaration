/**
 * GTD PDF Template Service
 * 
 * Генерация PDF документа ГТД путём наложения текста на пустой бланк.
 * Использует pdf-lib для работы с PDF и точного позиционирования текста.
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont, PDFImage } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TD1_COORDINATES,
  TD2_COORDINATES,
  TD2_ITEM_COORDINATES,
  TD2_ITEM_Y_OFFSET,
  type FieldCoordinates,
  type GTDCoordinates,
} from '../templates/gtd-coordinates';

/**
 * Данные для заполнения ТД1 (основной лист)
 */
export interface TD1Data {
  // Блок 1 - Тип декларации
  declarationType?: string;
  declarationTypeCode?: string;
  
  // Блок 2 - Экспортер
  exporterName?: string;
  exporterAddress?: string;
  exporterTin?: string;
  exporterCountryCode?: string;
  
  // Блоки 3-7
  additionalSheets?: number;
  loadingSpecs?: string;
  totalItems?: number;
  totalPackages?: number;
  declarationNumber?: string;
  declarationDate?: string;
  
  // Блок 8 - Получатель
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeTin?: string;
  
  // Блок 9 - Финансово ответственный
  financialResponsibleName?: string;
  financialResponsibleTin?: string;
  
  // Блоки 10-13
  firstDestinationCountry?: string;
  tradingCountry?: string;
  tradingCountryCode?: string;
  offshoreIndicator?: string;
  totalCustomsValue?: number;
  totalCustomsValueCurrency?: string;
  
  // Блок 14 - Декларант
  declarantName?: string;
  declarantAddress?: string;
  declarantTin?: string;
  
  // Блоки 15-17
  dispatchCountry?: string;
  dispatchCountryCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  
  // Блок 18 - Транспорт
  transportCount?: number;
  departureTransportType?: string;
  departureTransportNumber?: string;
  transportNationality?: string;
  
  // Блоки 19-28
  containerIndicator?: string;
  incotermsCode?: string;
  deliveryPlace?: string;
  borderTransportNumber?: string;
  currency?: string;
  totalInvoiceAmount?: number;
  exchangeRate?: number;
  transactionNature?: string;
  transactionCurrencyCode?: string;
  borderTransportMode?: string;
  inlandTransportMode?: string;
  loadingPlace?: string;
  bankDetails?: string;
  
  // Блоки 29-30
  entryCustomsOffice?: string;
  goodsLocation?: string;
  
  // Первый товар (блоки 31-47)
  firstItem?: ItemData;
  
  // Блоки 48-54
  deferredPayment?: string;
  warehouseName?: string;
  calculationDetails?: string;
  principalName?: string;
  principalPosition?: string;
  transitCustomsOffice?: string;
  guaranteeInvalid?: string;
  exitCustomsOffice?: string;
  customsControl?: string;
  declarationPlace?: string;
  signatoryName?: string;
  signatoryPhone?: string;
}

/**
 * Данные товарной позиции
 */
export interface ItemData {
  itemNumber?: number;
  goodsDescription?: string;
  marksNumbers?: string;
  packageType?: string;
  packageQuantity?: number;
  hsCode?: string;
  originCountryCode?: string;
  grossWeight?: number;
  netWeight?: number;
  preferenceCode?: string;
  procedureCode?: string;
  previousProcedureCode?: string;
  movementCode?: string;
  quotaNumber?: string;
  previousDocument?: string;
  supplementaryQuantity?: number;
  supplementaryUnit?: string;
  itemPrice?: number;
  valuationMethodCode?: string;
  additionalInfo?: string;
  customsValue?: number;
  statisticalValue?: number;
  
  // Платежи
  dutyType?: string;
  dutyBase?: number;
  dutyRate?: string;
  dutyAmount?: number;
  dutyPaymentMethod?: string;
  vatType?: string;
  vatBase?: number;
  vatRate?: string;
  vatAmount?: number;
  vatPaymentMethod?: string;
  feeType?: string;
  feeBase?: number;
  feeRate?: string;
  feeAmount?: number;
  feePaymentMethod?: string;
  totalPayment?: number;
}

/**
 * Опции генерации PDF
 */
export interface PDFGenerationOptions {
  /** Путь к файлу шаблона ТД1 (изображение JPG/PNG) */
  td1TemplatePath?: string;
  /** Путь к файлу шаблона ТД2 (изображение JPG/PNG) */
  td2TemplatePath?: string;
  /** Использовать изображения бланков как фон */
  useImageBackground?: boolean;
  /** Использовать встроенный пустой шаблон */
  useBuiltInTemplate?: boolean;
  /** Показывать сетку для отладки */
  showDebugGrid?: boolean;
  /** Размер шрифта по умолчанию */
  defaultFontSize?: number;
  /** Показывать рамки полей для отладки */
  showFieldBorders?: boolean;
}

/**
 * Форматирование числа
 */
function formatNumber(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Разбиение текста на строки с учётом максимальной ширины
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  if (!text) return [];
  
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  // Примерная ширина символа (для моноширинных шрифтов)
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Слово длиннее строки - разбиваем его
        let remaining = word;
        while (remaining.length > maxChars) {
          lines.push(remaining.substring(0, maxChars));
          remaining = remaining.substring(maxChars);
        }
        currentLine = remaining;
      }
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * GTD PDF Template Service
 */
export class GTDPDFTemplateService {
  private pdfDoc: PDFDocument | null = null;
  private fonts: Map<string, PDFFont> = new Map();
  private options: PDFGenerationOptions;
  private td1Image: PDFImage | null = null;
  private td2Image: PDFImage | null = null;
  
  constructor(options: PDFGenerationOptions = {}) {
    this.options = {
      useBuiltInTemplate: true,
      useImageBackground: false,
      showDebugGrid: false,
      showFieldBorders: false,
      defaultFontSize: 8,
      ...options,
    };
  }
  
  /**
   * Инициализация PDF документа
   */
  private async initDocument(): Promise<void> {
    this.pdfDoc = await PDFDocument.create();
    this.pdfDoc.registerFontkit(fontkit);
    
    // Встраиваем стандартные шрифты
    this.fonts.set('helvetica', await this.pdfDoc.embedFont(StandardFonts.Helvetica));
    this.fonts.set('helvetica-bold', await this.pdfDoc.embedFont(StandardFonts.HelveticaBold));
    this.fonts.set('courier', await this.pdfDoc.embedFont(StandardFonts.Courier));
    this.fonts.set('times', await this.pdfDoc.embedFont(StandardFonts.TimesRoman));
    
    // Загружаем изображения бланков если указан режим useImageBackground
    if (this.options.useImageBackground) {
      await this.loadTemplateImages();
    }
  }
  
  /**
   * Загрузка изображений или PDF шаблонов
   */
  private async loadTemplateImages(): Promise<void> {
    if (!this.pdfDoc) return;
    
    try {
      // Пути к бланкам по умолчанию (поддержка jpg, png, pdf)
      const td1Path = this.options.td1TemplatePath || 
        path.join(process.cwd(), 'src/server/templates/pdf-blanks/td1-blank.jpg');
      const td2Path = this.options.td2TemplatePath || 
        path.join(process.cwd(), 'src/server/templates/pdf-blanks/td2-blank.jpg');
      
      // Загружаем TD1
      try {
        const td1Bytes = await fs.readFile(td1Path);
        if (td1Path.toLowerCase().endsWith('.pdf')) {
          // Загружаем PDF и конвертируем первую страницу в изображение
          const templateDoc = await PDFDocument.load(td1Bytes);
          const [embeddedPage] = await this.pdfDoc.embedPages(templateDoc.getPages());
          // Сохраняем как встроенную страницу для использования
          this.td1Image = embeddedPage as unknown as PDFImage;
        } else if (td1Path.toLowerCase().endsWith('.png')) {
          this.td1Image = await this.pdfDoc.embedPng(td1Bytes);
        } else {
          this.td1Image = await this.pdfDoc.embedJpg(td1Bytes);
        }
      } catch (e) {
        console.warn('TD1 template not found:', td1Path);
      }
      
      // Загружаем TD2
      try {
        const td2Bytes = await fs.readFile(td2Path);
        if (td2Path.toLowerCase().endsWith('.pdf')) {
          const templateDoc = await PDFDocument.load(td2Bytes);
          const [embeddedPage] = await this.pdfDoc.embedPages(templateDoc.getPages());
          this.td2Image = embeddedPage as unknown as PDFImage;
        } else if (td2Path.toLowerCase().endsWith('.png')) {
          this.td2Image = await this.pdfDoc.embedPng(td2Bytes);
        } else {
          this.td2Image = await this.pdfDoc.embedJpg(td2Bytes);
        }
      } catch (e) {
        console.warn('TD2 template not found:', td2Path);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }
  
  /**
   * Создание страницы с фоновым изображением или PDF страницей
   */
  private createPageWithBackground(image: PDFImage | null): PDFPage {
    if (!this.pdfDoc) throw new Error('Document not initialized');
    
    // A4 размер: 595 x 842 точек
    const page = this.pdfDoc.addPage([595, 842]);
    
    // Добавляем фон на всю страницу
    if (image) {
      // Проверяем тип - изображение или встроенная страница PDF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgAny = image as any;
      if (imgAny.width && imgAny.height && typeof imgAny.embed === 'function') {
        // Это обычное изображение
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: 595,
          height: 842,
          opacity: 1,
        });
      } else {
        // Это встроенная страница PDF - рисуем её
        page.drawPage(imgAny, {
          x: 0,
          y: 0,
          xScale: 595 / (imgAny.width || 595),
          yScale: 842 / (imgAny.height || 842),
        });
      }
    }
    
    if (this.options.showDebugGrid) {
      this.drawDebugGrid(page);
    }
    
    return page;
  }
  
  /**
   * Создание пустой страницы A4
   */
  private createBlankPage(): PDFPage {
    if (!this.pdfDoc) throw new Error('Document not initialized');
    
    // A4 размер: 595 x 842 точек
    const page = this.pdfDoc.addPage([595, 842]);
    
    if (this.options.showDebugGrid) {
      this.drawDebugGrid(page);
    }
    
    return page;
  }
  
  /**
   * Отрисовка сетки для отладки координат
   */
  private drawDebugGrid(page: PDFPage): void {
    const { width, height } = page.getSize();
    
    // Вертикальные линии каждые 50 точек
    for (let x = 0; x <= width; x += 50) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        color: rgb(0.9, 0.9, 0.9),
        thickness: x % 100 === 0 ? 0.5 : 0.2,
      });
      
      if (x % 100 === 0) {
        page.drawText(String(x), {
          x: x + 2,
          y: 5,
          size: 6,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }
    
    // Горизонтальные линии каждые 50 точек
    for (let y = 0; y <= height; y += 50) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        color: rgb(0.9, 0.9, 0.9),
        thickness: y % 100 === 0 ? 0.5 : 0.2,
      });
      
      if (y % 100 === 0) {
        page.drawText(String(y), {
          x: 2,
          y: y + 2,
          size: 6,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }
  }
  
  /**
   * Отрисовка структуры бланка ТД1
   * Примечание: Не рисуем текст на кириллице, т.к. стандартные PDF шрифты не поддерживают её.
   * Только рисуем структуру (линии, блоки с номерами).
   */
  private drawTD1Structure(page: PDFPage): void {
    const { width, height } = page.getSize();
    const margin = 28;
    const lineColor = rgb(0, 0, 0);
    const headerFont = this.fonts.get('helvetica-bold')!;
    
    // =============================================
    // ЗАГОЛОВОК (только латинские символы)
    // =============================================
    page.drawText('GTD / TD1', {
      x: 280,
      y: height - 35,
      size: 14,
      font: headerFont,
    });
    
    // =============================================
    // ВНЕШНЯЯ РАМКА
    // =============================================
    const formTop = height - 55;
    const formBottom = 20;
    const formLeft = margin;
    const formRight = width - margin;
    
    page.drawRectangle({
      x: formLeft,
      y: formBottom,
      width: formRight - formLeft,
      height: formTop - formBottom,
      borderColor: lineColor,
      borderWidth: 1,
    });
    
    // =============================================
    // ГОРИЗОНТАЛЬНЫЕ ЛИНИИ (строки формы)
    // =============================================
    const rows = [
      formTop - 60,    // Под блоками 2, 1, A (конец строки 1)
      formTop - 100,   // Под блоками 3-7 (конец строки 2)
      formTop - 160,   // Под блоками 8, 9 (конец строки 3)
      formTop - 190,   // Под блоками 10-13 (конец строки 4)
      formTop - 250,   // Под блоками 14-17a (конец строки 5-7)
      formTop - 280,   // Под блоком 16
      formTop - 310,   // Под блоком 17
      formTop - 350,   // Под блоками 18-20 (конец строки 8)
      formTop - 390,   // Под блоками 21-24 (конец строки 9)
      formTop - 430,   // Под блоками 25-28 (конец строки 10)
      formTop - 470,   // Под блоками 29-30 (конец строки 11)
      formTop - 630,   // Под товарными блоками 31-46
      formTop - 710,   // Под блоком 47
    ];
    
    rows.forEach(y => {
      if (y > formBottom) {
        page.drawLine({
          start: { x: formLeft, y },
          end: { x: formRight, y },
          color: lineColor,
          thickness: 0.5,
        });
      }
    });
    
    // =============================================
    // ВЕРТИКАЛЬНЫЕ ЛИНИИ
    // =============================================
    const col1 = formLeft + 230;  // Граница блока 2
    const col2 = formLeft + 400;  // Начало блока 1
    const colA = formLeft + 480;  // Блок A
    
    // Строка 1: Блоки 2, 1, A
    page.drawLine({ start: { x: col1, y: formTop }, end: { x: col1, y: formTop - 60 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col2, y: formTop }, end: { x: col2, y: formTop - 60 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: colA, y: formTop }, end: { x: colA, y: formTop - 100 }, color: lineColor, thickness: 0.5 });
    
    // Строка 2: Блоки 3-7
    const row2_y = formTop - 60;
    page.drawLine({ start: { x: col1, y: row2_y }, end: { x: col1, y: row2_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1 + 35, y: row2_y }, end: { x: col1 + 35, y: row2_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1 + 80, y: row2_y }, end: { x: col1 + 80, y: row2_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1 + 125, y: row2_y }, end: { x: col1 + 125, y: row2_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col2, y: row2_y }, end: { x: col2, y: row2_y - 40 }, color: lineColor, thickness: 0.5 });
    
    // Строка 3: Блоки 8, 9
    page.drawLine({ start: { x: col1, y: formTop - 100 }, end: { x: col1, y: formTop - 160 }, color: lineColor, thickness: 0.5 });
    
    // Строка 4: Блоки 10-13
    const row4_y = formTop - 160;
    page.drawLine({ start: { x: formLeft + 70, y: row4_y }, end: { x: formLeft + 70, y: row4_y - 30 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: formLeft + 160, y: row4_y }, end: { x: formLeft + 160, y: row4_y - 30 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col2, y: row4_y }, end: { x: col2, y: row4_y - 30 }, color: lineColor, thickness: 0.5 });
    
    // Строки 5-7: Блоки 14, 15-17
    page.drawLine({ start: { x: col1, y: formTop - 190 }, end: { x: col1, y: formTop - 310 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: colA, y: formTop - 190 }, end: { x: colA, y: formTop - 310 }, color: lineColor, thickness: 0.5 });
    
    // Строка 8: Блоки 18, 19, 20
    const row8_y = formTop - 310;
    page.drawLine({ start: { x: col1, y: row8_y }, end: { x: col1, y: row8_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1 + 25, y: row8_y }, end: { x: col1 + 25, y: row8_y - 40 }, color: lineColor, thickness: 0.5 });
    
    // Строка 9: Блоки 21, 22-24
    const row9_y = formTop - 350;
    page.drawLine({ start: { x: col1, y: row9_y }, end: { x: col1, y: row9_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col2, y: row9_y }, end: { x: col2, y: row9_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: colA, y: row9_y }, end: { x: colA, y: row9_y - 40 }, color: lineColor, thickness: 0.5 });
    
    // Строка 10: Блоки 25-28
    const row10_y = formTop - 390;
    page.drawLine({ start: { x: formLeft + 45, y: row10_y }, end: { x: formLeft + 45, y: row10_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: formLeft + 95, y: row10_y }, end: { x: formLeft + 95, y: row10_y - 40 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1, y: row10_y }, end: { x: col1, y: row10_y - 40 }, color: lineColor, thickness: 0.5 });
    
    // Строка 11: Блоки 29-30
    page.drawLine({ start: { x: col1, y: formTop - 430 }, end: { x: col1, y: formTop - 470 }, color: lineColor, thickness: 0.5 });
    
    // Товарный блок: Блоки 31, 32-46
    const goodsTop = formTop - 470;
    const goodsBottom = formTop - 630;
    page.drawLine({ start: { x: col1, y: goodsTop }, end: { x: col1, y: goodsBottom }, color: lineColor, thickness: 0.5 });
    
    // Подблоки товара (32-46)
    page.drawLine({ start: { x: col1 + 45, y: goodsTop }, end: { x: col1 + 45, y: goodsTop - 30 }, color: lineColor, thickness: 0.5 });
    // Горизонтальные линии внутри товарного блока
    page.drawLine({ start: { x: col1, y: goodsTop - 30 }, end: { x: formRight, y: goodsTop - 30 }, color: lineColor, thickness: 0.3 });
    page.drawLine({ start: { x: col1, y: goodsTop - 55 }, end: { x: formRight, y: goodsTop - 55 }, color: lineColor, thickness: 0.3 });
    page.drawLine({ start: { x: col1, y: goodsTop - 80 }, end: { x: formRight, y: goodsTop - 80 }, color: lineColor, thickness: 0.3 });
    page.drawLine({ start: { x: col1, y: goodsTop - 105 }, end: { x: formRight, y: goodsTop - 105 }, color: lineColor, thickness: 0.3 });
    page.drawLine({ start: { x: col1, y: goodsTop - 130 }, end: { x: formRight, y: goodsTop - 130 }, color: lineColor, thickness: 0.3 });
    
    // Блок 47 (платежи)
    const pay_y = formTop - 630;
    page.drawLine({ start: { x: formLeft + 40, y: pay_y }, end: { x: formLeft + 40, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: formLeft + 75, y: pay_y }, end: { x: formLeft + 75, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: formLeft + 140, y: pay_y }, end: { x: formLeft + 140, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: formLeft + 185, y: pay_y }, end: { x: formLeft + 185, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1, y: pay_y }, end: { x: col1, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: col1 + 35, y: pay_y }, end: { x: col1 + 35, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    page.drawLine({ start: { x: colA, y: pay_y }, end: { x: colA, y: pay_y - 80 }, color: lineColor, thickness: 0.5 });
    
    // =============================================
    // НОМЕРА БЛОКОВ (чёрные квадраты с белыми цифрами)
    // =============================================
    const blockNumbers = [
      { num: '2', x: formLeft + 2, y: formTop - 13 },
      { num: '1', x: col2 + 2, y: formTop - 13 },
      { num: 'A', x: colA + 2, y: formTop - 13 },
      { num: '3', x: col1 + 2, y: formTop - 73 },
      { num: '4', x: col1 + 37, y: formTop - 73 },
      { num: '5', x: col1 + 82, y: formTop - 73 },
      { num: '6', x: col1 + 127, y: formTop - 73 },
      { num: '7', x: col2 + 2, y: formTop - 73 },
      { num: '8', x: formLeft + 2, y: formTop - 113 },
      { num: '9', x: col1 + 2, y: formTop - 113 },
      { num: '10', x: formLeft + 2, y: formTop - 173 },
      { num: '11', x: formLeft + 72, y: formTop - 173 },
      { num: '12', x: formLeft + 162, y: formTop - 173 },
      { num: '13', x: col2 + 2, y: formTop - 173 },
      { num: '14', x: formLeft + 2, y: formTop - 203 },
      { num: '15', x: col1 + 2, y: formTop - 203 },
      { num: '16', x: col1 + 2, y: formTop - 263 },
      { num: '17', x: col1 + 2, y: formTop - 293 },
      { num: '18', x: formLeft + 2, y: formTop - 323 },
      { num: '19', x: col1 + 2, y: formTop - 323 },
      { num: '20', x: col1 + 27, y: formTop - 323 },
      { num: '21', x: formLeft + 2, y: formTop - 363 },
      { num: '22', x: col1 + 2, y: formTop - 363 },
      { num: '23', x: col2 + 2, y: formTop - 363 },
      { num: '24', x: colA + 2, y: formTop - 363 },
      { num: '25', x: formLeft + 2, y: formTop - 403 },
      { num: '26', x: formLeft + 47, y: formTop - 403 },
      { num: '27', x: formLeft + 97, y: formTop - 403 },
      { num: '28', x: col1 + 2, y: formTop - 403 },
      { num: '29', x: formLeft + 2, y: formTop - 443 },
      { num: '30', x: col1 + 2, y: formTop - 443 },
      { num: '31', x: formLeft + 2, y: formTop - 483 },
      { num: '32', x: col1 + 2, y: formTop - 483 },
      { num: '33', x: col1 + 47, y: formTop - 483 },
      { num: '47', x: formLeft + 2, y: formTop - 643 },
    ];
    
    blockNumbers.forEach(block => {
      const boxSize = block.num.length > 1 ? 14 : 10;
      // Чёрный квадрат
      page.drawRectangle({
        x: block.x,
        y: block.y,
        width: boxSize,
        height: 10,
        color: rgb(0, 0, 0),
      });
      
      // Белый номер (только цифры/латиница)
      page.drawText(block.num, {
        x: block.x + (block.num.length > 1 ? 2 : 3),
        y: block.y + 2,
        size: 7,
        color: rgb(1, 1, 1),
        font: headerFont,
      });
    });
  }
  
  /**
   * Санитизация текста для PDF (удаляем непечатаемые символы)
   * Стандартные шрифты PDF не поддерживают кириллицу, поэтому:
   * - Оставляем латиницу, цифры, знаки препинания
   * - Транслитерируем кириллицу в латиницу
   */
  private sanitizeText(text: string): string {
    // Карта транслитерации кириллицы в латиницу
    const cyrillicToLatin: Record<string, string> = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
      'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
      'Я': 'Ya',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
      'я': 'ya',
      // Узбекские символы
      'Ў': 'O\'', 'ў': 'o\'', 'Қ': 'Q', 'қ': 'q', 'Ғ': 'G\'', 'ғ': 'g\'', 'Ҳ': 'H', 'ҳ': 'h',
    };
    
    let result = '';
    for (const char of text) {
      if (cyrillicToLatin[char] !== undefined) {
        result += cyrillicToLatin[char];
      } else if (char.charCodeAt(0) < 128 || char.charCodeAt(0) >= 0x2000 && char.charCodeAt(0) <= 0x206F) {
        // ASCII и общая пунктуация
        result += char;
      } else {
        // Заменяем неизвестные символы на пробел или пропускаем
        result += ' ';
      }
    }
    
    return result.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Отрисовка текста в поле по координатам
   */
  private drawField(
    page: PDFPage,
    value: string | number | undefined,
    coords: FieldCoordinates,
    fieldName?: string
  ): void {
    // Показываем рамку поля для отладки (даже если нет значения)
    if (this.options.showFieldBorders && coords.width) {
      page.drawRectangle({
        x: coords.x,
        y: coords.y - (coords.height || coords.fontSize || 10),
        width: coords.width,
        height: coords.height || coords.fontSize || 10,
        borderColor: rgb(1, 0, 0),
        borderWidth: 0.5,
        opacity: 0.3,
      });
      
      // Показываем имя поля
      if (fieldName) {
        const safeName = this.sanitizeText(fieldName);
        page.drawText(safeName, {
          x: coords.x,
          y: coords.y + 2,
          size: 5,
          color: rgb(1, 0, 0),
        });
      }
    }
    
    if (value === undefined || value === null || value === '') return;
    
    // Санитизируем текст для PDF
    const rawText = typeof value === 'number' ? formatNumber(value) : String(value);
    const text = this.sanitizeText(rawText);
    
    if (!text) return; // Если после санитизации текст пустой
    
    const font = this.fonts.get(coords.font || 'helvetica')!;
    const fontSize = coords.fontSize || this.options.defaultFontSize || 8;
    
    if (coords.multiline && coords.width) {
      // Многострочный текст
      const lines = wrapText(text, coords.width, fontSize, font);
      const maxLines = coords.maxLines || 10;
      const lineHeight = fontSize * 1.2;
      
      lines.slice(0, maxLines).forEach((line, index) => {
        page.drawText(line, {
          x: coords.x,
          y: coords.y - (index * lineHeight),
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
    } else {
      // Однострочный текст
      let x = coords.x;
      
      if (coords.align === 'center' && coords.width) {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        x = coords.x + (coords.width - textWidth) / 2;
      } else if (coords.align === 'right' && coords.width) {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        x = coords.x + coords.width - textWidth;
      }
      
      page.drawText(text, {
        x,
        y: coords.y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }
  
  /**
   * Заполнение страницы ТД1
   */
  private fillTD1(page: PDFPage, data: TD1Data): void {
    const coords = TD1_COORDINATES;
    
    // Блок 1 - Тип декларации
    this.drawField(page, data.declarationType, coords.declarationType);
    this.drawField(page, data.declarationTypeCode, coords.declarationTypeCode);
    
    // Блок 2 - Экспортер
    this.drawField(page, data.exporterName, coords.exporterName);
    this.drawField(page, data.exporterAddress, coords.exporterAddress);
    this.drawField(page, data.exporterTin, coords.exporterTin);
    this.drawField(page, data.exporterCountryCode, coords.exporterCountryCode);
    
    // Блоки 3-7
    this.drawField(page, data.additionalSheets, coords.additionalSheets);
    this.drawField(page, data.loadingSpecs, coords.loadingSpecs);
    this.drawField(page, data.totalItems, coords.totalItems);
    this.drawField(page, data.totalPackages, coords.totalPackages);
    this.drawField(page, data.declarationNumber, coords.declarationNumber);
    this.drawField(page, data.declarationDate, coords.declarationDate);
    
    // Блок 8 - Получатель
    this.drawField(page, data.consigneeName, coords.consigneeName);
    this.drawField(page, data.consigneeAddress, coords.consigneeAddress);
    this.drawField(page, data.consigneeTin, coords.consigneeTin);
    
    // Блок 9
    this.drawField(page, data.financialResponsibleName, coords.financialResponsibleName);
    this.drawField(page, data.financialResponsibleTin, coords.financialResponsibleTin);
    
    // Блоки 10-13
    this.drawField(page, data.firstDestinationCountry, coords.firstDestinationCountry);
    this.drawField(page, data.tradingCountry, coords.tradingCountry);
    this.drawField(page, data.tradingCountryCode, coords.tradingCountryCode);
    this.drawField(page, data.offshoreIndicator, coords.offshoreIndicator);
    this.drawField(page, data.totalCustomsValue, coords.totalCustomsValue);
    this.drawField(page, data.totalCustomsValueCurrency, coords.totalCustomsValueCurrency);
    
    // Блок 14 - Декларант
    this.drawField(page, data.declarantName, coords.declarantName);
    this.drawField(page, data.declarantAddress, coords.declarantAddress);
    this.drawField(page, data.declarantTin, coords.declarantTin);
    
    // Блоки 15-17
    this.drawField(page, data.dispatchCountry, coords.dispatchCountry);
    this.drawField(page, data.dispatchCountryCode, coords.dispatchCountryCode);
    this.drawField(page, data.originCountry, coords.originCountry);
    this.drawField(page, data.destinationCountry, coords.destinationCountry);
    this.drawField(page, data.destinationCountryCode, coords.destinationCountryCode);
    
    // Блок 18 - Транспорт
    this.drawField(page, data.transportCount, coords.transportCount);
    this.drawField(page, data.departureTransportType, coords.departureTransportType);
    this.drawField(page, data.departureTransportNumber, coords.departureTransportNumber);
    this.drawField(page, data.transportNationality, coords.transportNationality);
    
    // Блоки 19-28
    this.drawField(page, data.containerIndicator, coords.containerIndicator);
    this.drawField(page, data.incotermsCode, coords.incotermsCode);
    this.drawField(page, data.deliveryPlace, coords.deliveryPlace);
    this.drawField(page, data.borderTransportNumber, coords.borderTransportNumber);
    this.drawField(page, data.currency, coords.currency);
    this.drawField(page, data.totalInvoiceAmount, coords.totalInvoiceAmount);
    this.drawField(page, data.exchangeRate, coords.exchangeRate);
    this.drawField(page, data.transactionNature, coords.transactionNature);
    this.drawField(page, data.transactionCurrencyCode, coords.transactionCurrencyCode);
    this.drawField(page, data.borderTransportMode, coords.borderTransportMode);
    this.drawField(page, data.inlandTransportMode, coords.inlandTransportMode);
    this.drawField(page, data.loadingPlace, coords.loadingPlace);
    this.drawField(page, data.bankDetails, coords.bankDetails);
    
    // Блоки 29-30
    this.drawField(page, data.entryCustomsOffice, coords.entryCustomsOffice);
    this.drawField(page, data.goodsLocation, coords.goodsLocation);
    
    // Первый товар (блоки 31-47)
    if (data.firstItem) {
      this.fillItem(page, data.firstItem, coords);
    }
    
    // Блоки 48-54
    this.drawField(page, data.deferredPayment, coords.deferredPayment);
    this.drawField(page, data.warehouseName, coords.warehouseName);
    this.drawField(page, data.calculationDetails, coords.calculationDetails);
    this.drawField(page, data.principalName, coords.principalName);
    this.drawField(page, data.principalPosition, coords.principalPosition);
    this.drawField(page, data.transitCustomsOffice, coords.transitCustomsOffice);
    this.drawField(page, data.guaranteeInvalid, coords.guaranteeInvalid);
    this.drawField(page, data.exitCustomsOffice, coords.exitCustomsOffice);
    this.drawField(page, data.declarationPlace, coords.declarationPlace);
    this.drawField(page, data.signatoryName, coords.signatoryName);
    this.drawField(page, data.signatoryPhone, coords.signatoryPhone);
  }
  
  /**
   * Заполнение данных товара
   */
  private fillItem(page: PDFPage, item: ItemData, coords: GTDCoordinates): void {
    this.drawField(page, item.itemNumber || 1, coords.itemNumber);
    this.drawField(page, item.goodsDescription, coords.goodsDescription);
    this.drawField(page, item.marksNumbers, coords.marksNumbers);
    this.drawField(page, item.packageType, coords.packageType);
    this.drawField(page, item.packageQuantity, coords.packageQuantity);
    this.drawField(page, item.hsCode, coords.hsCode);
    this.drawField(page, item.originCountryCode, coords.itemOriginCountryCode || coords.originCountryCode);
    this.drawField(page, item.grossWeight, coords.grossWeight);
    this.drawField(page, item.netWeight, coords.netWeight);
    this.drawField(page, item.preferenceCode, coords.preferenceCode);
    this.drawField(page, item.procedureCode, coords.procedureCode);
    this.drawField(page, item.previousProcedureCode, coords.previousProcedureCode);
    this.drawField(page, item.movementCode, coords.movementCode);
    this.drawField(page, item.quotaNumber, coords.quotaNumber);
    this.drawField(page, item.previousDocument, coords.previousDocument);
    this.drawField(page, item.supplementaryQuantity, coords.supplementaryQuantity);
    this.drawField(page, item.supplementaryUnit, coords.supplementaryUnit);
    this.drawField(page, item.itemPrice, coords.itemPrice);
    this.drawField(page, item.valuationMethodCode, coords.valuationMethodCode);
    this.drawField(page, item.additionalInfo, coords.additionalInfo);
    this.drawField(page, item.customsValue, coords.customsValue);
    this.drawField(page, item.statisticalValue, coords.statisticalValue);
    
    // Платежи
    this.drawField(page, item.dutyType || '20', coords.dutyType);
    this.drawField(page, item.dutyBase, coords.dutyBase);
    this.drawField(page, item.dutyRate, coords.dutyRate);
    this.drawField(page, item.dutyAmount, coords.dutyAmount);
    this.drawField(page, item.dutyPaymentMethod, coords.dutyPaymentMethod);
    
    this.drawField(page, item.vatType || '70', coords.vatType);
    this.drawField(page, item.vatBase, coords.vatBase);
    this.drawField(page, item.vatRate, coords.vatRate);
    this.drawField(page, item.vatAmount, coords.vatAmount);
    this.drawField(page, item.vatPaymentMethod, coords.vatPaymentMethod);
    
    this.drawField(page, item.feeType || '10', coords.feeType);
    this.drawField(page, item.feeBase, coords.feeBase);
    this.drawField(page, item.feeRate, coords.feeRate);
    this.drawField(page, item.feeAmount, coords.feeAmount);
    this.drawField(page, item.feePaymentMethod, coords.feePaymentMethod);
    
    this.drawField(page, item.totalPayment, coords.totalPayment);
  }
  
  /**
   * Отрисовка структуры бланка ТД2
   */
  private drawTD2Structure(page: PDFPage): void {
    const { width, height } = page.getSize();
    const margin = 20;
    const headerFont = this.fonts.get('helvetica-bold')!;
    
    // Заголовок (только латиница)
    page.drawText('GTD / TD2 - Additional Sheet', {
      x: margin,
      y: height - 35,
      size: 12,
      font: headerFont,
    });
    
    // Внешняя рамка
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - 2 * margin,
      height: height - 60 - margin,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  }
  
  /**
   * Заполнение страницы ТД2
   */
  private fillTD2(
    page: PDFPage,
    items: ItemData[],
    headerData: { exporterName?: string; consigneeName?: string; declarationNumber?: string; sheetNumber: number }
  ): void {
    const coords = TD2_COORDINATES;
    
    // Заголовок
    this.drawField(page, headerData.exporterName, coords.exporterNameShort);
    this.drawField(page, headerData.consigneeName, coords.consigneeNameShort);
    this.drawField(page, headerData.declarationNumber, coords.declarationNumberTD2);
    this.drawField(page, headerData.sheetNumber, coords.additionalSheetsNumber);
    
    // Товары (до 3 на странице)
    items.forEach((item, index) => {
      const yOffset = index * TD2_ITEM_Y_OFFSET;
      const itemCoords: GTDCoordinates = {};
      
      // Смещаем координаты для каждого товара
      for (const [key, coord] of Object.entries(TD2_ITEM_COORDINATES)) {
        itemCoords[key] = {
          ...coord,
          y: coord.y - yOffset,
        };
      }
      
      this.fillItem(page, item, itemCoords);
    });
  }
  
  /**
   * Генерация полного PDF документа ГТД
   */
  async generateGTD(data: TD1Data, additionalItems: ItemData[] = []): Promise<Buffer> {
    await this.initDocument();
    
    // Создаём страницу ТД1
    let td1Page: PDFPage;
    
    if (this.options.useImageBackground && this.td1Image) {
      // Используем изображение бланка как фон
      td1Page = this.createPageWithBackground(this.td1Image);
    } else {
      // Рисуем структуру программно
      td1Page = this.createBlankPage();
      this.drawTD1Structure(td1Page);
    }
    
    this.fillTD1(td1Page, data);
    
    // Если есть дополнительные товары - создаём страницы ТД2
    if (additionalItems.length > 0) {
      const itemsPerPage = 3;
      const pageCount = Math.ceil(additionalItems.length / itemsPerPage);
      
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const pageItems = additionalItems.slice(
          pageIndex * itemsPerPage,
          (pageIndex + 1) * itemsPerPage
        );
        
        let td2Page: PDFPage;
        
        if (this.options.useImageBackground && this.td2Image) {
          // Используем изображение бланка как фон
          td2Page = this.createPageWithBackground(this.td2Image);
        } else {
          // Рисуем структуру программно
          td2Page = this.createBlankPage();
          this.drawTD2Structure(td2Page);
        }
        
        this.fillTD2(td2Page, pageItems, {
          exporterName: data.exporterName,
          consigneeName: data.consigneeName,
          declarationNumber: data.declarationNumber,
          sheetNumber: pageIndex + 1,
        });
      }
    }
    
    // Возвращаем PDF как Buffer
    const pdfBytes = await this.pdfDoc!.save();
    return Buffer.from(pdfBytes);
  }
  
  /**
   * Генерация PDF с режимом отладки (показывает сетку координат)
   */
  async generateDebugPDF(): Promise<Buffer> {
    this.options.showDebugGrid = true;
    await this.initDocument();
    
    const page = this.createBlankPage();
    this.drawTD1Structure(page);
    
    // Пример данных для отладки
    this.fillTD1(page, {
      declarationType: 'ИМ',
      declarationTypeCode: '40',
      exporterName: 'ACME TRADING CO., LTD',
      exporterAddress: 'No. 123 Business Street, Shanghai, China',
      exporterTin: '123456789',
      consigneeName: 'ООО "ИМПОРТ ТРЕЙД"',
      consigneeAddress: 'г. Ташкент, ул. Навои, 100',
      consigneeTin: '987654321',
      totalItems: 5,
      totalPackages: 100,
      declarationNumber: '11706/010125/0000001',
      currency: 'USD',
      totalInvoiceAmount: 50000,
      firstItem: {
        itemNumber: 1,
        hsCode: '8471300000',
        goodsDescription: 'Компьютеры портативные (ноутбуки)',
        grossWeight: 150.5,
        netWeight: 145.0,
        itemPrice: 10000,
        customsValue: 10500,
        dutyRate: '0%',
        dutyAmount: 0,
        vatRate: '12%',
        vatAmount: 1260,
      },
    });
    
    const pdfBytes = await this.pdfDoc!.save();
    return Buffer.from(pdfBytes);
  }
}

/**
 * Экспорт по умолчанию
 */
export default GTDPDFTemplateService;
