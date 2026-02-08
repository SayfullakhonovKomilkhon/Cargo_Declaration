'use client';

import * as React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const cellClass = 'border border-black bg-white';
const headerClass = 'text-[9px] font-bold bg-gray-100 px-1 py-0.5 border-b border-black';
const inputClass = 'border-0 rounded-none h-full w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs p-1';
const textareaClass = 'border-0 rounded-none w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs p-1 min-h-[40px] resize-none';

interface GTDItemFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function GTDItemForm({ form }: GTDItemFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const addItem = () => {
    append({
      itemNumber: fields.length + 1,
      goodsDescription: '',
      hsCode: '',
      originCountryCode: '',
      grossWeight: 0,
      netWeight: 0,
      quantity: 1,
      itemPrice: 0,
      itemCurrency: 'USD',
      customsValue: 0,
      procedureCode: '',
      previousProcedureCode: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Товарные позиции (Блоки 31-47)</h3>
        <Button type="button" onClick={addItem} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Добавить товар
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['item-0']} className="space-y-2">
        {fields.map((field, index) => (
          <AccordionItem key={field.id} value={`item-${index}`} className="border border-black rounded-none">
            <AccordionTrigger className="px-2 py-1 bg-gray-100 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-xs">
                  Товар № {index + 1}
                  {form.watch(`items.${index}.goodsDescription`) && (
                    <span className="font-normal ml-2 text-gray-600">
                      — {form.watch(`items.${index}.goodsDescription`)?.substring(0, 50)}...
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fields.length > 1) remove(index);
                  }}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <ItemFields form={form} index={index} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Нет товарных позиций</p>
          <Button type="button" onClick={addItem} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Добавить первый товар
          </Button>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ItemFields({ form, index }: { form: UseFormReturn<any>; index: number }) {
  return (
    <div className="bg-white text-black text-xs">
      {/* Блоки 31-33 */}
      <div className="grid grid-cols-12 gap-0 border-t border-black">
        <div className={cn(cellClass, 'col-span-6')}>
          <div className={headerClass}>31. Грузовые места и описание товаров</div>
          <div className="p-1 space-y-1">
            <FormField control={form.control} name={`items.${index}.goodsDescription`} render={({ field }) => (
              <FormItem><FormControl>
                <Textarea placeholder="Описание товара (наименование, характеристики, марка, модель...)" className={cn(textareaClass, 'min-h-[60px]')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
            <div className="flex gap-2 text-[9px]">
              <span>Кол-во:</span>
              <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                <FormItem className="w-16"><FormControl>
                  <Input type="number" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl></FormItem>
              )} />
              <span>Вид упаковки:</span>
              <FormField control={form.control} name={`items.${index}.packagingType`} render={({ field }) => (
                <FormItem className="flex-1"><FormControl>
                  <Input placeholder="коробка, паллет..." className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
            </div>
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>32. Товар №</div>
          <div className="p-1 text-center font-bold text-lg">
            {index + 1}
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-4')}>
          <div className={headerClass}>33. Код товара (ТН ВЭД)</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.hsCode`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="0000000000" maxLength={10} className={cn(inputClass, 'text-center font-mono')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Блоки 34-39 */}
      <div className="grid grid-cols-12 gap-0 border-t border-black">
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>34. Код стр. происх.</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.originCountryCode`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="000" maxLength={3} className={cn(inputClass, 'text-center')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>35. Вес брутто (кг)</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" step="0.001" placeholder="0.000" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>36. Преференция</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.preferenceCode`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="Код" className={inputClass} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>37. Процедура</div>
          <div className="p-1 flex gap-0.5">
            <FormField control={form.control} name={`items.${index}.procedureCode`} render={({ field }) => (
              <FormItem className="flex-1"><FormControl>
                <Input placeholder="00" maxLength={2} className={cn(inputClass, 'text-center')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
            <span className="self-center">|</span>
            <FormField control={form.control} name={`items.${index}.previousProcedureCode`} render={({ field }) => (
              <FormItem className="flex-1"><FormControl>
                <Input placeholder="00" maxLength={2} className={cn(inputClass, 'text-center')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
            <span className="self-center">|</span>
            <FormField control={form.control} name={`items.${index}.procedureCode2`} render={({ field }) => (
              <FormItem className="flex-1"><FormControl>
                <Input placeholder="000" maxLength={3} className={cn(inputClass, 'text-center')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>38. Вес нетто (кг)</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" step="0.001" placeholder="0.000" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>39. Квота</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.quotaNumber`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="№ квоты" className={inputClass} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Блоки 40-43 */}
      <div className="grid grid-cols-12 gap-0 border-t border-black">
        <div className={cn(cellClass, 'col-span-6')}>
          <div className={headerClass}>40. Общая декларация/предшествующий документ</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.previousDocument`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="/0/-0-0-0-0" className={inputClass} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-2')}>
          <div className={headerClass}>41. Доп. ед. изм.</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.supplementaryQuantity`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" placeholder="0" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-3')}>
          <div className={headerClass}>42. Фактическая стоимость</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.itemPrice`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" step="0.01" placeholder="0.00" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-1')}>
          <div className={headerClass}>43. М.О.С.</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.valuationMethodCode`} render={({ field }) => (
              <FormItem><FormControl>
                <Input placeholder="0" maxLength={1} className={cn(inputClass, 'text-center')} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Блоки 44-46 */}
      <div className="grid grid-cols-12 gap-0 border-t border-black">
        <div className={cn(cellClass, 'col-span-6')}>
          <div className={headerClass}>44. Доп. информация / документы</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.additionalInfo`} render={({ field }) => (
              <FormItem><FormControl>
                <Textarea placeholder="Коды документов: 202 СМР № от дата; 220 ИНВ № от дата; ..." className={textareaClass} {...field} value={field.value ?? ''} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-3')}>
          <div className={headerClass}>45. Таможенная стоимость</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.customsValue`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" step="0.01" placeholder="0.00" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
        <div className={cn(cellClass, 'col-span-3')}>
          <div className={headerClass}>46. Статистическая стоимость</div>
          <div className="p-1">
            <FormField control={form.control} name={`items.${index}.statisticalValue`} render={({ field }) => (
              <FormItem><FormControl>
                <Input type="number" step="0.01" placeholder="0.00" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl></FormItem>
            )} />
          </div>
        </div>
      </div>

      {/* Блок 47 - Исчисление платежей */}
      <div className="border-t border-black">
        <div className={cellClass}>
          <div className={headerClass}>47. Исчисление таможенных пошлин и сборов</div>
          <div className="p-1">
            <div className="grid grid-cols-5 gap-1 text-[9px] font-bold mb-1">
              <span>Вид</span>
              <span>Осн. начисл.</span>
              <span>Ставка</span>
              <span>Сумма</span>
              <span>СП</span>
            </div>
            {/* Пошлина */}
            <div className="grid grid-cols-5 gap-1 mb-1">
              <FormField control={form.control} name={`items.${index}.dutyType`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="10" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.dutyBase`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="Основа" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.dutyRate`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="%" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.dutyAmount`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.dutyPaymentMethod`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="БН" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
            </div>
            {/* НДС */}
            <div className="grid grid-cols-5 gap-1 mb-1">
              <FormField control={form.control} name={`items.${index}.vatType`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="20" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.vatBase`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="Основа" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.vatRate`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="%" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.vatAmount`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" className={inputClass} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.vatPaymentMethod`} render={({ field }) => (
                <FormItem><FormControl>
                  <Input placeholder="БН" className={inputClass} {...field} value={field.value ?? ''} />
                </FormControl></FormItem>
              )} />
            </div>
            {/* Итого */}
            <div className="flex justify-end gap-2 mt-1 pt-1 border-t">
              <span className="text-[9px] font-bold">Всего:</span>
              <FormField control={form.control} name={`items.${index}.totalPayment`} render={({ field }) => (
                <FormItem className="w-32"><FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" className={cn(inputClass, 'font-bold')} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl></FormItem>
              )} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
