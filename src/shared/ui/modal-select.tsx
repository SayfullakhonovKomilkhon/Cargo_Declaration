'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ModalSelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

interface ModalSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: ModalSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  dialogTitle?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  emptyMessage?: string;
}

export function ModalSelect({
  value,
  onChange,
  options,
  placeholder = 'Выбрать...',
  searchPlaceholder = 'Поиск...',
  dialogTitle = 'Выберите значение',
  disabled = false,
  className,
  error,
  emptyMessage = 'Ничего не найдено',
}: ModalSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  // Группируем опции если есть группы
  const groupedOptions = React.useMemo(() => {
    const groups = new Map<string, ModalSelectOption[]>();
    options.forEach((option) => {
      const group = option.group || '';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(option);
    });
    return groups;
  }, [options]);

  const hasGroups = groupedOptions.size > 1 || (groupedOptions.size === 1 && !groupedOptions.has(''));

  return (
    <>
      {/* Текст-триггер: зелёный для выбора, чёрный после выбора */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'hover:underline cursor-pointer font-medium text-left truncate',
          // Если есть выбранное значение - чёрный текст, иначе зелёный для выбора
          selectedOption ? 'text-black hover:text-gray-700' : 'text-green-600 hover:text-green-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-red-500',
          className
        )}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>

      {/* Модальное окно для выбора */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[350px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              
              {hasGroups ? (
                // Рендерим с группами
                Array.from(groupedOptions.entries()).map(([groupName, groupOptions]) => (
                  <CommandGroup key={groupName} heading={groupName || undefined}>
                    {groupOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={`${option.value} ${option.label} ${option.description || ''}`}
                        onSelect={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 flex-shrink-0',
                            value === option.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              ) : (
                // Рендерим без групп
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.value} ${option.label} ${option.description || ''}`}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 flex-shrink-0',
                          value === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
