import { prisma } from '@/server/db/client';
import { generateGTDHTML, type GTDTemplateData } from '@/server/templates/gtd-template';
import { GTDGenerator, GTDValidator, type GTDData, type GTDItem, type ValidationError, type CorrectionLog } from './gtd-generator.service';

// Интерфейс результата генерации PDF с валидацией
export interface PDFGenerationResult {
  buffer: Buffer;
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    corrections: CorrectionLog[];
  };
  warnings: string[];
}

/**
 * PDF Generator Service
 * Uses Puppeteer for HTML to PDF conversion with GTD validation
 */
export class PDFGeneratorService {
  /**
   * Generate PDF for a declaration with validation
   */
  static async generateDeclarationPDF(declarationId: string): Promise<Buffer> {
    const result = await this.generateDeclarationPDFWithValidation(declarationId);
    return result.buffer;
  }

  /**
   * Generate PDF with full validation and correction logs
   */
  static async generateDeclarationPDFWithValidation(declarationId: string): Promise<PDFGenerationResult> {
    // Load declaration with items and organization
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
        organization: true,
      },
    });

    if (!declaration) {
      throw new Error('Декларация не найдена');
    }

    // Преобразуем данные из БД в формат GTDData для валидации
    const gtdData = this.convertToGTDData(declaration);
    
    // Генерация и валидация через GTDGenerator
    const generator = new GTDGenerator(gtdData);
    const { validation } = generator.generate();

    // Собираем предупреждения
    const warnings: string[] = [];
    
    // Проверяем критические ошибки
    const criticalErrors = validation.errors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      warnings.push(...criticalErrors.map(e => `[ОШИБКА] ${e.message}`));
    }

    // Добавляем предупреждения
    const warningErrors = validation.errors.filter(e => e.severity === 'warning');
    warnings.push(...warningErrors.map(e => `[ВНИМАНИЕ] ${e.message}`));

    // Логируем коррекции
    if (validation.corrections.length > 0) {
      console.log('[PDF Generator] Автоматические корректировки:');
      validation.corrections.forEach(c => {
        console.log(`  - ${c.field}: ${JSON.stringify(c.originalValue)} → ${JSON.stringify(c.correctedValue)} (${c.reason})`);
      });
    }

    // Generate HTML
    const templateData: GTDTemplateData = {
      declaration,
      items: declaration.items,
      organization: declaration.organization,
    };

    const html = generateGTDHTML(templateData);

    // Try to use Puppeteer if available
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.generateWithPuppeteer(html);
    } catch (puppeteerError) {
      console.warn('Puppeteer not available, using fallback:', puppeteerError);
      // Return HTML as buffer (can be used for print)
      pdfBuffer = Buffer.from(html, 'utf-8');
    }

    return {
      buffer: pdfBuffer,
      validation,
      warnings,
    };
  }

  /**
   * Преобразование данных из Prisma в формат GTDData
   */
  private static convertToGTDData(declaration: {
    declarationType: string;
    declarationNumber: string | null;
    totalPackages: number | null;
    currency: string | null;
    incotermsCode: string | null;
    incotermsPlace: string | null;
    exporterName: string | null;
    exporterAddress: string | null;
    exporterTin: string | null;
    exporterCountryCode: string | null;
    consigneeName: string | null;
    consigneeAddress: string | null;
    consigneeTin: string | null;
    consigneeCountryCode: string | null;
    declarantName: string | null;
    declarantTin: string | null;
    dispatchCountryCode: string | null;
    destinationCountryCode: string | null;
    borderTransportMode: string | null;
    totalInvoiceAmount?: number | null;
    exchangeRate?: number | null;
    transactionNatureCode?: string | null;
    transportCosts?: number | null;
    insuranceCosts?: number | null;
    items: Array<{
      itemNumber: number;
      hsCode: string | null;
      goodsDescription: string | null;
      originCountryCode: string | null;
      grossWeight: number | null;
      netWeight: number | null;
      quantity: number | null;
      unitCode: string | null;
      invoiceValue: number | null;
      customsValue: number | null;
      statisticalValue: number | null;
      procedureCode: string | null;
      packageType: string | null;
      packageQuantity: number | null;
    }>;
  }): Partial<GTDData> {
    return {
      declarationType: declaration.declarationType || 'IMPORT',
      totalPackages: declaration.totalPackages || 0,
      currency: declaration.currency || 'USD',
      incotermsCode: declaration.incotermsCode || 'DAP',
      incotermsPlace: declaration.incotermsPlace || '',
      exporter: {
        name: declaration.exporterName || '',
        address: declaration.exporterAddress || '',
        tin: declaration.exporterTin || '',
        countryCode: declaration.exporterCountryCode || '',
      },
      consignee: {
        name: declaration.consigneeName || '',
        address: declaration.consigneeAddress || '',
        tin: declaration.consigneeTin || '',
        countryCode: declaration.consigneeCountryCode || '',
      },
      declarant: {
        name: declaration.declarantName || '',
        tin: declaration.declarantTin || '',
        status: 'DECLARANT',
      },
      dispatchCountryCode: declaration.dispatchCountryCode || '',
      destinationCountryCode: declaration.destinationCountryCode || 'UZ',
      borderTransportMode: declaration.borderTransportMode || '30',
      totalInvoiceAmount: declaration.totalInvoiceAmount || 0,
      exchangeRate: declaration.exchangeRate || 1,
      transactionNatureCode: declaration.transactionNatureCode || '11',
      transportCosts: declaration.transportCosts || 0,
      insuranceCosts: declaration.insuranceCosts || 0,
      items: declaration.items.map((item): GTDItem => ({
        itemNumber: item.itemNumber,
        hsCode: item.hsCode || '',
        description: item.goodsDescription || '',
        originCountryCode: item.originCountryCode || '',
        grossWeight: item.grossWeight || 0,
        netWeight: item.netWeight || 0,
        quantity: item.quantity || 0,
        unitCode: item.unitCode || '',
        invoiceValue: item.invoiceValue || 0,
        customsValue: item.customsValue || 0,
        statisticalValue: item.statisticalValue || 0,
        procedureCode: item.procedureCode || '',
        packageType: item.packageType || '',
        packageQuantity: item.packageQuantity || 1,
      })),
    };
  }

  /**
   * Валидация декларации без генерации PDF
   */
  static async validateDeclaration(declarationId: string): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    corrections: CorrectionLog[];
  }> {
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
      },
    });

    if (!declaration) {
      throw new Error('Декларация не найдена');
    }

    const gtdData = this.convertToGTDData(declaration as Parameters<typeof this.convertToGTDData>[0]);
    const validator = new GTDValidator(gtdData as GTDData);
    return validator.validate();
  }

  /**
   * Generate PDF using Puppeteer
   */
  private static async generateWithPuppeteer(html: string): Promise<Buffer> {
    // Dynamic import to avoid errors if not installed
    const puppeteer = await import('puppeteer').catch(() => null);
    
    if (!puppeteer) {
      throw new Error('Puppeteer not installed');
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        displayHeaderFooter: false,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML preview for a declaration
   */
  static async generateDeclarationHTML(declarationId: string): Promise<string> {
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
        organization: true,
      },
    });

    if (!declaration) {
      throw new Error('Декларация не найдена');
    }

    const templateData: GTDTemplateData = {
      declaration,
      items: declaration.items,
      organization: declaration.organization,
    };

    return generateGTDHTML(templateData);
  }

  /**
   * Get filename for PDF
   */
  static getFilename(declarationNumber: string | null): string {
    const number = declarationNumber || 'DRAFT';
    const date = new Date().toISOString().split('T')[0];
    return `GTD-${number}-${date}.pdf`;
  }
}
