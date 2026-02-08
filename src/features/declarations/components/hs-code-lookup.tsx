'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/shared/hooks/use-debounce';

interface HSCode {
  code: string;
  description: string;
  descriptionUz: string | null;
  unit: string | null;
  supplementaryUnit: string | null;
  dutyRate: number | null;
  vatRate: number | null;
  exciseRate: number | null;
}

interface HSCodeLookupProps {
  value?: string;
  onChange: (code: string, description?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

async function searchHSCodes(query: string): Promise<HSCode[]> {
  if (!query || query.length < 2) {
    const response = await fetch('/api/references/hs-codes?limit=10');
    if (!response.ok) throw new Error('Ошибка поиска');
    return response.json();
  }

  const response = await fetch(`/api/references/hs-codes?search=${encodeURIComponent(query)}&limit=20`);
  if (!response.ok) throw new Error('Ошибка поиска');
  return response.json();
}

export function HSCodeLookup({
  value,
  onChange,
  placeholder = 'Поиск кода ТН ВЭД',
  disabled = false,
  className,
  error,
}: HSCodeLookupProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: hsCodes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['hsCodes', debouncedSearch],
    queryFn: () => searchHSCodes(debouncedSearch),
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  const selectedCode = React.useMemo(
    () => hsCodes.find((c) => c.code === value),
    [hsCodes, value]
  );

  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return `${rate}%`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className
          )}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <span className="font-mono font-medium">{value}</span>
              {selectedCode && (
                <>
                  <span className="text-muted-foreground">—</span>
                  <span className="truncate text-xs">{selectedCode.description}</span>
                </>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Введите код или описание товара..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <CommandEmpty>Ошибка поиска кодов ТН ВЭД</CommandEmpty>
            ) : hsCodes.length === 0 ? (
              <CommandEmpty>
                {search.length < 2 ? 'Введите минимум 2 символа' : 'Коды не найдены'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {hsCodes.map((hsCode) => (
                  <CommandItem
                    key={hsCode.code}
                    value={hsCode.code}
                    onSelect={() => {
                      onChange(hsCode.code, hsCode.description);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex flex-col items-start py-3"
                  >
                    <div className="flex items-center w-full gap-2">
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          value === hsCode.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="font-mono font-medium text-primary">{hsCode.code}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {hsCode.unit || 'шт'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 line-clamp-2">
                      {hsCode.description}
                    </p>
                    <div className="flex gap-4 pl-6 mt-1 text-xs">
                      <span className="text-muted-foreground">
                        Пошлина: <span className="text-foreground">{formatRate(hsCode.dutyRate)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        НДС: <span className="text-foreground">{formatRate(hsCode.vatRate)}</span>
                      </span>
                      {hsCode.exciseRate !== null && hsCode.exciseRate > 0 && (
                        <span className="text-muted-foreground">
                          Акциз: <span className="text-foreground">{formatRate(hsCode.exciseRate)}</span>
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
