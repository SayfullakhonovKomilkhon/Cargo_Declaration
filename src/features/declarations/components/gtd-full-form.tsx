'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, Save, Send, Clock, FileText, FileCode, Printer, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { GTDOfficialForm } from './gtd-official-form';
import {
  declarationDraftSchema,
  declarationBlocks21To30DraftSchema,
  declarationBlocks48To53DraftSchema,
  commodityItemDraftSchema,
  defaultDeclarationFormValues,
  defaultBlocks21To30Values,
  defaultBlocks48To53Values,
  defaultCommodityItemValues,
} from '../schemas';
import { saveFullDeclaration, getFullDeclarationForEdit } from '../actions';

// Объединенная схема для полной формы
const fullDeclarationSchema = z.object({
  ...declarationDraftSchema.shape,
  ...declarationBlocks21To30DraftSchema.shape,
  ...declarationBlocks48To53DraftSchema.shape,
  items: z.array(commodityItemDraftSchema).min(1, 'Добавьте хотя бы одну товарную позицию'),
});

type FullDeclarationFormData = z.infer<typeof fullDeclarationSchema>;

interface GTDFullFormProps {
  declarationId?: string;
  onSuccess?: (id: string) => void;
}

export function GTDFullForm({ declarationId, onSuccess }: GTDFullFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(!!declarationId);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  
  // Флаг для показа ошибок валидации (после попытки сохранения)
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  
  // Состояния для диалога предпросмотра
  const [showPreviewDialog, setShowPreviewDialog] = React.useState(false);
  const [savedDeclarationId, setSavedDeclarationId] = React.useState<string | null>(declarationId || null);
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = React.useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState<'pdf' | 'xml' | null>(null);

  // Состояние для отслеживания полей, заполненных ИИ
  const [aiFilledFields, setAIFilledFields] = React.useState<Set<string>>(new Set());

  const form = useForm<FullDeclarationFormData>({
    resolver: zodResolver(fullDeclarationSchema),
    defaultValues: {
      ...defaultDeclarationFormValues,
      ...defaultBlocks21To30Values,
      ...defaultBlocks48To53Values,
      items: [{ ...defaultCommodityItemValues, itemNumber: 1 }],
    } as FullDeclarationFormData,
    mode: 'onBlur',
  });

  // Обработчик когда пользователь редактирует AI-заполненное поле
  const handleAIFieldEdit = React.useCallback((fieldName: string) => {
    setAIFilledFields(prev => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
  }, []);

  // Функция для применения данных от ИИ и отслеживания заполненных полей
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const applyAIData = React.useCallback((data: Partial<FullDeclarationFormData> & { 
    _itemsToAdd?: unknown[]; 
    _extendedItems?: unknown[];
  }) => {
    const filledFields = new Set<string>();
    
    // Извлекаем специальные поля для товаров
    const { _itemsToAdd, _extendedItems, ...formFields } = data;
    
    // Применяем обычные поля формы
    Object.entries(formFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        form.setValue(key as keyof FullDeclarationFormData, value);
        filledFields.add(key);
      }
    });

    // Обрабатываем товары если есть
    if (_extendedItems && Array.isArray(_extendedItems) && _extendedItems.length > 0) {
      // Используем расширенные данные товаров (новый формат)
      const { normalizeItemData } = require('../utils/autofill-from-ai');
      const normalizedItems = _extendedItems.map((item, idx) => normalizeItemData(item, idx));
      
      // Получаем текущие товары
      const currentItems = form.getValues('items') || [];
      
      // Если есть только один пустой товар - заменяем
      if (currentItems.length === 1 && !currentItems[0]?.goodsDescription) {
        form.setValue('items', normalizedItems as FullDeclarationFormData['items']);
      } else {
        // Добавляем к существующим
        form.setValue('items', [...currentItems, ...normalizedItems] as FullDeclarationFormData['items']);
      }
      
      // Отмечаем поля товаров как заполненные ИИ
      normalizedItems.forEach((_: unknown, idx: number) => {
        filledFields.add(`items.${currentItems.length === 1 && !currentItems[0]?.goodsDescription ? idx : currentItems.length + idx}.goodsDescription`);
        filledFields.add(`items.${currentItems.length === 1 && !currentItems[0]?.goodsDescription ? idx : currentItems.length + idx}.hsCode`);
        filledFields.add(`items.${currentItems.length === 1 && !currentItems[0]?.goodsDescription ? idx : currentItems.length + idx}.itemPrice`);
      });
    } else if (_itemsToAdd && Array.isArray(_itemsToAdd) && _itemsToAdd.length > 0) {
      // Старый формат товаров
      const { normalizeItemData } = require('../utils/autofill-from-ai');
      const normalizedItems = _itemsToAdd.map((item, idx) => normalizeItemData(item, idx));
      
      const currentItems = form.getValues('items') || [];
      if (currentItems.length === 1 && !currentItems[0]?.goodsDescription) {
        form.setValue('items', normalizedItems as FullDeclarationFormData['items']);
      } else {
        form.setValue('items', [...currentItems, ...normalizedItems] as FullDeclarationFormData['items']);
      }
    }

    setAIFilledFields(prev => new Set([...prev, ...filledFields]));
  }, [form]);

  // Загрузка существующей декларации
  React.useEffect(() => {
    async function loadDeclaration() {
      if (!declarationId) return;
      setIsLoading(true);
      try {
        const result = await getFullDeclarationForEdit(declarationId);
        if (result.success && result.data) {
          const formData = {
            ...defaultDeclarationFormValues,
            ...defaultBlocks21To30Values,
            ...defaultBlocks48To53Values,
            ...result.data,
            items: result.data.items && result.data.items.length > 0
              ? result.data.items
              : [{ ...defaultCommodityItemValues, itemNumber: 1 }],
          };
          form.reset(formData as FullDeclarationFormData);
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
  }, [declarationId, form, router]);

  // Автосохранение каждые 30 секунд
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && !isSaving) {
        handleSaveDraft(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [form.formState.isDirty, isSaving]);

  // Прогресс заполнения
  const progress = React.useMemo(() => {
    const values = form.getValues();
    const keyFields = [
      'declarationType', 'exporterName', 'consigneeName', 'hsCode',
      'invoiceCurrency', 'totalInvoiceAmount', 'intendedCustomsOffice',
    ];
    let filled = 0;
    keyFields.forEach((field) => {
      const value = values[field as keyof typeof values];
      if (value !== undefined && value !== '' && value !== 0) filled++;
    });
    if (values.items?.length > 0) filled++;
    return Math.round((filled / (keyFields.length + 1)) * 100);
  }, [form.watch()]);

  const handleSaveDraft = async (silent = false) => {
    setIsSaving(true);
    try {
      const values = form.getValues();
      const result = await saveFullDeclaration(declarationId || null, values);
      if (result.success) {
        setLastSaved(new Date());
        if (!silent) toast.success('Черновик сохранен');
        if (!declarationId && result.data?.id) {
          router.replace(`/declarations/${result.data.id}/edit` as never);
        }
      } else {
        if (!silent) toast.error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (!silent) toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Включаем показ ошибок валидации
    setShowValidationErrors(true);
    
    // Проверяем обязательные поля вручную
    const values = form.getValues();
    const emptyFields: string[] = [];
    
    // Проверяем основные поля
    if (!values.exporterName?.trim()) emptyFields.push('Гр.2 Экспортер');
    if (!values.consigneeName?.trim()) emptyFields.push('Гр.8 Получатель');
    if (!values.declarationType) emptyFields.push('Гр.1 Тип декларации');
    if (!values.currency?.trim()) emptyFields.push('Гр.22 Валюта');
    
    // Проверяем каждый товар
    if (values.items && values.items.length > 0) {
      values.items.forEach((item: { description?: string; hsCode?: string }, idx: number) => {
        if (!item.description?.trim()) emptyFields.push(`Товар #${idx + 1}: Описание (гр.31)`);
        if (!item.hsCode?.trim()) emptyFields.push(`Товар #${idx + 1}: Код ТН ВЭД (гр.33)`);
      });
    }
    
    if (emptyFields.length > 0) {
      toast.error(`Заполните обязательные поля:\n• ${emptyFields.join('\n• ')}`, {
        duration: 6000,
        style: { whiteSpace: 'pre-line' },
      });
      
      // Прокручиваем к первому полю с ошибкой
      setTimeout(() => {
        const errorElement = document.querySelector('[class*="ring-red"], [class*="border-red"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return;
    }
    
    // Запускаем валидацию схемы
    const isValid = await form.trigger();
    if (!isValid) {
      // Собираем конкретные ошибки схемы
      const schemaErrors = form.formState.errors;
      const errorMessages: string[] = [];
      
      // Проходим по всем ошибкам
      const collectErrors = (obj: Record<string, unknown>, prefix = '') => {
        for (const key in obj) {
          const error = obj[key] as Record<string, unknown>;
          if (error && typeof error === 'object') {
            if ('message' in error && typeof error.message === 'string') {
              const fieldName = prefix ? `${prefix}.${key}` : key;
              errorMessages.push(`${fieldName}: ${error.message}`);
            } else {
              collectErrors(error, prefix ? `${prefix}.${key}` : key);
            }
          }
        }
      };
      collectErrors(schemaErrors as Record<string, unknown>);
      
      if (errorMessages.length > 0) {
        console.log('Schema validation errors:', errorMessages);
        toast.error(`Ошибки валидации:\n• ${errorMessages.slice(0, 5).join('\n• ')}`, {
          duration: 8000,
          style: { whiteSpace: 'pre-line' },
        });
      } else {
        toast.error('Проверьте правильность заполнения формы', { duration: 3000 });
      }
      return;
    }
    setIsSaving(true);
    try {
      const values = form.getValues();
      const result = await saveFullDeclaration(declarationId || null, values);
      if (result.success && result.data) {
        toast.success('Декларация сохранена');
        setSavedDeclarationId(result.data.id);
        
        // Загружаем предпросмотр и показываем диалог
        setShowPreviewDialog(true);
        loadPreview(result.data.id);
      } else {
        toast.error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Ошибка сохранения данных');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Загрузка предпросмотра (HTML метод - точная копия бумажной формы)
  const loadPreview = async (id: string) => {
    setIsLoadingPreview(true);
    // Очищаем старые данные
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewHtml(null);
    
    try {
      // Используем HTML метод для точного отображения формы ТД1/ТД2
      const response = await fetch(`/api/declarations/${id}/pdf?method=html`);
      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
          // HTML ответ - используем напрямую
          const html = await response.text();
          setPreviewHtml(html);
        } else if (contentType.includes('application/pdf')) {
          // PDF ответ - создаём URL для iframe
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPreviewPdfUrl(url);
        }
      } else {
        // Fallback на POST метод
        const htmlResponse = await fetch(`/api/declarations/${id}/pdf`, {
          method: 'POST',
        });
        if (htmlResponse.ok) {
          const data = await htmlResponse.json();
          setPreviewHtml(data.html);
        }
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  // Скачивание PDF (HTML метод с Puppeteer конвертацией)
  const handleDownloadPDF = async () => {
    if (!savedDeclarationId) return;
    setIsDownloading('pdf');
    try {
      // Используем HTML метод для точной копии формы
      const response = await fetch(`/api/declarations/${savedDeclarationId}/pdf?method=html`);
      if (!response.ok) throw new Error('Ошибка генерации PDF');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GTD-${savedDeclarationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF скачан');
    } catch (error) {
      toast.error('Ошибка скачивания PDF');
    } finally {
      setIsDownloading(null);
    }
  };
  
  // Скачивание XML
  const handleDownloadXML = async () => {
    if (!savedDeclarationId) return;
    setIsDownloading('xml');
    try {
      const response = await fetch(`/api/declarations/${savedDeclarationId}/xml`);
      if (!response.ok) throw new Error('Ошибка экспорта XML');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GTD-${savedDeclarationId}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('XML скачан');
    } catch (error) {
      toast.error('Ошибка экспорта XML');
    } finally {
      setIsDownloading(null);
    }
  };
  
  // Печать
  const handlePrint = () => {
    if (previewPdfUrl) {
      // Печать PDF
      const printWindow = window.open(previewPdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } else if (previewHtml) {
      // Печать HTML (fallback)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(previewHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    }
  };
  
  // Завершить и перейти к списку
  const handleFinish = () => {
    setShowPreviewDialog(false);
    if (onSuccess && savedDeclarationId) {
      onSuccess(savedDeclarationId);
    } else {
      router.push('/declarations');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-4">
        {/* Прогресс и время сохранения - вверху формы */}
        <div className="bg-background border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Прогресс заполнения</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Сохранено: {format(lastSaved, 'HH:mm', { locale: ru })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Контент формы - единая форма ГТД как на бумажном бланке */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600 rounded-lg overflow-hidden shadow-lg w-full">
          <GTDOfficialForm 
            form={form} 
            showErrors={showValidationErrors}
            aiFilledFields={aiFilledFields}
            onAIFieldEdit={handleAIFieldEdit}
          />
        </div>

        {/* Информация о заполненных ИИ полях */}
        {aiFilledFields.size > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <span className="px-2 py-0.5 bg-green-100 rounded text-xs font-medium">AI</span>
              <span>ИИ заполнил {aiFilledFields.size} полей из документов</span>
              <button 
                type="button"
                className="ml-auto text-green-600 hover:text-green-800 text-xs"
                onClick={() => setAIFilledFields(new Set())}
              >
                Сбросить отметки
              </button>
            </div>
          </div>
        )}

        {/* Кнопки действий - внизу формы */}
        <div className="bg-background border rounded-lg shadow-sm p-4 mt-6">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => handleSaveDraft(false)} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Сохранить черновик
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Сохранить декларацию
            </Button>
          </div>
        </div>
      </form>
      
      {/* Диалог предпросмотра после сохранения */}
      <Dialog open={showPreviewDialog} onOpenChange={(open) => {
        if (!open && previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }
        setShowPreviewDialog(open);
      }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Check className="h-6 w-6 text-green-500" />
              Декларация успешно сохранена!
            </DialogTitle>
            <DialogDescription>
              Проверьте данные декларации и выберите действие
            </DialogDescription>
          </DialogHeader>
          
          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-2 py-3 border-b shrink-0">
            <Button variant="outline" onClick={handlePrint} disabled={(!previewHtml && !previewPdfUrl) || isLoadingPreview}>
              <Printer className="h-4 w-4 mr-2" />
              Печать
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading === 'pdf'}>
              {isDownloading === 'pdf' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Скачать PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadXML} disabled={isDownloading === 'xml'}>
              {isDownloading === 'xml' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCode className="h-4 w-4 mr-2" />}
              Скачать XML
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setShowPreviewDialog(false)}>
              Продолжить редактирование
            </Button>
            <Button onClick={handleFinish}>
              <Check className="h-4 w-4 mr-2" />
              Завершить
            </Button>
          </div>
          
          {/* Предпросмотр */}
          <div className="flex-1 overflow-hidden border rounded-lg bg-gray-100">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Загрузка предпросмотра...</span>
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                style={{ minHeight: 'calc(95vh - 160px)' }}
                title="Предпросмотр ГТД (PDF)"
              />
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{ minHeight: 'calc(95vh - 160px)' }}
                title="Предпросмотр ГТД"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Не удалось загрузить предпросмотр
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

