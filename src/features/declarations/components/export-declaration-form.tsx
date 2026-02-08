'use client';

/**
 * Форма ГТД для режима ЭКСПОРТ (код 10)
 * Согласно Инструкции ГТК РУз №2773
 */

import { useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import {
  exportDeclarationDraftSchema,
  defaultExportDeclarationValues,
  type ExportDeclarationDraft,
} from '../schemas/export-10.schema';

import {
  TRANSPORT_TYPES,
  INCOTERMS,
  PAYMENT_FORMS,
  SHIPPING_FORMS,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  EXPORT_DOCUMENT_TYPES,
  PACKAGE_TYPES,
  PRODUCTION_METHODS,
  PERSON_STATUS_CODES,
  PERSON_TYPES,
  GRAPH2_SCENARIOS,
} from '../constants/export-constants';

import {
  validateExportDeclaration,
  checkRequiredFields,
  calculateCompleteness,
  type ValidationResult,
} from '../utils/export-validator';

import {
  autofillExportDeclaration,
  copyExporterToDeclarant,
  copyExporterToFinancial,
  copyExporterToPayer,
  type AutofillContext,
} from '../utils/export-autofill';

// ===========================================
// ТИПЫ
// ===========================================

interface ExportDeclarationFormProps {
  initialData?: ExportDeclarationDraft;
  onSave?: (data: ExportDeclarationDraft) => Promise<void>;
  onSubmit?: (data: ExportDeclarationDraft) => Promise<void>;
  isLoading?: boolean;
}

// ===========================================
// КОМПОНЕНТ ФОРМЫ
// ===========================================

export function ExportDeclarationForm({
  initialData,
  onSave,
  onSubmit,
  isLoading = false,
}: ExportDeclarationFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // Инициализация формы
  const form = useForm<ExportDeclarationDraft>({
    resolver: zodResolver(exportDeclarationDraftSchema),
    defaultValues: initialData || defaultExportDeclarationValues,
    mode: 'onChange',
  });
  
  const { control, watch, setValue, getValues } = form;
  
  // Наблюдение за изменениями
  const watchedData = watch();
  
  // Расчёт процента заполненности
  const completeness = useMemo(() => {
    return calculateCompleteness(watchedData);
  }, [watchedData]);
  
  // Валидация
  const handleValidate = useCallback(() => {
    const data = getValues();
    const result = validateExportDeclaration(data);
    setValidationResult(result);
    
    if (result.isValid) {
      toast.success('Декларация заполнена корректно');
    } else {
      toast.error(`Найдено ${result.errors.length} ошибок`);
    }
  }, [getValues]);
  
  // Автозаполнение
  const handleAutofill = useCallback(() => {
    const context: AutofillContext = {
      usdExchangeRate: watchedData.usdExchangeRate || 12500,
      contractCurrencyRate: 1, // TODO: получить из API
      exchangeRateDate: new Date().toISOString().split('T')[0],
    };
    
    const autofilled = autofillExportDeclaration(watchedData, context);
    
    // Обновляем форму
    Object.entries(autofilled).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as keyof ExportDeclarationDraft, value);
      }
    });
    
    toast.success('Автозаполнение выполнено');
  }, [watchedData, setValue]);
  
  // Копирование данных экспортера
  const handleCopyExporter = useCallback((target: 'declarant' | 'financial' | 'payer') => {
    const data = getValues();
    let updated: ExportDeclarationDraft;
    
    switch (target) {
      case 'declarant':
        updated = copyExporterToDeclarant(data);
        break;
      case 'financial':
        updated = copyExporterToFinancial(data);
        break;
      case 'payer':
        updated = copyExporterToPayer(data);
        break;
    }
    
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && key !== 'graph2') {
        setValue(key as keyof ExportDeclarationDraft, value);
      }
    });
    
    toast.success('Данные скопированы');
  }, [getValues, setValue]);
  
  // Сохранение черновика
  const handleSaveDraft = useCallback(async () => {
    const data = getValues();
    if (onSave) {
      await onSave(data);
      toast.success('Черновик сохранён');
    }
  }, [getValues, onSave]);
  
  // Отправка декларации
  const handleSubmitDeclaration = useCallback(async () => {
    const data = getValues();
    const validation = validateExportDeclaration(data);
    
    if (!validation.isValid) {
      setValidationResult(validation);
      toast.error('Исправьте ошибки перед отправкой');
      return;
    }
    
    if (onSubmit) {
      await onSubmit(data);
      toast.success('Декларация отправлена');
    }
  }, [getValues, onSubmit]);
  
  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Шапка с прогрессом */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">ГТД — Экспорт (код 10)</CardTitle>
                <CardDescription>Режим: ЭК/10</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Заполнено</p>
                  <p className="text-2xl font-bold">{completeness}%</p>
                </div>
                <Progress value={completeness} className="w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleAutofill}>
                Автозаполнение
              </Button>
              <Button type="button" variant="outline" onClick={handleValidate}>
                Проверить
              </Button>
              <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={isLoading}>
                Сохранить черновик
              </Button>
              <Button type="button" onClick={handleSubmitDeclaration} disabled={isLoading}>
                Отправить
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Ошибки валидации */}
        {validationResult && !validationResult.isValid && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive">Ошибки валидации</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {validationResult.errors.map((error, i) => (
                  <li key={i} className="text-sm text-destructive">
                    {error.graphNumber && <Badge variant="outline" className="mr-2">Графа {error.graphNumber}</Badge>}
                    {error.message}
                  </li>
                ))}
              </ul>
              {validationResult.warnings.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-yellow-600">Предупреждения:</p>
                  <ul className="space-y-1 mt-1">
                    {validationResult.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-600">
                        {warning.graphNumber && <Badge variant="outline" className="mr-2">Графа {warning.graphNumber}</Badge>}
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Общие (1-14)</TabsTrigger>
            <TabsTrigger value="transport">Транспорт (17-30)</TabsTrigger>
            <TabsTrigger value="items">Товары (31-47)</TabsTrigger>
            <TabsTrigger value="payments">Платежи (47-49)</TabsTrigger>
            <TabsTrigger value="signature">Подпись (50-54)</TabsTrigger>
          </TabsList>
          
          {/* Вкладка: Общие сведения */}
          <TabsContent value="general" className="space-y-4">
            {/* Графа 1: Тип декларации */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 1 — Тип декларации</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="graph1.direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Направление</FormLabel>
                      <FormControl>
                        <Input {...field} value="ЭК" disabled />
                      </FormControl>
                      <FormDescription>Экспорт</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="graph1.regimeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Код режима</FormLabel>
                      <FormControl>
                        <Input {...field} value="10" disabled />
                      </FormControl>
                      <FormDescription>Экспорт</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="graph1.subCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Подкод</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Не заполняется" disabled />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 2: Экспортер/Грузоотправитель */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Графа 2 — Экспортер/Грузоотправитель</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyExporter('declarant')}
                    >
                      → Декларант
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyExporter('financial')}
                    >
                      → Графа 9
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Сценарий и тип лица экспортера */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph2.scenario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сценарий заполнения *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите сценарий" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRAPH2_SCENARIOS.map((scenario) => (
                              <SelectItem key={scenario.code} value={scenario.code}>
                                {scenario.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {GRAPH2_SCENARIOS.find(s => s.code === field.value)?.description}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph2.exporterPersonType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип лица экспортера *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PERSON_TYPES.map((type) => (
                              <SelectItem key={type.code} value={type.code}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Основные данные экспортера */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">
                    {watchedData.graph2?.scenario === 'different_persons' 
                      ? 'Экспортер (по поручению которого поставляется товар)' 
                      : 'Данные экспортера/отправителя'}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="graph2.exporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchedData.graph2?.exporterPersonType === 'individual' 
                              ? 'ФИО *' 
                              : 'Краткое наименование *'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={watchedData.graph2?.exporterPersonType === 'individual' 
                                ? 'Иванов Иван Иванович' 
                                : 'ООО «Компания»'} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graph2.exporterOkpo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Код ОКПО *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={watchedData.graph2?.exporterPersonType === 'individual' 
                                ? '00000001' 
                                : '12345678'} 
                              maxLength={8}
                            />
                          </FormControl>
                          <FormDescription>
                            {watchedData.graph2?.exporterPersonType === 'individual' 
                              ? '00000001 для физ. лиц' 
                              : '8 цифр или 99999999 (без ОКПО)'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {watchedData.graph2?.scenario !== 'different_persons' && (
                    <FormField
                      control={control}
                      name="graph2.exporterAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchedData.graph2?.exporterPersonType === 'individual' 
                              ? 'Адрес постоянного места жительства *' 
                              : 'Местонахождение (юридический адрес) *'}
                          </FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="г. Ташкент, ул. Примерная, дом 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {watchedData.graph2?.scenario !== 'different_persons' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="graph2.exporterPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder={watchedData.graph2?.exporterPersonType === 'individual' 
                                  ? '8-XXX-XXX-XX-XX' 
                                  : '+998XX-XXX-XX-XX'} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {watchedData.graph2?.exporterPersonType === 'legal_entity' && (
                        <FormField
                          control={control}
                          name="graph2.exporterEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (при наличии)</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="company@example.uz" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Паспортные данные для физ. лиц */}
                  {watchedData.graph2?.exporterPersonType === 'individual' && 
                   watchedData.graph2?.scenario === 'same_person' && (
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                      <FormField
                        control={control}
                        name="graph2.exporterPassport.series"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Серия паспорта *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="AA" maxLength={2} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.exporterPassport.number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер паспорта *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1234567" maxLength={7} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.exporterPassport.issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата выдачи *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.exporterPassport.issuedBy"
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Кем выдан *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ОВД г. Ташкента УВД Ташкентской области" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* ИНН и код района */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <FormField
                      control={control}
                      name="graph2.exporterInn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ИНН экспортера *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789" maxLength={9} />
                          </FormControl>
                          <FormDescription>
                            9 цифр (или 999999999 если отсутствует)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graph2.regionCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Код района *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1726273" maxLength={7} />
                          </FormControl>
                          <FormDescription>7 цифр (Приложение №15)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Данные структурного подразделения (для сценария subdivision) */}
                {watchedData.graph2?.scenario === 'subdivision' && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="font-medium">Данные головной организации (филиал)</h4>
                    
                    <FormField
                      control={control}
                      name="graph2.parentOrgName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Наименование головной организации *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ООО «Головная компания»" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="graph2.parentOrgAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Адрес головной организации *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="г. Ташкент, ул. Центральная, дом 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="graph2.parentOrgPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+998XX-XXX-XX-XX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.parentOrgEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (при наличии)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="head@company.uz" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Данные грузоотправителя (для сценария different_persons) */}
                {watchedData.graph2?.scenario === 'different_persons' && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="font-medium">Данные грузоотправителя</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="graph2.senderPersonType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип лица отправителя *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PERSON_TYPES.map((type) => (
                                  <SelectItem key={type.code} value={type.code}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.senderOkpo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Код ОКПО отправителя *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12345678" maxLength={8} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={control}
                      name="graph2.senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Наименование/ФИО отправителя *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ООО «Отправитель»" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="graph2.senderAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Адрес отправителя *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="г. Ташкент, ул. Примерная, дом 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="graph2.senderPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+998XX-XXX-XX-XX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="graph2.senderEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (при наличии)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="sender@example.uz" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={control}
                      name="graph2.senderInn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ИНН отправителя *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789" maxLength={9} />
                          </FormControl>
                          <FormDescription>
                            9 цифр (или 999999999 если отсутствует)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Итоговые значения для правого верхнего угла и нижней части */}
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-2">Итоговое заполнение графы 2</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Правый верхний угол (ОКПО):</span>
                      <p className="font-mono">
                        {watchedData.graph2?.exporterOkpo || '________'}
                        {watchedData.graph2?.scenario === 'different_persons' && (
                          <> / {watchedData.graph2?.senderOkpo || '________'}</>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Нижняя часть (ИНН):</span>
                      <p className="font-mono">
                        {watchedData.graph2?.exporterInn || '_________'}
                        {watchedData.graph2?.scenario === 'different_persons' && (
                          <> / {watchedData.graph2?.senderInn || '_________'}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Графа 7: Таможенный пост */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 7 — Регистрационный номер ГТД</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name="customsPostCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Код таможенного поста *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00001" maxLength={5} />
                      </FormControl>
                      <FormDescription>5-значный код (Приложение №4)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 8: Получатель */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 8 — Импортер/Грузополучатель</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph8.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Наименование / ФИО *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="LLC «Company»" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph8.countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код страны *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="RU" maxLength={2} />
                        </FormControl>
                        <FormDescription>ISO 2 буквы</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={control}
                  name="graph8.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Страна *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Россия" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="graph8.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="г. Москва, ул. Примерная, д. 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 14: Декларант */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 14 — Декларант / Таможенный брокер</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="isBroker"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Таможенный брокер</FormLabel>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="declarantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Наименование *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ООО «Декларант»" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="declarantInn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ИНН / ПИНФЛ *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789" maxLength={14} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={control}
                  name="declarantAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="г. Ташкент, ул. Примерная, дом 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Вкладка: Транспорт */}
          <TabsContent value="transport" className="space-y-4">
            {/* Графа 17: Страна назначения */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 17 — Страна назначения</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="graph17.countryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Наименование страны *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Россия" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="graph17.countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Код страны (графа 17а) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="643" maxLength={3} />
                      </FormControl>
                      <FormDescription>3 цифры</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 18: Транспорт при отправлении */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 18 — Транспорт при отправлении</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name="graph18.vehicleCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество ТС *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph18.transportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Вид транспорта *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRANSPORT_TYPES.map((t) => (
                              <SelectItem key={t.code} value={t.code}>
                                {t.code} — {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph18.vehicleCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код страны ТС *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="860" maxLength={3} />
                        </FormControl>
                        <FormDescription>860 = Узбекистан</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={control}
                  name="graph18.vehicleNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номера ТС *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="01A123BC; 01A456DE" />
                      </FormControl>
                      <FormDescription>Через точку с запятой для нескольких ТС</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 19: Контейнер */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 19 — Контейнер</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name="containerIndicator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Признак контейнера *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0 — Без контейнера</SelectItem>
                          <SelectItem value="1">1 — В контейнере</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 20: Условия поставки */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 20 — Условия поставки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph20.incotermsAlpha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterms *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INCOTERMS.filter(i => !i.deprecated).map((i) => (
                              <SelectItem key={i.code} value={i.alpha}>
                                {i.alpha} — {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph20.deliveryPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Географический пункт</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="г. Москва" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph20.paymentFormCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Форма расчётов *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_FORMS.map((p) => (
                              <SelectItem key={p.code} value={p.code}>
                                {p.code} — {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph20.shippingFormCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Форма отправки *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SHIPPING_FORMS.map((s) => (
                              <SelectItem key={s.code} value={s.code}>
                                {s.code} — {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Графа 29: Таможня на границе */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 29 — Таможня на границе</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="borderCustomsPostCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Код таможенного поста *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00001" maxLength={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="borderCustomsPostName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Наименование *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Таможенный пост «...»" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Графа 30: Местонахождение товаров */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 30 — Местонахождение товаров</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name="goodsLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Местонахождение</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Адрес склада или номер лицензии" />
                      </FormControl>
                      <FormDescription>Не заполняется для трубопровода/ЛЭП</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Вкладка: Товары */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Товарные позиции</CardTitle>
                  <Badge variant="outline">
                    Графа 5: {watchedData.items?.length || 0} товаров
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Добавьте товарные позиции с описанием, кодом ТН ВЭД, весом и стоимостью.
                  Каждый товар будет включать графы 31-47.
                </p>
                <Button type="button" variant="outline">
                  + Добавить товар
                </Button>
              </CardContent>
            </Card>
            
            {/* Здесь будет список товарных позиций */}
            {watchedData.items?.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">Товар №{index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Форма для товарной позиции */}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          {/* Вкладка: Платежи */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 47 — Исчисление таможенных платежей</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Платежи рассчитываются автоматически на основе товарных позиций.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Вкладка: Подпись */}
          <TabsContent value="signature" className="space-y-4">
            {/* Графа 50: Доверитель */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 50 — Доверитель</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="graph50.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО ответственного лица *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Иванов Иван Иванович" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph50.position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Директор" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph50.pinfl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ПИНФЛ *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345678901234" maxLength={14} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Графа 54: Место и дата */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа 54 — Место и дата</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="graph54.fillingPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Место заполнения ГТД *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="г. Ташкент" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="graph54.declarantFullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ФИО декларирующего лица *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Иванов Иван Иванович" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="graph54.declarantPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+998 90 123 45 67" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Графа С: ID контракта */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Графа «С» — ID контракта в ЕЭИС ВТО</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name="graphC.contractId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID контракта *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ID внешнеторгового контракта" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}

export default ExportDeclarationForm;
