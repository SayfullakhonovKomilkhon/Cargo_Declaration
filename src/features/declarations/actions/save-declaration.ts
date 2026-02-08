'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import {
  declarationDraftSchema,
  type DeclarationDraftFormData,
  type DeclarationBlocks1To20FormData,
} from '../schemas';

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Сохранение черновика декларации (без полной валидации)
 */
export async function saveDraft(
  formData: DeclarationDraftFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Получаем текущего пользователя
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Необходима авторизация',
      };
    }

    // Минимальная валидация для черновика
    const validatedData = declarationDraftSchema.safeParse(formData);

    if (!validatedData.success) {
      return {
        success: false,
        error: 'Ошибка валидации данных',
      };
    }

    const data = validatedData.data;

    // Создаем или обновляем декларацию
    const declaration = await prisma.declaration.create({
      data: {
        userId: session.user.id,
        organizationId: session.user.organizationId || null,
        status: 'DRAFT',
        type: data.declarationType || 'IMPORT',

        // Блок 2: Экспортер
        exporterName: data.exporterName || null,
        exporterAddress: data.exporterAddress || null,
        exporterCountryCode: data.exporterCountry || null,

        // Блок 4: Справочный номер
        referenceNumber: data.referenceNumber || null,

        // Блок 5: Количество мест
        totalPackages: data.totalPackages || null,

        // Блок 7: Внутренний номер
        // internalReference не в схеме БД, можно добавить в additionalInfo

        // Блок 8: Грузополучатель
        consigneeName: data.consigneeName || null,
        consigneeAddress: data.consigneeAddress || null,
        consigneeInn: data.consigneeTin || null,
        consigneeCountryCode: data.consigneeCountry || null,

        // Блок 9: Ответственное лицо
        financialResponsible: data.responsiblePerson || null,

        // Блок 10, 17: Страна назначения
        destinationCountryCode: data.destinationCountry || data.transitDestinationCountry || null,

        // Блок 11: Торговая страна
        tradingCountryCode: data.tradingCountry || null,

        // Блок 12: Таможенная стоимость
        totalCustomsValue: data.totalCustomsValue || null,

        // Блок 14: Декларант
        declarantName: data.declarantName || null,
        declarantInn: data.declarantTin || null,
        declarantAddress: data.declarantAddress || null,
        declarantStatus:
          data.declarantStatus === 'DECLARANT'
            ? '1'
            : data.declarantStatus === 'REPRESENTATIVE'
              ? '2'
              : null,

        // Блок 15: Страна отправления
        departureCountryCode: data.dispatchCountry || null,
        departureCountryName: data.dispatchRegion || null,

        // Блок 16: Страна происхождения
        originCountryCode: data.originCountry || null,

        // Блок 18: Транспорт
        departureTransportCountry: data.transportNationality || null,
        departureTransportNumber: data.transportNumber || null,

        // Блок 19: Контейнеры
        containerNumbers: data.containerNumbers || [],
        containerIndicator: data.containerNumbers && data.containerNumbers.length > 0 ? '1' : '0',

        // Блок 20: Условия поставки
        deliveryTermsCode: data.incoterms || null,
        deliveryTermsPlace: data.deliveryPlace || null,

        // Блок 22: Валюта
        invoiceCurrencyCode: data.currency || null,

        // Блок 44: Дополнительная информация
        additionalInfo: data.additionalInfo || null,
      },
    });

    // Создаем запись в аудит логе
    await prisma.auditLog.create({
      data: {
        declarationId: declaration.id,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Declaration',
        entityId: declaration.id,
        changes: {
          status: 'DRAFT',
          formData: data,
        },
      },
    });

    // Обновляем кеш страницы
    revalidatePath('/declarations');
    revalidatePath(`/declarations/${declaration.id}`);

    return {
      success: true,
      data: { id: declaration.id },
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: 'Ошибка сохранения черновика',
    };
  }
}

/**
 * Обновление существующей декларации
 */
