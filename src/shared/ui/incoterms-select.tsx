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

// Incoterms 2020 с цифровыми кодами из Приложения №7
const INCOTERMS = [
  {
    code: 'EXW',
    numericCode: '01',
    name: 'Ex Works',
    description: 'Франко завод — продавец передает товар покупателю на своей территории',
    group: 'Любой вид транспорта',
  },
  {
    code: 'FCA',
    numericCode: '02',
    name: 'Free Carrier',
    description: 'Франко перевозчик — продавец передает товар перевозчику',
    group: 'Любой вид транспорта',
  },
  {
    code: 'CPT',
    numericCode: '07',
    name: 'Carriage Paid To',
    description: 'Перевозка оплачена до — продавец оплачивает перевозку до места назначения',
    group: 'Любой вид транспорта',
  },
  {
    code: 'CIP',
    numericCode: '08',
    name: 'Carriage and Insurance Paid To',
    description: 'Перевозка и страхование оплачены до — включает страховку',
    group: 'Любой вид транспорта',
  },
  {
    code: 'DAP',
    numericCode: '14',
    name: 'Delivered at Place',
    description: 'Доставка в место — продавец несет риски до места назначения',
    group: 'Любой вид транспорта',
  },
  {
    code: 'DPU',
    numericCode: '16',
    name: 'Delivered at Place Unloaded',
    description: 'Доставка в место с выгрузкой — включает разгрузку товара',
    group: 'Любой вид транспорта',
  },
  {
    code: 'DDP',
    numericCode: '13',
    name: 'Delivered Duty Paid',
    description: 'Доставка с оплатой пошлин — продавец несет все расходы включая таможню',
    group: 'Любой вид транспорта',
  },
  {
    code: 'FAS',
    numericCode: '03',
    name: 'Free Alongside Ship',
    description: 'Франко вдоль борта судна — товар размещается вдоль борта судна',
    group: 'Морской транспорт',
  },
  {
    code: 'FOB',
    numericCode: '04',
    name: 'Free on Board',
    description: 'Франко борт — товар погружен на судно, риск переходит к покупателю',
    group: 'Морской транспорт',
  },
  {
    code: 'CFR',
    numericCode: '05',
    name: 'Cost and Freight',
    description: 'Стоимость и фрахт — продавец оплачивает доставку морем',
    group: 'Морской транспорт',
  },
  {
    code: 'CIF',
    numericCode: '06',
    name: 'Cost, Insurance and Freight',
    description: 'Стоимость, страхование и фрахт — включает морское страхование',
    group: 'Морской транспорт',
  },
] as const;

interface IncotermsSelectProps {
  value?: string;
  onChange: (alphaCode: string, numericCode?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  compact?: boolean; // Показывать только код
}

export function IncotermsSelect({
  value,
  onChange,
  placeholder = 'Выберите условия поставки',
  disabled = false,
  className,
  error,
  compact = false,
}: IncotermsSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedIncoterm = React.useMemo(
    () => INCOTERMS.find((i) => i.code === value),
    [value]
  );

  // Группируем по типу транспорта
  const anyTransportTerms = INCOTERMS.filter((i) => i.group === 'Любой вид транспорта');
  const seaTransportTerms = INCOTERMS.filter((i) => i.group === 'Морской транспорт');

  const getDisplayValue = () => {
    if (!selectedIncoterm) {
      return compact ? '...' : placeholder;
    }
    return selectedIncoterm.code;
  };

  return (
    <>
      {/* Зелёный текст-триггер */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'text-green-600 hover:text-green-700 hover:underline cursor-pointer font-medium text-left truncate',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-red-500',
          !value && 'text-green-400',
          className
        )}
      >
        {getDisplayValue()}
      </button>

      {/* Модальное окно для выбора */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Выберите условия поставки (Incoterms)</DialogTitle>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder="Поиск условий..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Условия не найдены</CommandEmpty>

              <CommandGroup heading="Любой вид транспорта">
                {anyTransportTerms.map((incoterm) => (
                  <CommandItem
                    key={incoterm.code}
                    value={`${incoterm.code} ${incoterm.numericCode} ${incoterm.name} ${incoterm.description}`}
                    onSelect={() => {
                      onChange(incoterm.code, incoterm.numericCode);
                      setOpen(false);
                    }}
                    className="flex-col items-start gap-1 py-3 cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === incoterm.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="font-mono text-xs text-gray-500 mr-1">{incoterm.numericCode}</span>
                      <span className="font-medium mr-2">{incoterm.code}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="ml-2">{incoterm.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                      {incoterm.description}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Морской транспорт">
                {seaTransportTerms.map((incoterm) => (
                  <CommandItem
                    key={incoterm.code}
                    value={`${incoterm.code} ${incoterm.numericCode} ${incoterm.name} ${incoterm.description}`}
                    onSelect={() => {
                      onChange(incoterm.code, incoterm.numericCode);
                      setOpen(false);
                    }}
                    className="flex-col items-start gap-1 py-3 cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === incoterm.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="font-mono text-xs text-gray-500 mr-1">{incoterm.numericCode}</span>
                      <span className="font-medium mr-2">{incoterm.code}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="ml-2">{incoterm.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                      {incoterm.description}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Экспортируем список для использования в других местах
export { INCOTERMS };
