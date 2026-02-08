'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import type { CommodityItemDraft, PreviousDocument } from '../schemas';

// Утилиты для обрезки данных до размеров колонок БД
function truncate(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}

function normalizeCode(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  // Только латинские буквы и цифры
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return cleaned.substring(0, maxLength) || null;
}

/**
 * Парсит ставку (rate) из строки в число
 * Поддерживает форматы: "12%", "0.5%", "12", "0.5", "4 БРВ"
 * Возвращает null если значение пустое или не парсится
 */
function parseRate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Если уже число
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  // Преобразуем в строку и убираем пробелы
  const str = String(value).trim();
  if (!str) return null;
  
  // Убираем символ % и другие нечисловые символы в конце
  const cleaned = str.replace(/[%\s]/g, '').replace(/[а-яА-ЯёЁa-zA-Z]+.*$/, '');
  
  // Заменяем запятую на точку для десятичных
  const normalized = cleaned.replace(',', '.');
  
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Нормализует код страны (2-буквенный ISO код)
 * Преобразует цифровые коды в ISO если возможно
 */
function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const cleaned = value.trim().toUpperCase();
  
  // Если уже 2-буквенный код
  if (/^[A-Z]{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Карта цифровых кодов → ISO
  const numericToIso: Record<string, string> = {
    '860': 'UZ', '398': 'KZ', '643': 'RU', '156': 'CN', '792': 'TR',
    '276': 'DE', '840': 'US', '417': 'KG', '762': 'TJ', '795': 'TM',
    '004': 'AF', '364': 'IR', '356': 'IN', '586': 'PK', '804': 'UA',
    '112': 'BY', '031': 'AZ', '268': 'GE', '051': 'AM', '498': 'MD',
    '428': 'LV', '440': 'LT', '233': 'EE', '616': 'PL', '380': 'IT',
    '250': 'FR', '724': 'ES', '826': 'GB', '392': 'JP', '410': 'KR',
    '784': 'AE', '682': 'SA', '528': 'NL', '056': 'BE', '040': 'AT',
    '756': 'CH', '000': null, // Неизвестно
  };
  
  // Пробуем преобразовать из цифрового кода
  const isoCode = numericToIso[cleaned];
  if (isoCode !== undefined) {
    return isoCode;
  }
  
  // Если 3 цифры но не в карте - возвращаем null
  if (/^\d{1,3}$/.test(cleaned)) {
    return null;
  }
  
  // Берём первые 2 буквы если есть
  const letters = cleaned.replace(/[^A-Z]/g, '');
  if (letters.length >= 2) {
    return letters.substring(0, 2);
  }
  
  return null;
}

/**
 * Преобразует тип декларации из любого формата в валидный enum
 * Поддерживает: русские сокращения (ИМ, ЭК, ТР), коды (10, 40, 80), и английские названия
 */
function normalizeDeclarationType(value: string | null | undefined): 'IMPORT' | 'EXPORT' | 'TRANSIT' {
  if (!value) return 'IMPORT';
  
  const normalized = value.trim().toUpperCase();
  
  // Русские сокращения → Enum
  const russianMap: Record<string, 'IMPORT' | 'EXPORT' | 'TRANSIT'> = {
    'ИМ': 'IMPORT',
    'ИМПОРТ': 'IMPORT',
    'ЭК': 'EXPORT',
    'ЭКСПОРТ': 'EXPORT',
    'ТР': 'TRANSIT',
    'ТРАНЗИТ': 'TRANSIT',
    'РИ': 'IMPORT',     // Реимпорт → Import
    'РЭ': 'EXPORT',     // Реэкспорт → Export
    'ВВ': 'IMPORT',     // Временный ввоз → Import
    'ВЭ': 'EXPORT',     // Временный вывоз → Export
    'ПВ': 'IMPORT',     // Переработка на территории → Import
    'ПЭ': 'EXPORT',     // Переработка вне территории → Export
    'ТС': 'IMPORT',     // Таможенный склад → Import
    'СТ': 'IMPORT',     // Свободная зона → Import
    'БТ': 'IMPORT',     // Беспошлинная торговля → Import
    'СВХ': 'IMPORT',    // Временное хранение → Import
    'ОГ': 'IMPORT',     // Отказ в пользу государства → Import
    'УН': 'IMPORT',     // Уничтожение → Import
    'ТТ': 'IMPORT',     // Свободный склад → Import
  };
  
  if (russianMap[normalized]) {
    return russianMap[normalized];
  }
  
  // Коды режимов → Enum
  const codeMap: Record<string, 'IMPORT' | 'EXPORT' | 'TRANSIT'> = {
    '10': 'EXPORT',
    '11': 'EXPORT',  // Реэкспорт
    '12': 'EXPORT',  // Временный вывоз
    '40': 'IMPORT',
    '41': 'IMPORT',  // Реимпорт
    '42': 'IMPORT',  // Временный ввоз
    '51': 'IMPORT',  // Переработка
    '61': 'EXPORT',  // Переработка
    '70': 'IMPORT',  // Временное хранение
    '71': 'IMPORT',  // СТЗ
    '72': 'IMPORT',  // БТ
    '73': 'IMPORT',  // Свободный склад
    '74': 'IMPORT',  // Таможенный склад
    '75': 'IMPORT',  // Отказ
    '76': 'IMPORT',  // Уничтожение
    '80': 'TRANSIT',
  };
  
  if (codeMap[normalized]) {
    return codeMap[normalized];
  }
  
  // Английские значения → как есть если валидны
  if (['IMPORT', 'EXPORT', 'TRANSIT'].includes(normalized)) {
    return normalized as 'IMPORT' | 'EXPORT' | 'TRANSIT';
  }
  
  // По умолчанию
  return 'IMPORT';
}

// Типы для полной формы декларации
interface FullDeclarationFormData {
  // Блоки 1-20
  declarationType?: string; // Может быть: IMPORT, EXPORT, TRANSIT, ИМ, ЭК, ТР, или код (10, 40, 80)
  exporterName?: string;
  exporterAddress?: string;
  exporterCountry?: string;
  exporterTin?: string;
  referenceNumber?: string;
  totalPackages?: number;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeTin?: string;
  consigneeCountry?: string;
  financialResponsibleName?: string;
  financialResponsibleAddress?: string;
  financialResponsibleTin?: string;
  responsiblePerson?: string;
  destinationCountry?: string;
  firstDestinationCountry?: string;
  tradingCountry?: string;
  totalCustomsValue?: number;
  currency?: string;
  declarantName?: string;
  declarantTin?: string;
  declarantAddress?: string;
  declarantStatus?: 'DECLARANT' | 'REPRESENTATIVE';
  dispatchCountry?: string;
  dispatchRegion?: string;
  originCountry?: string;
  transitDestinationCountry?: string;
  transportNationality?: string;
  transportNumber?: string;
  containerNumbers?: string[];
  incoterms?: string;
  deliveryPlace?: string;
  additionalInfo?: string;

  // Блоки 21-30
  borderTransportMode?: string;
  invoiceCurrency?: string;
  totalInvoiceAmount?: number;
  exchangeRate?: number;
  exchangeRateDate?: string;
  transactionNature?: string;
  transactionCurrencyCode?: string;
  borderTransportModeCode?: string;
  inlandTransportMode?: string;
  loadingUnloadingPlace?: string;
  bankingDetails?: string;
  customsOfficeCode?: string;
  goodsLocation?: string;
  goodsLocationCode?: string;
  previousDocuments?: PreviousDocument[];

  // Товарные позиции (блоки 31-47)
  items?: CommodityItemDraft[];
}

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Сохранение полной декларации с товарными позициями
 */
export async function saveFullDeclaration(
  declarationId: string | null,
  formData: FullDeclarationFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Debug: логируем входящие данные
    console.log('=== saveFullDeclaration DEBUG ===');
    console.log('declarationId:', declarationId);
    console.log('formData keys:', Object.keys(formData));
    console.log('formData.exporterName:', formData.exporterName);
    console.log('formData.consigneeName:', formData.consigneeName);
    console.log('formData.declarationType:', formData.declarationType);
    console.log('formData.totalInvoiceAmount:', formData.totalInvoiceAmount);
    console.log('formData.items count:', formData.items?.length || 0);
    console.log('=================================');

    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Необходима авторизация',
      };
    }

    // Используем транзакцию для атомарности с увеличенным таймаутом
    const result = await prisma.$transaction(async (tx) => {
      // Подготавливаем данные декларации с обрезкой до размеров колонок БД
      const declarationData = {
        userId: session.user.id,
        organizationId: session.user.organizationId || null,
        status: 'DRAFT' as const,
        type: normalizeDeclarationType(formData.declarationType),

        // Блок 2: Экспортер
        exporterName: truncate(formData.exporterName, 255),
        exporterAddress: truncate(formData.exporterAddress, 500),
        // exporterInn временно отключено - требуется prisma generate
        // exporterInn: truncate(formData.exporterTin?.replace(/\D/g, ''), 9),
        exporterCountryCode: normalizeCountryCode(formData.exporterCountry),

        // Блок 4: Справочный номер
        referenceNumber: truncate(formData.referenceNumber, 50),

        // Блок 5: Количество мест
        totalPackages: formData.totalPackages || null,

        // Блок 8: Грузополучатель
        consigneeName: truncate(formData.consigneeName, 255),
        consigneeAddress: truncate(formData.consigneeAddress, 500),
        consigneeInn: truncate(formData.consigneeTin?.replace(/\D/g, ''), 9),
        consigneeCountryCode: normalizeCountryCode(formData.consigneeCountry),

        // Блок 9: Ответственное лицо (объединяем имя и адрес)
        financialResponsible: truncate(
          formData.financialResponsibleName 
            ? `${formData.financialResponsibleName}${formData.financialResponsibleAddress ? ', ' + formData.financialResponsibleAddress : ''}${formData.financialResponsibleTin ? ' ИНН:' + formData.financialResponsibleTin : ''}`
            : formData.responsiblePerson, 
          500
        ),

        // Блок 10, 17: Страна назначения
        destinationCountryCode: normalizeCountryCode(
          formData.destinationCountry || formData.transitDestinationCountry
        ),

        // Блок 11: Торговая страна
        tradingCountryCode: normalizeCountryCode(formData.tradingCountry),

        // Блок 12: Таможенная стоимость
        totalCustomsValue: formData.totalCustomsValue || null,

        // Блок 13: Индикатор оффшора - требуется prisma generate && prisma db push
        // offshoreIndicator: formData.offshoreIndicator || '2',

        // Блок 14: Декларант
        declarantName: truncate(formData.declarantName, 255),
        declarantInn: truncate(formData.declarantTin?.replace(/\D/g, ''), 9),
        declarantAddress: truncate(formData.declarantAddress, 500),
        declarantStatus:
          formData.declarantStatus === 'DECLARANT'
            ? '1'
            : formData.declarantStatus === 'REPRESENTATIVE'
              ? '2'
              : null,

        // Блок 15: Страна отправления
        departureCountryCode: normalizeCountryCode(formData.dispatchCountry),
        departureCountryName: truncate(formData.dispatchRegion, 100),

        // Блок 16: Страна происхождения
        originCountryCode: normalizeCountryCode(formData.originCountry),

        // Блок 18: Транспорт при отправлении
        departureTransportCountry: normalizeCountryCode(formData.transportNationality),
        departureTransportNumber: truncate(formData.transportNumber, 50),

        // Блок 19: Контейнеры
        containerNumbers: formData.containerNumbers || [],
        containerIndicator:
          formData.containerNumbers && formData.containerNumbers.length > 0 ? '1' : '0',

        // Блок 20: Условия поставки
        deliveryTermsCode: normalizeCode(formData.incoterms, 3),
        deliveryTermsPlace: truncate(formData.deliveryPlace, 100),

        // Блок 21: Транспорт на границе
        borderTransportMode: normalizeCode(formData.borderTransportMode, 2),

        // Блок 22: Валюта счета
        invoiceCurrencyCode: normalizeCode(formData.invoiceCurrency || formData.currency, 3),
        totalInvoiceAmount: formData.totalInvoiceAmount || null,

        // Блок 23: Курс валюты
        exchangeRate: formData.exchangeRate || null,

        // Блок 24: Характер сделки
        transactionNatureCode: normalizeCode(formData.transactionNature, 3),
        // transactionCurrencyCode временно отключено - требуется: prisma generate && prisma db push
        // transactionCurrencyCode: normalizeCode(formData.transactionCurrencyCode, 3),

        // Блок 25: Вид транспорта на границе (код)
        borderTransportModeCode: normalizeCode(formData.borderTransportModeCode, 2),

        // Блок 26: Вид транспорта внутри страны
        inlandTransportModeCode: normalizeCode(formData.inlandTransportMode, 2),

        // Блок 27: Место погрузки/разгрузки
        loadingPlace: truncate(formData.loadingUnloadingPlace, 100),

        // Блок 29: Таможенный орган
        entryCustomsOffice: normalizeCode(formData.customsOfficeCode, 8),

        // Блок 30: Местонахождение товаров
        goodsLocation: truncate(formData.goodsLocation, 100),
        goodsLocationCode: normalizeCode(formData.goodsLocationCode, 20),

        // Блок 44: Дополнительная информация
        additionalInfo: truncate(formData.additionalInfo, 2000),
      };

      let declaration;

      if (declarationId) {
        // Проверяем существование и права доступа
        const existing = await tx.declaration.findUnique({
          where: { id: declarationId },
          select: { userId: true, organizationId: true, status: true },
        });

        if (!existing) {
          throw new Error('Декларация не найдена');
        }

        const isOwner = existing.userId === session.user.id;
        const isSameOrg =
          existing.organizationId && existing.organizationId === session.user.organizationId;

        if (!isOwner && !isSameOrg) {
          throw new Error('Нет доступа к этой декларации');
        }

        if (!['DRAFT', 'IN_PROGRESS'].includes(existing.status)) {
          throw new Error('Невозможно редактировать декларацию в текущем статусе');
        }

        // Обновляем декларацию
        declaration = await tx.declaration.update({
          where: { id: declarationId },
          data: {
            ...declarationData,
            userId: undefined, // Не меняем владельца
            organizationId: undefined, // Не меняем организацию
          },
        });

        // Удаляем старые товарные позиции
        await tx.declarationItem.deleteMany({
          where: { declarationId: declarationId },
        });
      } else {
        // Создаем новую декларацию
        declaration = await tx.declaration.create({
          data: declarationData,
        });
      }

      // Создаем товарные позиции с обрезкой значений
      if (formData.items && formData.items.length > 0) {
        const itemsData = formData.items.map((item, index) => ({
          declarationId: declaration.id,
          itemNumber: item.itemNumber || index + 1,
          goodsDescription: truncate(item.description || item.goodsDescription, 1000),
          marksAndNumbers: truncate(item.marksNumbers, 500),
          packagingType: truncate(item.packageType, 50),
          packagingQuantity: item.packageQuantity || null,
          hsCode: truncate(item.hsCode?.replace(/\D/g, ''), 10),
          hsCodeDescription: truncate(item.hsDescription, 500),
          originCountryCode: normalizeCountryCode(item.originCountryCode || item.originCountry),
          grossWeight: item.grossWeight || null,
          preferenceCode: truncate(item.preferenceCode, 10),
          procedureCode: truncate(item.procedureCode, 10),
          previousProcedureCode: truncate(item.previousProcedureCode, 10),
          netWeight: item.netWeight || null,
          quotaNumber: truncate(item.quotaNumber, 20),
          supplementaryUnit: truncate(item.supplementaryUnit, 10),
          supplementaryQuantity: item.supplementaryQuantity || null,
          itemPrice: item.itemPrice || null,
          itemCurrencyCode: normalizeCode(item.itemCurrencyCode || item.itemCurrency, 3),
          valuationMethodCode: truncate(item.valuationMethodCode, 5),
          additionalInfo: truncate(item.additionalInfo, 1000),
          documentCodes: item.documents?.map((d: { code: string; number: string; date: string }) => `${d.code}:${d.number}:${d.date}`) || [],
          customsValue: item.customsValue || null,
          statisticalValue: item.statisticalValue || null,
          dutyRate: parseRate(item.dutyRate),
          dutyAmount: item.dutyAmount || null,
          vatRate: parseRate(item.vatRate),
          vatAmount: item.vatAmount || null,
          exciseRate: parseRate(item.exciseRate),
          exciseAmount: item.exciseAmount || null,
          feeAmount: item.feeAmount || null,
          totalPayment: item.totalPayment || null,
        }));

        await tx.declarationItem.createMany({
          data: itemsData,
        });

        // Обновляем счетчик товаров в декларации
        await tx.declaration.update({
          where: { id: declaration.id },
          data: {
            totalItems: formData.items.length,
          },
        });
      }

      // Создаем запись в аудит логе
      await tx.auditLog.create({
        data: {
          declarationId: declaration.id,
          userId: session.user.id,
          action: declarationId ? 'UPDATE' : 'CREATE',
          entityType: 'Declaration',
          entityId: declaration.id,
          changes: {
            itemsCount: formData.items?.length || 0,
          },
        },
      });

      return declaration;
    }, {
      maxWait: 10000,  // Максимальное время ожидания начала транзакции (10 сек)
      timeout: 30000,  // Максимальное время выполнения транзакции (30 сек)
    });

    // Обновляем кеш
    revalidatePath('/declarations');
    revalidatePath(`/declarations/${result.id}`);

    return {
      success: true,
      data: { id: result.id },
    };
  } catch (error) {
    console.error('Error saving full declaration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка сохранения декларации',
    };
  }
}

