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

interface Currency {
  code: string;
  numCode: string;
  name: string;
  symbol: string;
}

interface CurrencySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  showRate?: boolean;
  compact?: boolean;
  showNumericCode?: boolean;
}

// Основные валюты с цифровыми кодами ISO 4217
export const CURRENCIES: Currency[] = [
  { code: 'USD', numCode: '840', name: 'Доллар США', symbol: '$' },
  { code: 'EUR', numCode: '978', name: 'Евро', symbol: '€' },
  { code: 'RUB', numCode: '643', name: 'Российский рубль', symbol: '₽' },
  { code: 'UZS', numCode: '860', name: 'Узбекский сум', symbol: 'сум' },
  { code: 'CNY', numCode: '156', name: 'Китайский юань', symbol: '¥' },
  { code: 'GBP', numCode: '826', name: 'Фунт стерлингов', symbol: '£' },
  { code: 'JPY', numCode: '392', name: 'Японская иена', symbol: '¥' },
  { code: 'CHF', numCode: '756', name: 'Швейцарский франк', symbol: 'CHF' },
  { code: 'KZT', numCode: '398', name: 'Казахстанский тенге', symbol: '₸' },
  { code: 'KRW', numCode: '410', name: 'Южнокорейская вона', symbol: '₩' },
  { code: 'TRY', numCode: '949', name: 'Турецкая лира', symbol: '₺' },
  { code: 'AED', numCode: '784', name: 'Дирхам ОАЭ', symbol: 'د.إ' },
  { code: 'INR', numCode: '356', name: 'Индийская рупия', symbol: '₹' },
  { code: 'KGS', numCode: '417', name: 'Кыргызский сом', symbol: 'с' },
  { code: 'TJS', numCode: '972', name: 'Таджикский сомони', symbol: 'SM' },
  { code: 'TMT', numCode: '934', name: 'Туркменский манат', symbol: 'm' },
  { code: 'AFN', numCode: '971', name: 'Афганский афгани', symbol: '؋' },
  { code: 'IRR', numCode: '364', name: 'Иранский риал', symbol: '﷼' },
  { code: 'PKR', numCode: '586', name: 'Пакистанская рупия', symbol: '₨' },
  { code: 'CAD', numCode: '124', name: 'Канадский доллар', symbol: 'C$' },
  { code: 'AUD', numCode: '036', name: 'Австралийский доллар', symbol: 'A$' },
  { code: 'SGD', numCode: '702', name: 'Сингапурский доллар', symbol: 'S$' },
  { code: 'HKD', numCode: '344', name: 'Гонконгский доллар', symbol: 'HK$' },
  { code: 'PLN', numCode: '985', name: 'Польский злотый', symbol: 'zł' },
  { code: 'CZK', numCode: '203', name: 'Чешская крона', symbol: 'Kč' },
  { code: 'SEK', numCode: '752', name: 'Шведская крона', symbol: 'kr' },
  { code: 'NOK', numCode: '578', name: 'Норвежская крона', symbol: 'kr' },
  { code: 'DKK', numCode: '208', name: 'Датская крона', symbol: 'kr' },
  { code: 'UAH', numCode: '980', name: 'Украинская гривна', symbol: '₴' },
  { code: 'BYN', numCode: '933', name: 'Белорусский рубль', symbol: 'Br' },
];

export function CurrencySelect({
  value,
  onChange,
  placeholder = 'Выберите валюту',
  disabled = false,
  className,
  error,
  compact = false,
  showNumericCode = false,
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCurrency = React.useMemo(
    () => CURRENCIES.find((c) => c.code === value),
    [value]
  );

  const getDisplayValue = () => {
    if (!selectedCurrency) {
      return compact || showNumericCode ? '...' : placeholder;
    }

    if (showNumericCode) {
      return selectedCurrency.numCode;
    }

    if (compact) {
      return selectedCurrency.code;
    }

    return selectedCurrency.code;
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
        <DialogContent className="sm:max-w-[450px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Выберите валюту</DialogTitle>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder="Поиск валюты..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Валюта не найдена</CommandEmpty>
              <CommandGroup>
                {CURRENCIES.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.numCode} ${currency.name}`}
                    onSelect={() => {
                      onChange(currency.code);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === currency.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-medium mr-2 w-10">{currency.code}</span>
                    <span className="text-muted-foreground mr-2">({currency.numCode})</span>
                    <span className="truncate">{currency.name}</span>
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