export async function updateDeclaration(
  declarationId: string,
  formData: DeclarationDraftFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Получаем текущего пользователя
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Необходима авторизация',
      };
    }

    // Проверяем что декларация существует и принадлежит пользователю
    const existingDeclaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      select: {
        id: true,
        userId: true,
        status: true,
        organizationId: true,
      },
    });

    if (!existingDeclaration) {
      return {
        success: false,
        error: 'Декларация не найдена',
      };
    }

    // Проверяем права доступа
    const isOwner = existingDeclaration.userId === session.user.id;
    const isSameOrg =
      existingDeclaration.organizationId &&
      existingDeclaration.organizationId === session.user.organizationId;

    if (!isOwner && !isSameOrg) {
      return {
        success: false,
        error: 'Нет доступа к этой декларации',
      };
    }

    // Проверяем статус (можно редактировать только черновики и в процессе)
    if (!['DRAFT', 'IN_PROGRESS'].includes(existingDeclaration.status)) {
      return {
        success: false,
        error: 'Невозможно редактировать декларацию в текущем статусе',
      };
    }

    // Валидация данных
    const validatedData = declarationDraftSchema.safeParse(formData);

    if (!validatedData.success) {
      return {
        success: false,
        error: 'Ошибка валидации данных',
      };
    }

    const data = validatedData.data;

    // Обновляем декларацию
    const updatedDeclaration = await prisma.declaration.update({
      where: { id: declarationId },
      data: {
        type: data.declarationType || undefined,

        // Блок 2: Экспортер
        exporterName: data.exporterName,
        exporterAddress: data.exporterAddress,
        exporterCountryCode: data.exporterCountry,

        // Блок 4: Справочный номер
        referenceNumber: data.referenceNumber,

        // Блок 5: Количество мест
        totalPackages: data.totalPackages,

        // Блок 8: Грузополучатель
        consigneeName: data.consigneeName,
        consigneeAddress: data.consigneeAddress,
        consigneeInn: data.consigneeTin,
        consigneeCountryCode: data.consigneeCountry,

        // Блок 9: Ответственное лицо
        financialResponsible: data.responsiblePerson,

        // Блок 10, 17: Страна назначения
        destinationCountryCode: data.destinationCountry || data.transitDestinationCountry,

        // Блок 11: Торговая страна
        tradingCountryCode: data.tradingCountry,

        // Блок 12: Таможенная стоимость
        totalCustomsValue: data.totalCustomsValue,

        // Блок 14: Декларант
        declarantName: data.declarantName,
        declarantInn: data.declarantTin,
        declarantAddress: data.declarantAddress,
        declarantStatus:
          data.declarantStatus === 'DECLARANT'
            ? '1'
            : data.declarantStatus === 'REPRESENTATIVE'
              ? '2'
              : null,

        // Блок 15: Страна отправления
        departureCountryCode: data.dispatchCountry,
        departureCountryName: data.dispatchRegion,

        // Блок 16: Страна происхождения
        originCountryCode: data.originCountry,

        // Блок 18: Транспорт
        departureTransportCountry: data.transportNationality,
        departureTransportNumber: data.transportNumber,

        // Блок 19: Контейнеры
        containerNumbers: data.containerNumbers || [],
        containerIndicator: data.containerNumbers && data.containerNumbers.length > 0 ? '1' : '0',

        // Блок 20: Условия поставки
        deliveryTermsCode: data.incoterms,
        deliveryTermsPlace: data.deliveryPlace,

        // Блок 22: Валюта
        invoiceCurrencyCode: data.currency,

        // Блок 44: Дополнительная информация
        additionalInfo: data.additionalInfo,
      },
    });

    // Создаем запись в аудит логе
    await prisma.auditLog.create({
      data: {
        declarationId: updatedDeclaration.id,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Declaration',
        entityId: updatedDeclaration.id,
        changes: {
          formData: data,
        },
      },
    });

    // Обновляем кеш страницы
    revalidatePath('/declarations');
    revalidatePath(`/declarations/${declarationId}`);

    return {
      success: true,
      data: { id: updatedDeclaration.id },
    };
  } catch (error) {
    console.error('Error updating declaration:', error);
    return {
      success: false,
      error: 'Ошибка обновления декларации',
    };
  }
}

/**
 * Валидация и сохранение блоков 1-20 (с полной валидацией)
 */
export async function saveAndValidateBlocks1To20(
  declarationId: string | null,
  formData: DeclarationBlocks1To20FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Получаем текущего пользователя
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Необходима авторизация',
      };
    }

    // Конвертируем полные данные в формат черновика для сохранения
    const draftData: DeclarationDraftFormData = {
      ...formData,
    };

    // Если есть ID - обновляем, иначе создаем
    if (declarationId) {
      const result = await updateDeclaration(declarationId, draftData);

      if (result.success) {
        // Обновляем статус на IN_PROGRESS
        await prisma.declaration.update({
          where: { id: declarationId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return result;
    } else {
      const result = await saveDraft(draftData);

      if (result.success && result.data) {
        // Обновляем статус на IN_PROGRESS
        await prisma.declaration.update({
          where: { id: result.data.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return result;
    }
  } catch (error) {
    console.error('Error saving blocks 1-20:', error);
    return {
      success: false,
      error: 'Ошибка сохранения данных',
    };
  }
}

/**
 * Получение декларации по ID для редактирования
 */
export async function getDeclarationForEdit(
  declarationId: string
): Promise<ActionResult<DeclarationDraftFormData>> {
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
      declaration.organizationId &&
      declaration.organizationId === session.user.organizationId;

    if (!isOwner && !isSameOrg) {
      return {
        success: false,
        error: 'Нет доступа к этой декларации',
      };
    }

    // Преобразуем данные из БД в формат формы
    const formData: DeclarationDraftFormData = {
      declarationType: declaration.type,
      exporterName: declaration.exporterName || undefined,
      exporterAddress: declaration.exporterAddress || undefined,
      exporterCountry: declaration.exporterCountryCode || undefined,
      referenceNumber: declaration.referenceNumber || undefined,
      totalPackages: declaration.totalPackages || undefined,
      consigneeName: declaration.consigneeName || undefined,
      consigneeAddress: declaration.consigneeAddress || undefined,
      consigneeTin: declaration.consigneeInn || undefined,
      consigneeCountry: declaration.consigneeCountryCode || undefined,
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
    };

    return {
      success: true,
      data: formData,
    };
  } catch (error) {
    console.error('Error getting declaration:', error);
    return {
      success: false,
      error: 'Ошибка загрузки декларации',
    };
  }
}
