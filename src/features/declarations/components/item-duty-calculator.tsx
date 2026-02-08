'use client';

import * as React from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { useDebounce } from '@/shared/hooks/use-debounce';

// Стили для ячеек формы
const cellStyles = {
  base: 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900',
  input:
    'border-0 rounded-none h-full w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm',
};

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

interface ItemDutyCalculatorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  fieldPrefix: string;
  autoCalculate?: boolean;
}

interface DutyCalculationResult {
  dutyAmount: number;
  vatAmount: number;
  exciseAmount: number;
  customsFee: number;
  totalPayment: number;
  breakdown: {
    dutyRate: number;
    vatRate: number;
    exciseRate: number;
    customsValue: number;
    vatBase: number;
  };
  preferenceType: string;
}

async function calculateDuties(data: {
  hsCode: string;
  customsValue: number;
  quantity: number;
  originCountry: string;
  currency?: string;
}): Promise<DutyCalculationResult> {
  const response = await fetch('/api/declarations/calculate-duties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка расчета');
  }

  return response.json();
}

export function ItemDutyCalculator({
  form,
  fieldPrefix,
  autoCalculate = true,
}: ItemDutyCalculatorProps) {
  // Watch fields for auto-calculation
  const hsCode = form.watch(`${fieldPrefix}.hsCode`);
  const customsValue = form.watch(`${fieldPrefix}.customsValue`);
  const originCountryCode = form.watch(`${fieldPrefix}.originCountryCode`);
  const packageQuantity = form.watch(`${fieldPrefix}.packageQuantity`);
  const itemCurrencyCode = form.watch(`${fieldPrefix}.itemCurrencyCode`);

  // Current duty values are managed by form fields below

  // Debounced values for auto-calculation
  const debouncedHsCode = useDebounce(hsCode, 500);
  const debouncedCustomsValue = useDebounce(customsValue, 500);
  const debouncedOriginCountry = useDebounce(originCountryCode, 500);

  // Mutation for calculation
  const calculateMutation = useMutation({
    mutationFn: calculateDuties,
    onSuccess: (result) => {
      // Update form values with calculation results
      form.setValue(`${fieldPrefix}.dutyRate`, result.breakdown.dutyRate);
      form.setValue(`${fieldPrefix}.dutyAmount`, result.dutyAmount);
      form.setValue(`${fieldPrefix}.vatRate`, result.breakdown.vatRate);
      form.setValue(`${fieldPrefix}.vatAmount`, result.vatAmount);
      form.setValue(`${fieldPrefix}.exciseRate`, result.breakdown.exciseRate);
      form.setValue(`${fieldPrefix}.exciseAmount`, result.exciseAmount);
      form.setValue(`${fieldPrefix}.feeAmount`, result.customsFee);
      form.setValue(`${fieldPrefix}.totalPayment`, result.totalPayment);

      toast.success('Платежи рассчитаны', {
        description: `Итого: ${result.totalPayment.toLocaleString()} UZS`,
      });
    },
    onError: (error: Error) => {
      toast.error('Ошибка расчета', { description: error.message });
    },
  });

  // Auto-calculate when required fields change
  React.useEffect(() => {
    if (
      autoCalculate &&
      debouncedHsCode &&
      debouncedHsCode.length === 10 &&
      debouncedCustomsValue &&
      debouncedCustomsValue > 0 &&
      debouncedOriginCountry &&
      debouncedOriginCountry.length === 2
    ) {
      calculateMutation.mutate({
        hsCode: debouncedHsCode,
        customsValue: debouncedCustomsValue,
        quantity: packageQuantity || 1,
        originCountry: debouncedOriginCountry,
        currency: itemCurrencyCode || 'USD',
      });
    }
  }, [debouncedHsCode, debouncedCustomsValue, debouncedOriginCountry]);

  // Manual calculation handler
  const handleCalculate = () => {
    if (!hsCode || hsCode.length !== 10) {
      toast.error('Введите корректный HS код (10 цифр)');
      return;
    }
    if (!customsValue || customsValue <= 0) {
      toast.error('Введите таможенную стоимость');
      return;
    }
    if (!originCountryCode || originCountryCode.length !== 2) {
      toast.error('Выберите страну происхождения');
      return;
    }

    calculateMutation.mutate({
      hsCode,
      customsValue,
      quantity: packageQuantity || 1,
      originCountry: originCountryCode,
      currency: itemCurrencyCode || 'USD',
    });
  };

  // Check if all required fields are filled
  const canCalculate =
    hsCode &&
    hsCode.length === 10 &&
    customsValue > 0 &&
    originCountryCode &&
    originCountryCode.length === 2;

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-0">
      {/* Блок 47 - Исчисление платежей */}
      <FormBlock blockNumber="47" label="Исчисление платежей" className="min-h-[140px]">
        <div className="p-2 space-y-2">
          {/* Кнопка расчета */}
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              size="sm"
              variant={canCalculate ? 'default' : 'outline'}
              disabled={!canCalculate || calculateMutation.isPending}
              onClick={handleCalculate}
              className="h-7 text-xs"
            >
              {calculateMutation.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Calculator className="h-3 w-3 mr-1" />
              )}
              Рассчитать
            </Button>
          </div>

          {/* Таблица платежей */}
          <div className="grid grid-cols-5 gap-1 text-xs">
            {/* Заголовки */}
            <div className="font-medium text-center text-[10px] text-muted-foreground">Вид</div>
            <div className="font-medium text-center text-[10px] text-muted-foreground">Ставка</div>
            <div className="font-medium text-center text-[10px] text-muted-foreground">Основа</div>
            <div className="font-medium text-center text-[10px] text-muted-foreground">Сумма</div>
            <div className="font-medium text-center text-[10px] text-muted-foreground">СП</div>

            {/* Пошлина */}
            <div className="text-[10px] flex items-center">Пошлина</div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.dutyRate`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">
              {formatCurrency(customsValue)}
            </div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.dutyAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center bg-slate-50"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">ИУ</div>

            {/* НДС */}
            <div className="text-[10px] flex items-center">НДС</div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.vatRate`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center text-muted-foreground">
              ТС+П+А
            </div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.vatAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center bg-slate-50"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">ИУ</div>

            {/* Акциз */}
            <div className="text-[10px] flex items-center">Акциз</div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.exciseRate`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">
              {formatCurrency(customsValue)}
            </div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.exciseAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center bg-slate-50"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">ИУ</div>

            {/* Сбор */}
            <div className="text-[10px] flex items-center">Сбор</div>
            <div className="text-[10px] flex items-center justify-center">0.2%</div>
            <div className="text-[10px] flex items-center justify-center">
              {formatCurrency(customsValue)}
            </div>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.feeAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-6 text-[10px] text-center bg-slate-50"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-[10px] flex items-center justify-center">ИУ</div>
          </div>

          {/* Итого */}
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="font-bold text-sm">ИТОГО к уплате:</span>
            <FormField
              control={form.control}
              name={`${fieldPrefix}.totalPayment`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      className="h-8 w-40 text-right font-bold text-sm bg-green-50 dark:bg-green-900/20 border-green-500"
                      readOnly
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <span className="text-sm font-medium">UZS</span>
          </div>

          {/* Статус расчета */}
          {calculateMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Расчет платежей...
            </div>
          )}

          {!canCalculate && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
              Для расчета заполните: HS код, таможенную стоимость, страну происхождения
            </div>
          )}
        </div>
      </FormBlock>
    </div>
  );
}
