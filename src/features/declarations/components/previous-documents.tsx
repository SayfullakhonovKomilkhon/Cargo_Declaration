'use client';

import { Plus, Trash2, FileText } from 'lucide-react';
import { useFieldArray, Control } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalSelect } from '@/shared/ui/modal-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { PREVIOUS_DOCUMENT_TYPES } from '../schemas';

interface PreviousDocumentsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  disabled?: boolean;
  maxDocuments?: number;
}

export function PreviousDocuments({
  control,
  name,
  disabled = false,
  maxDocuments = 10,
}: PreviousDocumentsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const handleAddDocument = () => {
    if (fields.length < maxDocuments) {
      append({
        documentType: '',
        documentNumber: '',
        documentDate: '',
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Список документов */}
      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded-md border bg-slate-50 dark:bg-slate-800/50',
                'border-slate-200 dark:border-slate-700'
              )}
            >
              <FileText className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />

              <div className="flex-1 grid gap-2 sm:grid-cols-3">
                {/* Тип документа */}
                <FormField
                  control={control}
                  name={`${name}.${index}.documentType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ModalSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={PREVIOUS_DOCUMENT_TYPES.map((type) => ({ value: type.code, label: `${type.code} - ${type.name}` }))}
                          placeholder="Тип"
                          dialogTitle="Выберите тип документа"
                          searchPlaceholder="Поиск..."
                          disabled={disabled}
                          className="text-xs"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Номер документа */}
                <FormField
                  control={control}
                  name={`${name}.${index}.documentNumber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Номер документа"
                          className="h-8 text-xs"
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* Дата документа */}
                <FormField
                  control={control}
                  name={`${name}.${index}.documentDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="h-8 text-xs"
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Кнопка удаления */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={disabled}
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Удалить документ</span>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Предшествующие документы не добавлены
        </p>
      )}

      {/* Кнопка добавления */}
      {fields.length < maxDocuments && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDocument}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить предшествующий документ
        </Button>
      )}

      {/* Подсказка */}
      <p className="text-xs text-muted-foreground">
        Укажите предшествующие таможенные документы (если применимо)
      </p>
    </div>
  );
}
