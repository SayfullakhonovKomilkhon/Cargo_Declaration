'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  declarationBlocks1To20Schema,
  declarationDraftSchema,
  defaultDeclarationFormValues,
  type DeclarationBlocks1To20FormData,
} from '../schemas';
import {
  saveDraft,
  saveAndValidateBlocks1To20,
  updateDeclaration,
  getDeclarationForEdit,
} from '../actions';

interface UseDeclarationFormOptions {
  declarationId?: string;
  onSuccess?: (id: string) => void;
  autoSaveInterval?: number; // В миллисекундах, по умолчанию 30000 (30 сек)
  enableAutoSave?: boolean;
}

interface UseDeclarationFormReturn {
  form: ReturnType<typeof useForm<DeclarationBlocks1To20FormData>>;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  declarationId: string | null;
  handleSaveDraft: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

export function useDeclarationForm({
  declarationId: initialDeclarationId,
  onSuccess,
  autoSaveInterval = 30000,
  enableAutoSave = true,
}: UseDeclarationFormOptions = {}): UseDeclarationFormReturn {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(!!initialDeclarationId);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [declarationId, setDeclarationId] = React.useState<string | null>(
    initialDeclarationId || null
  );

  // Инициализация формы
  const form = useForm<DeclarationBlocks1To20FormData>({
    resolver: zodResolver(declarationBlocks1To20Schema),
    defaultValues: defaultDeclarationFormValues,
    mode: 'onBlur', // Валидация при потере фокуса
  });

  // Загрузка данных существующей декларации
  React.useEffect(() => {
    async function loadDeclaration() {
      if (!initialDeclarationId) return;

      setIsLoading(true);

      try {
        const result = await getDeclarationForEdit(initialDeclarationId);

        if (result.success && result.data) {
          // Преобразуем данные и заполняем форму
          const formData = {
            ...defaultDeclarationFormValues,
            ...result.data,
          } as DeclarationBlocks1To20FormData;

          form.reset(formData);
          setDeclarationId(initialDeclarationId);
        } else {
          toast.error(result.error || 'Ошибка загрузки декларации');
          router.push('/declarations');
        }
      } catch (error) {
        console.error('Error loading declaration:', error);
        toast.error('Ошибка загрузки декларации');
      } finally {
        setIsLoading(false);
      }
    }

    loadDeclaration();
  }, [initialDeclarationId, form, router]);

  // Автосохранение
  React.useEffect(() => {
    if (!enableAutoSave) return;

    const subscription = form.watch(() => {
      // Только помечаем что есть изменения
    });

    const intervalId = setInterval(async () => {
      // Проверяем есть ли изменения и нет ли ошибок
      const isDirty = form.formState.isDirty;
      const hasErrors = Object.keys(form.formState.errors).length > 0;

      if (isDirty && !hasErrors && !isSaving) {
        await handleAutoSave();
      }
    }, autoSaveInterval);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [enableAutoSave, autoSaveInterval, form, isSaving]);

  // Автосохранение черновика
  const handleAutoSave = React.useCallback(async () => {
    const values = form.getValues();

    // Используем схему для черновика (менее строгая)
    const draftData = declarationDraftSchema.safeParse(values);

    if (!draftData.success) return;

    setIsSaving(true);

    try {
      let result;

      if (declarationId) {
        result = await updateDeclaration(declarationId, draftData.data);
      } else {
        result = await saveDraft(draftData.data);
      }

      if (result.success && result.data) {
        setLastSaved(new Date());

        if (!declarationId && result.data.id) {
          setDeclarationId(result.data.id);
          // Обновляем URL без перезагрузки
          window.history.replaceState(null, '', `/declarations/${result.data.id}/edit`);
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [form, declarationId]);

  // Ручное сохранение черновика
  const handleSaveDraft = React.useCallback(async () => {
    const values = form.getValues();
    const draftData = declarationDraftSchema.safeParse(values);

    if (!draftData.success) {
      toast.error('Проверьте введенные данные');
      return;
    }

    setIsSaving(true);

    try {
      let result;

      if (declarationId) {
        result = await updateDeclaration(declarationId, draftData.data);
      } else {
        result = await saveDraft(draftData.data);
      }

      if (result.success && result.data) {
        setLastSaved(new Date());
        toast.success('Черновик сохранен');

        if (!declarationId && result.data.id) {
          setDeclarationId(result.data.id);
          window.history.replaceState(null, '', `/declarations/${result.data.id}/edit`);
        }
      } else {
        toast.error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Ошибка сохранения черновика');
    } finally {
      setIsSaving(false);
    }
  }, [form, declarationId]);

  // Сохранение с полной валидацией и переход к следующему шагу
  const handleSubmit = React.useCallback(async () => {
    // Триггерим валидацию всей формы
    const isValid = await form.trigger();

    if (!isValid) {
      // Фокус на первой ошибке
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError as keyof DeclarationBlocks1To20FormData);
      }
      toast.error('Проверьте заполнение всех обязательных полей');
      return;
    }

    const values = form.getValues();

    setIsSaving(true);

    try {
      const result = await saveAndValidateBlocks1To20(declarationId, values);

      if (result.success && result.data) {
        setDeclarationId(result.data.id);
        toast.success('Данные сохранены');

        if (onSuccess) {
          onSuccess(result.data.id);
        } else {
          // Переход к следующей секции блоков
          router.push(`/declarations/${result.data.id}/blocks-21-40` as never);
        }
      } else {
        toast.error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Ошибка сохранения данных');
    } finally {
      setIsSaving(false);
    }
  }, [form, declarationId, onSuccess, router]);

  return {
    form,
    isLoading,
    isSaving,
    lastSaved,
    declarationId,
    handleSaveDraft,
    handleSubmit,
  };
}
