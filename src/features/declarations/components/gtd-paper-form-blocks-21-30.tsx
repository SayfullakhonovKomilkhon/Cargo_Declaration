'use client';

import * as React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CurrencySelect, CustomsOfficeSelect, ModalSelect } from '@/shared/ui';

import { PreviousDocuments } from './previous-documents';
import { TRANSPORT_TYPES, TRANSACTION_NATURES } from '../schemas';

// Стили для ячеек формы
const cellStyles = {
  base: 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900',
  input:
    'border-0 rounded-none h-full w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm',
};

// Компонент для блока формы
interface FormBlockProps {
  blockNumber: number | string;
  label: string;
  children: React.ReactNode;
  className?: string;
}

function FormBlock({ blockNumber, label, children, className }: FormBlockProps) {
  return (
    <div className={cn(cellStyles.base, 'relative', className)}>
      <div className="absolute top-0 left-0 right-0 px-1 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1">
        <span className="font-bold text-slate-600 dark:text-slate-300">{blockNumber}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="pt-5 h-full">{children}</div>
    </div>
  );
}

// Компонент для маленького блока
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

interface ExchangeRateResponse {
  currency: string;
  rate: number;
  date: string;
  source: string;
}

interface GTDPaperFormBlocks21To30Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function GTDPaperFormBlocks21To30({ form }: GTDPaperFormBlocks21To30Props) {
  const watchInvoiceCurrency = form.watch('invoiceCurrency');

  // Автоматическое получение курса валюты
  const {
    data: exchangeRateData,
    isLoading: isLoadingRate,
    refetch: refetchRate,
  } = useQuery<ExchangeRateResponse>({
    queryKey: ['exchangeRate', watchInvoiceCurrency],
    queryFn: async () => {
      if (!watchInvoiceCurrency) return null;
      const response = await fetch(`/api/exchange-rates/${watchInvoiceCurrency}`);
      if (!response.ok) throw new Error('Ошибка получения курса');
      return response.json();
    },
    enabled: !!watchInvoiceCurrency,
    staleTime: 1000 * 60 * 30, // 30 минут
  });

  // Автозаполнение курса при получении данных
  React.useEffect(() => {
    if (exchangeRateData) {
      form.setValue('exchangeRate', exchangeRateData.rate);
      form.setValue('exchangeRateDate', exchangeRateData.date);
    }
  }, [exchangeRateData, form]);

  return (
    <div className="space-y-0">
      {/* Ряд: Блоки 21, 22, 23, 24 */}
      <div className="grid grid-cols-12 gap-0">
        {/* Блок 21 - Транспортное средство на границе */}
        <div className="col-span-4">
          <FormBlock blockNumber="21" label="Транспортное средство на границе">
            <div className="p-1 space-y-1">
              <FormField
                control={form.control}
                name="borderTransportMode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ModalSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={TRANSPORT_TYPES.map(t => ({ value: t.code, label: `${t.code} - ${t.name}` }))}
                        placeholder="Вид транспорта"
                        dialogTitle="Выберите вид транспорта"
                        searchPlaceholder="Поиск..."
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

        {/* Блок 22 - Валюта и общая фактурная стоимость */}
        <div className="col-span-4">
          <FormBlock blockNumber="22" label="Валюта и общая фактур. стоим. товаров">
            <div className="p-1 flex gap-1">
              <FormField
                control={form.control}
                name="invoiceCurrency"
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
              <FormField
                control={form.control}
                name="totalInvoiceAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Сумма"
                        className={cn(cellStyles.input, 'h-7 text-xs')}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormBlock>
        </div>

        {/* Блок 23 - Курс валюты */}
        <div className="col-span-2">
          <FormBlock blockNumber="23" label="Курс валюты">
            <div className="p-1 space-y-1">
              <div className="flex items-center gap-1">
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="Курс"
                          className={cn(cellStyles.input, 'h-6 text-xs')}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => refetchRate()}
                  disabled={isLoadingRate || !watchInvoiceCurrency}
                >
                  {isLoadingRate ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {exchangeRateData && (
                <p className="text-[9px] text-muted-foreground">
                  на {exchangeRateData.date}
                </p>
              )}
            </div>
          </FormBlock>
        </div>

        {/* Блок 24 - Характер сделки */}
        <div className="col-span-2">
          <FormBlock blockNumber="24" label="Характер сделки">
            <div className="p-1">
              <FormField
                control={form.control}
                name="transactionNature"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ModalSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={Object.entries(TRANSACTION_NATURES).map(([code, name]) => ({ value: code, label: name }))}
                        placeholder="Тип"
                        dialogTitle="Выберите характер сделки"
                        searchPlaceholder="Поиск..."
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
      </div>

      {/* Ряд: Блоки 25, 26, 27 */}
      <div className="grid grid-cols-12 gap-0">
        <SmallBlock blockNumber="25" label="Вид транспорта на границе" className="col-span-2">
          <FormField
            control={form.control}
            name="borderTransportModeCode"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="h-6 text-xs text-center"
                    placeholder="Код"
                    maxLength={2}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SmallBlock>

        <SmallBlock blockNumber="26" label="Вид транспорта внутри страны" className="col-span-2">
          <FormField
            control={form.control}
            name="inlandTransportMode"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="h-6 text-xs text-center"
                    placeholder="Код"
                    maxLength={2}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SmallBlock>

        {/* Блок 27 - Место погрузки/разгрузки */}
        <div className="col-span-4">
          <FormBlock blockNumber="27" label="Место погрузки/разгрузки">
            <div className="p-1">
              <FormField
                control={form.control}
                name="loadingUnloadingPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Место погрузки/разгрузки"
                        className={cn(cellStyles.input, 'h-7 text-xs')}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </FormBlock>
        </div>

        {/* Блок 28 - Финансовые и банковские сведения */}
        <div className="col-span-4">
          <FormBlock blockNumber="28" label="Финансовые и банковские сведения">
            <div className="p-1">
              <FormField
                control={form.control}
                name="bankingDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Банковские реквизиты"
                        className={cn(cellStyles.input, 'h-7 text-xs')}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormBlock>
        </div>
      </div>

      {/* Ряд: Блоки 29, 30 */}
      <div className="grid grid-cols-12 gap-0">
        {/* Блок 29 - Таможня на границе */}
        <div className="col-span-4">
          <FormBlock blockNumber="29" label="Таможня на границе">
            <div className="p-1">
              <FormField
                control={form.control}
                name="customsOfficeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CustomsOfficeSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Выберите таможню"
                        className="h-7 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </FormBlock>
        </div>

        {/* Блок 30 - Местонахождение товаров */}
        <div className="col-span-8">
          <FormBlock blockNumber="30" label="Местонахождение товаров">
            <div className="p-1 flex gap-1">
              <FormField
                control={form.control}
                name="goodsLocationCode"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        placeholder="Код"
                        className={cn(cellStyles.input, 'h-7 text-xs')}
                        maxLength={20}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goodsLocation"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="Адрес местонахождения товаров (склад, терминал)"
                        className={cn(cellStyles.input, 'min-h-[40px] text-xs resize-none')}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </FormBlock>
        </div>
      </div>

      {/* Блок 40 - Предшествующие документы */}
      <div className="mt-2">
        <FormBlock blockNumber="40" label="Общая декларация/предшествующий документ">
          <div className="p-2">
            <PreviousDocuments control={form.control} name="previousDocuments" />
          </div>
        </FormBlock>
      </div>
    </div>
  );
}
