'use client';

import * as React from 'react';
import { Loader2, Save, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CountrySelect, CurrencySelect, IncotermsSelect, ModalSelect } from '@/shared/ui';

import { useDeclarationForm } from '../hooks/use-declaration-form';
import { ContainerInput } from './container-input';

// Стили для ячеек формы
const cellStyles = {
  base: 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900',
  header:
    'bg-slate-50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 px-1 py-0.5',
  input:
    'border-0 rounded-none h-full w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm',
  label:
    'absolute top-0 left-1 text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight',
  blockNumber:
    'absolute top-0 left-0.5 text-[8px] font-bold text-slate-400 dark:text-slate-500',
};

// Компонент для блока формы
interface FormBlockProps {
  blockNumber: number | string;
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

function FormBlock({ blockNumber, label, children, className, labelClassName }: FormBlockProps) {
  return (
    <div className={cn(cellStyles.base, 'relative', className)}>
      <div
        className={cn(
          'absolute top-0 left-0 right-0 px-1 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1',
          labelClassName
        )}
      >
        <span className="font-bold text-slate-600 dark:text-slate-300">{blockNumber}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="pt-5 h-full">{children}</div>
    </div>
  );
}

// Компонент для маленького блока без label
interface SmallBlockProps {
  blockNumber: number | string;
  label: string;
  children: React.ReactNode;
  className?: string;
}

function SmallBlock({ blockNumber, label, children, className }: SmallBlockProps) {
  return (
    <div className={cn(cellStyles.base, 'relative flex flex-col', className)}>
      <div className="px-1 py-0.5 text-[8px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 leading-tight">
        <span className="font-bold">{blockNumber}</span> {label}
      </div>
      <div className="flex-1 flex items-center justify-center p-1">{children}</div>
    </div>
  );
}

interface GTDPaperFormProps {
  declarationId?: string;
  onSuccess?: (id: string) => void;
}

export function GTDPaperForm({ declarationId, onSuccess }: GTDPaperFormProps) {
  const { form, isLoading, isSaving, lastSaved, handleSaveDraft, handleSubmit } =
    useDeclarationForm({
      declarationId,
      onSuccess,
      enableAutoSave: true,
    });

  const watchDeclarationType = form.watch('declarationType');

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
        {/* Индикатор автосохранения */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Сохранено: {format(lastSaved, 'HH:mm:ss', { locale: ru })}</span>
          </div>
        )}

        {/* ==========================================
            БУМАЖНАЯ ФОРМА ГТД - БЛОКИ 1-20
        ========================================== */}

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600 rounded-lg overflow-hidden shadow-lg">
          {/* Заголовок формы */}
          <div className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-400 dark:border-slate-600 p-2 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">ОСНОВНОЙ ЛИСТ</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">ТД 1</span>
            </div>
          </div>

          {/* Основная сетка формы */}
          <div className="p-2">
            {/* Верхняя часть: Блоки 1-7 */}
            <div className="grid grid-cols-12 gap-0">
              {/* Левая колонка: Блок 2 - Экспортер (занимает 5 колонок и 3 ряда) */}
              <div className="col-span-5 row-span-3">
                <FormBlock blockNumber="2" label="Экспортер/Грузоотправитель" className="h-full">
                  <div className="p-1 space-y-1 h-full flex flex-col">
                    <FormField
                      control={form.control}
                      name="exporterName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Наименование"
                              className={cellStyles.input}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exporterAddress"
                      render={({ field }) => (
                        <FormItem className="flex-[2]">
                          <FormControl>
                            <Textarea
                              placeholder="Адрес"
                              className={cn(cellStyles.input, 'min-h-0 h-full resize-none')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500">№</span>
                      <FormField
                        control={form.control}
                        name="exporterCountry"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Страна"
                                className="h-7 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </FormBlock>
              </div>

              {/* Правая верхняя часть */}
              <div className="col-span-7 grid grid-cols-7 gap-0">
                {/* Блок 1 - Тип декларации */}
                <div className="col-span-3">
                  <FormBlock blockNumber="1" label="Тип декларации" className="h-full">
                    <div className="p-1">
                      <FormField
                        control={form.control}
                        name="declarationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ModalSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={[
                                  { value: 'IMPORT', label: 'ИМ - Импорт' },
                                  { value: 'EXPORT', label: 'ЭК - Экспорт' },
                                  { value: 'TRANSIT', label: 'ТР - Транзит' },
                                ]}
                                placeholder="Тип"
                                dialogTitle="Выберите тип декларации"
                                className="text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormBlock>
                </div>

                {/* Блок A - пустой (для совместимости с формой) */}
                <div className="col-span-4">
                  <div className={cn(cellStyles.base, 'h-full')}>
                    <div className="px-1 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <span className="font-bold">A</span>
                    </div>
                    <div className="p-1 text-[10px] text-slate-400">
                      Для служебных отметок
                    </div>
                  </div>
                </div>

                {/* Второй ряд справа: Блоки 3, 4 */}
                <SmallBlock blockNumber="3" label="Доб. листы" className="col-span-2">
                  <Input
                    type="number"
                    className="h-6 text-xs text-center w-full"
                    placeholder="0"
                    disabled
                  />
                </SmallBlock>

                <SmallBlock blockNumber="4" label="Отгр. спец." className="col-span-2">
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            className="h-6 text-xs text-center w-full"
                            placeholder="№"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </SmallBlock>

                {/* Пустое место */}
                <div className="col-span-3" />

                {/* Третий ряд: Блоки 5, 6, 7 */}
                <SmallBlock blockNumber="5" label="Всего наим. товаров" className="col-span-2">
                  <FormField
                    control={form.control}
                    name="totalQuantity"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            type="number"
                            className="h-6 text-xs text-center w-full"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || undefined)
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </SmallBlock>

