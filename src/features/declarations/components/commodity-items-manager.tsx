'use client';

import * as React from 'react';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CountrySelect, ModalSelect } from '@/shared/ui';

import { HSCodeLookup } from './hs-code-lookup';
import { ItemDutyCalculator } from './item-duty-calculator';
import {
  PACKAGE_TYPES,
  PROCEDURE_CODES,
  VALUATION_METHODS,
  defaultCommodityItemValues,
} from '../schemas';

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

interface CommodityItemFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  index: number;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
}

function CommodityItemForm({
  form,
  index,
  onRemove,
  onDuplicate,
  canRemove,
}: CommodityItemFormProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const fieldPrefix = `items.${index}`;

  // Получаем значения для отображения summary
  const description = form.watch(`${fieldPrefix}.description`) || '';
  const hsCode = form.watch(`${fieldPrefix}.hsCode`) || '';
  const grossWeight = form.watch(`${fieldPrefix}.grossWeight`);

  const summary = React.useMemo(() => {
    const parts = [];
    if (hsCode) parts.push(hsCode);
    if (description) parts.push(description.substring(0, 30) + (description.length > 30 ? '...' : ''));
    if (grossWeight) parts.push(`${grossWeight} кг`);
    return parts.join(' | ') || 'Новый товар';
  }, [hsCode, description, grossWeight]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg overflow-hidden">
      {/* Заголовок товара */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 border-b">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <Package className="h-4 w-4 text-muted-foreground" />

        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">Товар #{index + 1}</span>
          {!isOpen && (
            <span className="text-xs text-muted-foreground ml-2 truncate">{summary}</span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          className="h-8"
        >
          <Copy className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Дублировать</span>
        </Button>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Удалить</span>
          </Button>
        )}
      </div>

      <CollapsibleContent>
        <div className="p-2 space-y-0 bg-white dark:bg-slate-900">
          {/* Верхний ряд: Блоки 31, 32, 33 */}
          <div className="grid grid-cols-12 gap-0">
            {/* Блок 31 - Грузовые места и описание товаров */}
            <div className="col-span-6">
              <FormBlock blockNumber="31" label="Грузовые места и описание товаров" className="min-h-[120px]">
                <div className="p-1 space-y-1">
                  <div className="flex gap-1">
                    <FormField
                      control={form.control}
                      name={`${fieldPrefix}.marksNumbers`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Маркировка и номера"
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
                    name={`${fieldPrefix}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Описание товара"
                            className={cn(cellStyles.input, 'min-h-[60px] text-xs resize-none')}
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
                      name={`${fieldPrefix}.packageType`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <ModalSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={PACKAGE_TYPES.map((type) => ({ value: type.code, label: `${type.code} - ${type.name}` }))}
                              placeholder="Тип упак."
                              dialogTitle="Выберите тип упаковки"
                              searchPlaceholder="Поиск..."
                              className="text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`${fieldPrefix}.packageQuantity`}
                      render={({ field }) => (
                        <FormItem className="w-20">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Кол-во"
                              className={cn(cellStyles.input, 'h-6 text-xs')}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </FormBlock>
            </div>

            {/* Блоки справа */}
            <div className="col-span-6 grid grid-cols-6 gap-0">
              {/* Блок 32 - Товар № */}
              <SmallBlock blockNumber="32" label="Товар №" className="col-span-1">
                <span className="text-lg font-bold">{index + 1}</span>
              </SmallBlock>

              {/* Блок 33 - Код товара */}
              <div className="col-span-5">
                <FormBlock blockNumber="33" label="Код товара">
                  <div className="p-1">
                    <FormField
                      control={form.control}
                      name={`${fieldPrefix}.hsCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <HSCodeLookup
                              value={field.value}
                              onChange={(code, desc) => {
                                field.onChange(code);
                                if (desc) {
                                  form.setValue(`${fieldPrefix}.hsDescription`, desc);
                                }
                              }}
                              placeholder="Поиск кода ТН ВЭД"
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

              {/* Блок 34 - Код страны происхождения */}
              <div className="col-span-2">
                <FormBlock blockNumber="34" label="Код страны происх.">
                  <div className="p-1">
                    <FormField
                      control={form.control}
                      name={`${fieldPrefix}.originCountryCode`}
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

              {/* Блок 35 - Вес брутто */}
              <SmallBlock blockNumber="35" label="Вес брутто (кг)" className="col-span-2">
                <FormField
                  control={form.control}
                  name={`${fieldPrefix}.grossWeight`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          className="h-6 text-xs text-center"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </SmallBlock>

              {/* Блок 36 - Преференция */}
              <SmallBlock blockNumber="36" label="Преференция" className="col-span-2">
                <FormField
                  control={form.control}
                  name={`${fieldPrefix}.preferenceCode`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input className="h-6 text-xs text-center" placeholder="Код" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </SmallBlock>
            </div>
          </div>

          {/* Второй ряд: Блоки 37, 38, 39 */}
          <div className="grid grid-cols-12 gap-0">
            {/* Блок 37 - Процедура */}
            <div className="col-span-3">
              <FormBlock blockNumber="37" label="Процедура">
                <div className="p-1 flex gap-1">
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.procedureCode`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <ModalSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={PROCEDURE_CODES.map((proc) => ({ value: proc.code, label: `${proc.code} - ${proc.name}` }))}
                            placeholder="Код"
                            dialogTitle="Выберите процедуру"
                            searchPlaceholder="Поиск..."
                            className="text-xs"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.previousProcedureCode`}
                    render={({ field }) => (
                      <FormItem className="w-16">
                        <FormControl>
                          <Input
                            placeholder="Пред."
                            className={cn(cellStyles.input, 'h-7 text-xs')}
                            maxLength={4}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FormBlock>
            </div>

            {/* Блок 38 - Вес нетто */}
            <SmallBlock blockNumber="38" label="Вес нетто (кг)" className="col-span-2">
              <FormField
                control={form.control}
                name={`${fieldPrefix}.netWeight`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        className="h-6 text-xs text-center"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </SmallBlock>

            {/* Блок 39 - Квота */}
            <SmallBlock blockNumber="39" label="Квота" className="col-span-2">
              <FormField
                control={form.control}
                name={`${fieldPrefix}.quotaNumber`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input className="h-6 text-xs" placeholder="№ квоты" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SmallBlock>

            {/* Блоки 41, 42 */}
            <SmallBlock blockNumber="41" label="Доп. ед. изм." className="col-span-2">
              <div className="flex gap-1 w-full">
                <FormField
                  control={form.control}
                  name={`${fieldPrefix}.supplementaryQuantity`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          placeholder="Кол-во"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </SmallBlock>

            {/* Блок 42 - Фактурная стоимость */}
            <div className="col-span-3">
              <FormBlock blockNumber="42" label="Фактурная стоимость товара">
                <div className="p-1">
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.itemPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={cn(cellStyles.input, 'h-7 text-xs')}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

          {/* Третий ряд: Блоки 43, 45, 46 */}
          <div className="grid grid-cols-12 gap-0">
            <SmallBlock blockNumber="43" label="М.О.С." className="col-span-1">
              <FormField
                control={form.control}
                name={`${fieldPrefix}.valuationMethodCode`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <ModalSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={VALUATION_METHODS.map((method) => ({ value: method.code, label: method.code, description: method.name }))}
                        placeholder="М"
                        dialogTitle="Метод определения стоимости"
                        searchPlaceholder="Поиск..."
                        className="text-[10px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SmallBlock>

            {/* Блок 45 - Таможенная стоимость */}
            <div className="col-span-5">
              <FormBlock blockNumber="45" label="Таможенная стоимость">
                <div className="p-1">
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.customsValue`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={cn(cellStyles.input, 'h-7 text-xs')}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </FormBlock>
            </div>

            {/* Блок 46 - Статистическая стоимость */}
            <div className="col-span-6">
              <FormBlock blockNumber="46" label="Статистическая стоимость">
                <div className="p-1">
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.statisticalValue`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={cn(cellStyles.input, 'h-7 text-xs')}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FormBlock>
            </div>
          </div>

          {/* Блок 44 - Дополнительная информация */}
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-12">
              <FormBlock blockNumber="44" label="Дополнительная информация / Представленные документы">
                <div className="p-1">
                  <FormField
                    control={form.control}
                    name={`${fieldPrefix}.additionalInfo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Дополнительная информация о товаре, коды представленных документов"
                            className={cn(cellStyles.input, 'min-h-[40px] text-xs resize-none')}
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

          {/* Блок 47 - Исчисление платежей */}
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-12">
              <ItemDutyCalculator form={form} fieldPrefix={fieldPrefix} autoCalculate />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface CommodityItemsManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function CommodityItemsManager({ form }: CommodityItemsManagerProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleAddItem = () => {
    append({
      ...defaultCommodityItemValues,
      itemNumber: fields.length + 1,
    });
  };

  const handleDuplicateItem = (index: number) => {
    const itemToDuplicate = form.getValues(`items.${index}`);
    append({
      ...itemToDuplicate,
      id: undefined,
      itemNumber: fields.length + 1,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      // Обновляем номера товаров
      const items = form.getValues('items');
      items.forEach((_: { itemNumber: number }, idx: number) => {
        form.setValue(`items.${idx}.itemNumber`, idx + 1);
      });
    }
  };

  // При первой загрузке добавляем один товар если список пустой
  React.useEffect(() => {
    if (fields.length === 0) {
      handleAddItem();
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Товарные позиции ({fields.length})
        </h3>
        <Button type="button" onClick={handleAddItem} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Добавить товар
        </Button>
      </div>

      {/* Список товаров */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <CommodityItemForm
            key={field.id}
            form={form}
            index={index}
            onRemove={() => handleRemoveItem(index)}
            onDuplicate={() => handleDuplicateItem(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {/* Информация */}
      <p className="text-sm text-muted-foreground text-center">
        Минимум 1 товарная позиция обязательна. Максимум 999 позиций.
      </p>
    </div>
  );
}
