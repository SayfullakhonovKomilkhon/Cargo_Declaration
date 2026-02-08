'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Save, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';

import { GTDOfficialForm } from './gtd-official-form';
import { declarationDraftSchema, defaultDeclarationFormValues } from '../schemas';
import type { DeclarationDraftFormData } from '../schemas';
import { saveDraft } from '../actions';

/**
 * Пустая бланковая форма ГТД для заполнения вручную
 * Показывает форму в виде официального бланка без предзаполненных данных
 */
export function BlankDeclarationForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Инициализация формы с пустыми значениями
  const form = useForm<DeclarationDraftFormData>({
    resolver: zodResolver(declarationDraftSchema),
    defaultValues: {
      ...defaultDeclarationFormValues,
      // Очищаем все поля для пустой формы
      declarationType: undefined, // Тип декларации пустой (IMPORT/EXPORT/TRANSIT)
      declarationTypeCode: '', // Код режима пустой (40, 10, 80...)
      declarationSubCode: '', // Подкод пустой
      exporterName: '',
      exporterAddress: '',
      exporterTIN: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneeTIN: '',
      financialPartyName: '',
      financialPartyAddress: '',
      financialPartyTIN: '',
      declarantName: '',
      declarantAddress: '',
      currency: '',
      totalInvoiceValue: undefined,
      exchangeRate: undefined,
      usdRate: undefined,
      destinationCountry: '',
      destinationCountryCode: '',
      tradingCountry: '',
      tradingCountryCode: '',
      borderTransportType: '',
      borderTransportId: '',
      borderTransportCountry: '',
      internalTransportType: '',
      internalTransportId: '',
      deliveryTerms: '',
      deliveryPlace: '',
      containerIndicator: '0',
      borderCustomsOffice: '',
      goodsLocation: '',
      items: [
        {
          itemNumber: 1,
          description: '',
          hsCode: '',
          originCountry: '',
          grossWeight: undefined,
          netWeight: undefined,
          quantity: undefined,
          unitCode: '',
          invoiceValue: undefined,
          customsValue: undefined,
          statisticalValue: undefined,
          packages: undefined,
          packageType: '',
          procedureCode: '',
          previousProcedureCode: '',
          preferenceCode: '',
          transactionNature: '',
          quota: '',
        },
      ],
    },
    mode: 'onChange',
  });

  // Расчёт прогресса заполнения
  const watchedValues = form.watch();
  const calculateProgress = React.useCallback(() => {
    const requiredFields = [
      'exporterName',
      'consigneeName',
      'declarationType',
      'currency',
      'destinationCountry',
    ];
    
    let filled = 0;
    requiredFields.forEach(field => {
      const value = watchedValues[field as keyof typeof watchedValues];
      if (value && String(value).trim()) {
        filled++;
      }
    });
    
    // Проверяем товары
    if (watchedValues.items?.length > 0) {
      const item = watchedValues.items[0];
      if (item?.description) filled++;
      if (item?.hsCode) filled++;
    }
    
    return Math.round((filled / 7) * 100);
  }, [watchedValues]);

  const progress = calculateProgress();

  // Сохранение черновика
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const data = form.getValues();
      const result = await saveDraft(data);
      
      if (result.success && result.declaration) {
        toast.success('Черновик сохранён');
        router.push(`/declarations/${result.declaration.id}/edit`);
      } else {
        toast.error(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения черновика');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header с прогрессом и кнопками */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Прогресс заполнения</span>
              <Progress value={progress} className="w-32 h-2" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Сохранение...' : 'Сохранить черновик'}
            </Button>
            <Button
              size="sm"
              disabled={progress < 50}
            >
              <Send className="h-4 w-4 mr-2" />
              Отправить
            </Button>
          </div>
        </div>
      </div>

      {/* Форма ГТД на всю ширину */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 p-2">
        <Form {...form}>
          <form className="w-full">
            <GTDOfficialForm 
              form={form} 
              showErrors={true}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