/**
 * Получение полной декларации с товарами для редактирования
 */
export async function getFullDeclarationForEdit(
  declarationId: string
): Promise<ActionResult<FullDeclarationFormData>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Необходима авторизация',
      };
    }

    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
        },
      },
    });

    if (!declaration) {
      return {
        success: false,
        error: 'Декларация не найдена',
      };
    }

    // Проверяем права доступа
    const isOwner = declaration.userId === session.user.id;
    const isSameOrg =
      declaration.organizationId && declaration.organizationId === session.user.organizationId;

    if (!isOwner && !isSameOrg) {
      return {
        success: false,
        error: 'Нет доступа к этой декларации',
      };
    }

    // Преобразуем данные из БД в формат формы
    const formData: FullDeclarationFormData = {
      // Блоки 1-20
      declarationType: declaration.type,
      exporterName: declaration.exporterName || undefined,
      exporterAddress: declaration.exporterAddress || undefined,
      exporterCountry: declaration.exporterCountryCode || undefined,
      exporterTin: declaration.exporterInn || undefined,
      referenceNumber: declaration.referenceNumber || undefined,
      totalPackages: declaration.totalPackages || undefined,
      consigneeName: declaration.consigneeName || undefined,
      consigneeAddress: declaration.consigneeAddress || undefined,
      consigneeTin: declaration.consigneeInn || undefined,
      consigneeCountry: declaration.consigneeCountryCode || undefined,
      financialResponsibleName: declaration.financialResponsible?.split(',')[0]?.trim() || undefined,
      financialResponsibleAddress: declaration.financialResponsible?.split(',').slice(1).join(',')?.replace(/ИНН:\d+$/, '').trim() || undefined,
      financialResponsibleTin: declaration.financialResponsible?.match(/ИНН:(\d+)/)?.[1] || undefined,
      responsiblePerson: declaration.financialResponsible || undefined,
      destinationCountry: declaration.destinationCountryCode || undefined,
      tradingCountry: declaration.tradingCountryCode || undefined,
      totalCustomsValue: declaration.totalCustomsValue
        ? parseFloat(declaration.totalCustomsValue.toString())
        : undefined,
      currency: declaration.invoiceCurrencyCode || undefined,
      declarantName: declaration.declarantName || undefined,
      declarantTin: declaration.declarantInn || undefined,
      declarantAddress: declaration.declarantAddress || undefined,
      declarantStatus:
        declaration.declarantStatus === '1'
          ? 'DECLARANT'
          : declaration.declarantStatus === '2'
            ? 'REPRESENTATIVE'
            : undefined,
      dispatchCountry: declaration.departureCountryCode || undefined,
      dispatchRegion: declaration.departureCountryName || undefined,
      originCountry: declaration.originCountryCode || undefined,
      transportNationality: declaration.departureTransportCountry || undefined,
      transportNumber: declaration.departureTransportNumber || undefined,
      containerNumbers: declaration.containerNumbers || undefined,
      incoterms: declaration.deliveryTermsCode || undefined,
      deliveryPlace: declaration.deliveryTermsPlace || undefined,
      additionalInfo: declaration.additionalInfo || undefined,

      // Блоки 21-30
      borderTransportMode: declaration.borderTransportMode || undefined,
      invoiceCurrency: declaration.invoiceCurrencyCode || undefined,
      totalInvoiceAmount: declaration.totalInvoiceAmount
        ? parseFloat(declaration.totalInvoiceAmount.toString())
        : undefined,
      exchangeRate: declaration.exchangeRate
        ? parseFloat(declaration.exchangeRate.toString())
        : undefined,
      transactionNature: declaration.transactionNatureCode || undefined,
      // transactionCurrencyCode: declaration.transactionCurrencyCode || undefined,
      borderTransportModeCode: declaration.borderTransportModeCode || undefined,
      inlandTransportMode: declaration.inlandTransportModeCode || undefined,
      loadingUnloadingPlace: declaration.loadingPlace || undefined,
      customsOfficeCode: declaration.entryCustomsOffice || undefined,
      goodsLocation: declaration.goodsLocation || undefined,
      goodsLocationCode: declaration.goodsLocationCode || undefined,

      // Товарные позиции
      items: declaration.items.map((item) => ({
        id: item.id,
        itemNumber: item.itemNumber,
        description: item.goodsDescription || undefined,
        marksNumbers: item.marksAndNumbers || undefined,
        packageType: item.packagingType || undefined,
        packageQuantity: item.packagingQuantity || undefined,
        hsCode: item.hsCode || undefined,
        hsDescription: item.hsCodeDescription || undefined,
        originCountryCode: item.originCountryCode || undefined,
        grossWeight: item.grossWeight ? parseFloat(item.grossWeight.toString()) : undefined,
        preferenceCode: item.preferenceCode || undefined,
        procedureCode: item.procedureCode || undefined,
        previousProcedureCode: item.previousProcedureCode || undefined,
        netWeight: item.netWeight ? parseFloat(item.netWeight.toString()) : undefined,
        quotaNumber: item.quotaNumber || undefined,
        supplementaryUnit: item.supplementaryUnit || undefined,
        supplementaryQuantity: item.supplementaryQuantity
          ? parseFloat(item.supplementaryQuantity.toString())
          : undefined,
        itemPrice: item.itemPrice ? parseFloat(item.itemPrice.toString()) : undefined,
        itemCurrencyCode: item.itemCurrencyCode || undefined,
        valuationMethodCode: item.valuationMethodCode || undefined,
        additionalInfo: item.additionalInfo || undefined,
        documents: item.documentCodes?.map((code: string) => {
          const parts = code.split(':');
          return { code: parts[0] || '', number: parts[1] || '', date: parts[2] || '' };
        }) || [],
        customsValue: item.customsValue ? parseFloat(item.customsValue.toString()) : undefined,
        statisticalValue: item.statisticalValue
          ? parseFloat(item.statisticalValue.toString())
          : undefined,
        dutyRate: item.dutyRate ? `${parseFloat(item.dutyRate.toString())}%` : '0%',
        dutyAmount: item.dutyAmount ? parseFloat(item.dutyAmount.toString()) : 0,
        vatRate: item.vatRate ? `${parseFloat(item.vatRate.toString())}%` : '12%',
        vatAmount: item.vatAmount ? parseFloat(item.vatAmount.toString()) : 0,
        exciseRate: item.exciseRate ? `${parseFloat(item.exciseRate.toString())}%` : undefined,
        exciseAmount: item.exciseAmount ? parseFloat(item.exciseAmount.toString()) : undefined,
        feeAmount: item.feeAmount ? parseFloat(item.feeAmount.toString()) : undefined,
        totalPayment: item.totalPayment ? parseFloat(item.totalPayment.toString()) : undefined,
      })),
    };

    return {
      success: true,
      data: formData,
    };
  } catch (error) {
    console.error('Error getting full declaration:', error);
    return {
      success: false,
      error: 'Ошибка загрузки декларации',
    };
  }
}