                <SmallBlock blockNumber="6" label="Кол-во мест" className="col-span-2">
                  <FormField
                    control={form.control}
                    name="totalPackages"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            type="number"
                            className="h-6 text-xs text-center w-full"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </SmallBlock>

                <SmallBlock
                  blockNumber="7"
                  label="Регистрационный номер ГТД"
                  className="col-span-3"
                >
                  <FormField
                    control={form.control}
                    name="internalReference"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input className="h-6 text-xs w-full" placeholder="№" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </SmallBlock>
              </div>
            </div>

            {/* Блок 8 - Грузополучатель и Блок 9 */}
            <div className="grid grid-cols-12 gap-0 mt-0">
              {/* Блок 8 */}
              <div className="col-span-5">
                <FormBlock blockNumber="8" label="Импортер/Грузополучатель" className="min-h-[100px]">
                  <div className="p-1 space-y-1">
                    <FormField
                      control={form.control}
                      name="consigneeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Наименование"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="consigneeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Адрес"
                              className={cn(cellStyles.input, 'min-h-[40px] text-xs resize-none')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-1">
                      <FormField
                        control={form.control}
                        name="consigneeTin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="ИНН"
                                maxLength={9}
                                className={cn(cellStyles.input, 'h-6 text-xs')}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="consigneeCountry"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Страна"
                                className="h-6 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </FormBlock>
              </div>

              {/* Блок 9 */}
              <div className="col-span-7">
                <FormBlock
                  blockNumber="9"
                  label="Лицо, ответственное за финансовое урегулирование"
                  className="min-h-[100px]"
                >
                  <div className="p-1 space-y-1">
                    <FormField
                      control={form.control}
                      name="responsiblePerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="ФИО"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="responsiblePosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Должность"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormBlock>
              </div>
            </div>

            {/* Ряд: Блоки 10, 11, 12, 13 */}
            <div className="grid grid-cols-12 gap-0 mt-0">
              <SmallBlock blockNumber="10" label="Страна 1-го назначения" className="col-span-2">
                <FormField
                  control={form.control}
                  name="destinationCountry"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <CountrySelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Страна"
                          className="h-6 text-xs"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </SmallBlock>

              <SmallBlock blockNumber="11" label="Торг. страна" className="col-span-2">
                <FormField
                  control={form.control}
                  name="tradingCountry"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <CountrySelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Страна"
                          className="h-6 text-xs"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </SmallBlock>

              <div className="col-span-5">
                <FormBlock blockNumber="12" label="Общая таможенная стоимость">
                  <div className="p-1 flex gap-1">
                    <FormField
                      control={form.control}
                      name="totalCustomsValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Сумма"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <CurrencySelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Валюта"
                              className="h-7 text-xs"
                              showRate={false}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormBlock>
              </div>

              <SmallBlock blockNumber="13" label="" className="col-span-3">
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder="Доп. инфо"
                          className={cn(cellStyles.input, 'h-6 text-xs')}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </SmallBlock>
            </div>

            {/* Блок 14 - Декларант */}
            <div className="grid grid-cols-12 gap-0 mt-0">
              <div className="col-span-5">
                <FormBlock blockNumber="14" label="Декларант/таможенный брокер" className="min-h-[80px]">
                  <div className="p-1 space-y-1">
                    <div className="flex gap-1">
                      <FormField
                        control={form.control}
                        name="declarantStatus"
                        render={({ field }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <ModalSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={[
                                  { value: 'DECLARANT', label: 'Декларант' },
                                  { value: 'REPRESENTATIVE', label: 'Представитель' },
                                ]}
                                placeholder="Статус"
                                dialogTitle="Выберите статус"
                                className="text-[10px]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declarantTin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="ИНН"
                                maxLength={9}
                                className={cn(cellStyles.input, 'h-6 text-xs')}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="declarantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Наименование"
                              className={cn(cellStyles.input, 'h-6 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="declarantAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Адрес"
                              className={cn(cellStyles.input, 'h-6 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormBlock>
              </div>

              {/* Блоки 15, 15a, 16, 17, 17a */}
              <div className="col-span-7 grid grid-cols-7 gap-0">
                <div className="col-span-3">
                  <FormBlock blockNumber="15" label="Страна отправления">
                    <div className="p-1">
                      <FormField
                        control={form.control}
                        name="dispatchCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Страна"
                                className="h-7 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormBlock>
                </div>

                <SmallBlock blockNumber="15a" label="Код страны отправл." className="col-span-2">
                  <FormField
                    control={form.control}
                    name="dispatchRegion"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input className="h-6 text-xs text-center" placeholder="Код" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </SmallBlock>

                <SmallBlock blockNumber="17a" label="Код страны назнач." className="col-span-2">
                  <Input className="h-6 text-xs text-center" placeholder="Код" disabled />
                </SmallBlock>

                {/* Вторая строка блоков */}
                <div className="col-span-3">
                  <FormBlock blockNumber="16" label="Страна происхождения">
                    <div className="p-1">
                      <FormField
                        control={form.control}
                        name="originCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <CountrySelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Страна"
                                className="h-7 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormBlock>
                </div>

                <div className="col-span-4">
                  <FormBlock blockNumber="17" label="Страна назначения">
                    <div className="p-1">
                      {watchDeclarationType === 'TRANSIT' ? (
                        <FormField
                          control={form.control}
                          name="transitDestinationCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CountrySelect
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="Страна (транзит)"
                                  className="h-7 text-xs"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="destinationCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CountrySelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Страна"
                                  className="h-7 text-xs"
                                  disabled
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </FormBlock>
                </div>
              </div>
            </div>

            {/* Блоки 18, 19, 20 - Транспорт и условия поставки */}
            <div className="grid grid-cols-12 gap-0 mt-0">
              {/* Блок 18 */}
              <div className="col-span-5">
                <FormBlock
                  blockNumber="18"
                  label="Транспортное средство при отправлении/прибытии"
                >
                  <div className="p-1 flex gap-1">
                    <FormField
                      control={form.control}
                      name="transportNationality"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <CountrySelect
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Страна"
                              className="h-7 text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transportNumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Номер/Название ТС"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormBlock>
              </div>

              {/* Блок 19 - Контейнер */}
              <SmallBlock blockNumber="19" label="Конт." className="col-span-1">
                <Input
                  className="h-6 text-xs text-center"
                  value={(form.watch('containerNumbers')?.length || 0) > 0 ? '1' : '0'}
                  disabled
                />
              </SmallBlock>

              {/* Блок 20 - Условия поставки */}
              <div className="col-span-6">
                <FormBlock blockNumber="20" label="Условия поставки">
                  <div className="p-1 flex gap-1">
                    <FormField
                      control={form.control}
                      name="incoterms"
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <IncotermsSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Инкотермс"
                              className="h-7 text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryPlace"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Место доставки"
                              className={cn(cellStyles.input, 'h-7 text-xs')}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormBlock>
              </div>
            </div>

            {/* Блок 19 расширенный - Контейнеры (если есть) */}
            <div className="mt-2">
              <FormBlock blockNumber="19" label="Номера контейнеров (если применимо)">
                <div className="p-2">
                  <FormField
                    control={form.control}
                    name="containerNumbers"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ContainerInput
                            value={field.value || []}
                            onChange={field.onChange}
                            maxContainers={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormBlock>
            </div>

            {/* Примечание о блоках 21-53 */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Блоки 21-53 будут доступны после заполнения основных данных
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================
            КНОПКИ ДЕЙСТВИЙ
        ========================================== */}

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between pt-4">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить черновик
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Продолжить (блоки 21-40)
          </Button>
        </div>
      </form>
    </Form>
  );
}
