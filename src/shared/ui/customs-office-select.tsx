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

interface CustomsOffice {
  code: string;
  name: string;
  nameUz: string | null;
  address: string | null;
  regionCode: string | null;
}

interface CustomsOfficeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  compact?: boolean; // Показывать только код
  showFullName?: boolean; // Показывать код и название
}

// Полный классификатор таможенных постов УГТК Республики Узбекистан (2016)
const FALLBACK_CUSTOMS_OFFICES: CustomsOffice[] = [
  // Специализированный таможенный комплекс «Ташкент АЭРО»
  { code: '00101', name: 'Приграничный пост «Международный аэропорт Ташкент»', nameUz: null, address: 'Ташкент', regionCode: '00' },
  { code: '00102', name: 'Таможенный пост ВЭД «Авиа юклар»', nameUz: null, address: 'Ташкент', regionCode: '00' },
  { code: '00103', name: 'Таможенный пост ВЭД «Тузель»', nameUz: null, address: 'Ташкент', regionCode: '00' },
  { code: '00105', name: 'Приграничный пост «Учиш майдони»', nameUz: null, address: 'Ташкент', regionCode: '00' },
  
  // Республика Каракалпакстан
  { code: '35001', name: 'Приграничный пост «Аэропорт Нукус»', nameUz: null, address: 'Нукус', regionCode: '35' },
  { code: '35002', name: 'Таможенный пост ВЭД «Нукус»', nameUz: null, address: 'Нукус', regionCode: '35' },
  { code: '35003', name: 'Приграничный пост «Ходжейли»', nameUz: null, address: 'Ходжейли', regionCode: '35' },
  { code: '35004', name: 'Приграничный пост «Даут-ата»', nameUz: null, address: 'Даут-ата', regionCode: '35' },
  { code: '35009', name: 'Таможенный пост ВЭД «Турткуль»', nameUz: null, address: 'Турткуль', regionCode: '35' },
  { code: '35010', name: 'Железнодорожный приграничный пост «Каракалпакия»', nameUz: null, address: 'Каракалпакия', regionCode: '35' },
  { code: '35011', name: 'Железнодорожный приграничный пост «Найманкуль»', nameUz: null, address: 'Найманкуль', regionCode: '35' },
  { code: '35012', name: 'Таможенный пост ВЭД «Кунград»', nameUz: null, address: 'Кунград', regionCode: '35' },
  
  // Андижанская область
  { code: '03002', name: 'Приграничный комплекс «Дустлик»', nameUz: null, address: 'Андижан', regionCode: '03' },
  { code: '03003', name: 'Приграничный пост «Аэропорт Андижан»', nameUz: null, address: 'Андижан', regionCode: '03' },
  { code: '03004', name: 'Таможенный пост ВЭД «Бабур»', nameUz: null, address: 'Андижан', regionCode: '03' },
  { code: '03009', name: 'Приграничный пост «Маданият»', nameUz: null, address: 'Маданият', regionCode: '03' },
  { code: '03011', name: 'Таможенный пост ВЭД «Андижан»', nameUz: null, address: 'Андижан', regionCode: '03' },
  { code: '03014', name: 'Железнодорожный приграничный пост «Савай»', nameUz: null, address: 'Савай', regionCode: '03' },
  { code: '03015', name: 'Таможенный пост ВЭД «Асака»', nameUz: null, address: 'Асака', regionCode: '03' },
  
  // Бухарская область
  { code: '06001', name: 'Приграничный пост «Аэропорт Бухара»', nameUz: null, address: 'Бухара', regionCode: '06' },
  { code: '06002', name: 'Таможенный пост ВЭД «Когон»', nameUz: null, address: 'Когон', regionCode: '06' },
  { code: '06003', name: 'Таможенный пост ВЭД «Бухоро пахта терминали»', nameUz: null, address: 'Бухара', regionCode: '06' },
  { code: '06006', name: 'Таможенный пост ВЭД «Бухара»', nameUz: null, address: 'Бухара', regionCode: '06' },
  { code: '06007', name: 'Таможенный пост ВЭД «Коровулбозор»', nameUz: null, address: 'Коровулбозор', regionCode: '06' },
  { code: '06008', name: 'Таможенный пост ВЭД «Гиждуван»', nameUz: null, address: 'Гиждуван', regionCode: '06' },
  { code: '06009', name: 'Таможенный пост ВЭД «Коракуль»', nameUz: null, address: 'Коракуль', regionCode: '06' },
  { code: '06010', name: 'Приграничный комплекс «Алат»', nameUz: null, address: 'Алат', regionCode: '06' },
  { code: '06011', name: 'Железнодорожный приграничный пост «Ходжедавлат»', nameUz: null, address: 'Ходжедавлат', regionCode: '06' },
  
  // Джизакская область
  { code: '08004', name: 'Таможенный пост ВЭД «Джизак»', nameUz: null, address: 'Джизак', regionCode: '08' },
  
  // Кашкадарьинская область
  { code: '10001', name: 'Таможенный пост ВЭД «Кашкадарья»', nameUz: null, address: 'Карши', regionCode: '10' },
  { code: '10002', name: 'Таможенный пост ВЭД «Насаф»', nameUz: null, address: 'Карши', regionCode: '10' },
  { code: '10003', name: 'Железнодорожный приграничный пост «Карши»', nameUz: null, address: 'Карши', regionCode: '10' },
  { code: '10005', name: 'Таможенный пост ВЭД «Муборак»', nameUz: null, address: 'Муборак', regionCode: '10' },
  { code: '10006', name: 'Таможенный пост ВЭД «Китаб»', nameUz: null, address: 'Китаб', regionCode: '10' },
  { code: '10007', name: 'Таможенный пост ВЭД «Камаши-Гузор»', nameUz: null, address: 'Камаши', regionCode: '10' },
  { code: '10008', name: 'Приграничный пост «Карши-Керки»', nameUz: null, address: 'Карши', regionCode: '10' },
  { code: '10010', name: 'Таможенный пост ВЭД «Карши-тола»', nameUz: null, address: 'Карши', regionCode: '10' },
  { code: '10011', name: 'Таможенный пост ВЭД «Талимаржон»', nameUz: null, address: 'Талимаржон', regionCode: '10' },
  { code: '10012', name: 'Приграничный пост «Аэропорт Карши»', nameUz: null, address: 'Карши', regionCode: '10' },
  
  // Навоийская область
  { code: '12001', name: 'Таможенный пост ВЭД «Тинчлик»', nameUz: null, address: 'Навои', regionCode: '12' },
  { code: '12002', name: 'Приграничный пост «Аэропорт Навои»', nameUz: null, address: 'Навои', regionCode: '12' },
  { code: '12003', name: 'Таможенный пост ВЭД «Навои»', nameUz: null, address: 'Навои', regionCode: '12' },
  { code: '12004', name: 'Таможенный пост ВЭД «Навои азот»', nameUz: null, address: 'Навои', regionCode: '12' },
  { code: '12008', name: 'Таможенный пост ВЭД «Зарафшон»', nameUz: null, address: 'Зарафшон', regionCode: '12' },
  { code: '12009', name: 'Таможенный пост ВЭД «Учкудук»', nameUz: null, address: 'Учкудук', regionCode: '12' },
  { code: '12012', name: 'Таможенный пост ВЭД «Навои индустриальный»', nameUz: null, address: 'Навои', regionCode: '12' },
  { code: '12013', name: 'Таможенный пост ВЭД «Навои логистика»', nameUz: null, address: 'Навои', regionCode: '12' },
  
  // Наманганская область
  { code: '14002', name: 'Приграничный пост «Аэропорт Наманган»', nameUz: null, address: 'Наманган', regionCode: '14' },
  { code: '14003', name: 'Приграничный пост «Учкурган»', nameUz: null, address: 'Учкурган', regionCode: '14' },
  { code: '14004', name: 'Приграничный пост «Касансай»', nameUz: null, address: 'Касансай', regionCode: '14' },
  { code: '14010', name: 'Таможенный пост ВЭД «Наманган»', nameUz: null, address: 'Наманган', regionCode: '14' },
  
  // Самаркандская область
  { code: '18001', name: 'Приграничный пост «Аэропорт Самарканд»', nameUz: null, address: 'Самарканд', regionCode: '18' },
  { code: '18005', name: 'Таможенный пост ВЭД «Самарканд»', nameUz: null, address: 'Самарканд', regionCode: '18' },
  { code: '18006', name: 'Таможенный пост ВЭД «Каттакурган»', nameUz: null, address: 'Каттакурган', regionCode: '18' },
  { code: '18007', name: 'Таможенный пост ВЭД «Улугбек»', nameUz: null, address: 'Самарканд', regionCode: '18' },
  
  // Сурхандарьинская область
  { code: '22002', name: 'Приграничный пост «Аэропорт Термез»', nameUz: null, address: 'Термез', regionCode: '22' },
  { code: '22003', name: 'Приграничный комплекс «Сариасия»', nameUz: null, address: 'Сариасия', regionCode: '22' },
  { code: '22004', name: 'Железнодорожный приграничный пост «Сариасия»', nameUz: null, address: 'Сариасия', regionCode: '22' },
  { code: '22005', name: 'Таможенный пост ВЭД «Термез»', nameUz: null, address: 'Термез', regionCode: '22' },
  { code: '22006', name: 'Таможенный пост ВЭД «Денов»', nameUz: null, address: 'Денов', regionCode: '22' },
  { code: '22010', name: 'Железнодорожный приграничный пост «Галаба»', nameUz: null, address: 'Галаба', regionCode: '22' },
  { code: '22011', name: 'Таможенный пост ВЭД «Даре порти»', nameUz: null, address: 'Термез', regionCode: '22' },
  { code: '22013', name: 'Таможенный пост ВЭД «Жаркурган»', nameUz: null, address: 'Жаркурган', regionCode: '22' },
  { code: '22015', name: 'Железнодорожный приграничный пост «Болдир»', nameUz: null, address: 'Болдир', regionCode: '22' },
  { code: '22017', name: 'Приграничный комплекс «Айритом»', nameUz: null, address: 'Айритом', regionCode: '22' },
  
  // Сырдарьинская область
  { code: '24003', name: 'Таможенный пост ВЭД «Хавас»', nameUz: null, address: 'Хавас', regionCode: '24' },
  { code: '24004', name: 'Приграничный пост «Сырдарья»', nameUz: null, address: 'Сырдарья', regionCode: '24' },
  { code: '24009', name: 'Таможенный пост ВЭД «Гулистан»', nameUz: null, address: 'Гулистан', regionCode: '24' },
  { code: '24010', name: 'Таможенный пост ВЭД «Сайхун»', nameUz: null, address: 'Сайхун', regionCode: '24' },
  
  // Ташкентская область
  { code: '27001', name: 'Приграничный пост «Яллама»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  { code: '27008', name: 'Приграничный пост «Навои»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  { code: '27009', name: 'Приграничный пост «С. Наджимов»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  { code: '27011', name: 'Приграничный пост «Ойбек»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  { code: '27014', name: 'Таможенный пост ВЭД «Чирчик»', nameUz: null, address: 'Чирчик', regionCode: '27' },
  { code: '27015', name: 'Таможенный пост ВЭД «Алмалык»', nameUz: null, address: 'Алмалык', regionCode: '27' },
  { code: '27016', name: 'Таможенный пост ВЭД «Янгийуль»', nameUz: null, address: 'Янгийуль', regionCode: '27' },
  { code: '27018', name: 'Таможенный пост ВЭД «Бекобод»', nameUz: null, address: 'Бекобод', regionCode: '27' },
  { code: '27019', name: 'Таможенный пост ВЭД «Назарбек»', nameUz: null, address: 'Назарбек', regionCode: '27' },
  { code: '27020', name: 'Таможенный пост ВЭД «Келес»', nameUz: null, address: 'Келес', regionCode: '27' },
  { code: '27021', name: 'Приграничный комплекс «Гишткуприк»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  { code: '27023', name: 'Приграничный пост «Фархад»', nameUz: null, address: 'Фархад', regionCode: '27' },
  { code: '27024', name: 'Железнодорожный приграничный пост «Бекабад»', nameUz: null, address: 'Бекабад', regionCode: '27' },
  { code: '27028', name: 'Таможенный пост ВЭД «Ангрен»', nameUz: null, address: 'Ангрен', regionCode: '27' },
  { code: '27029', name: 'Железнодорожный приграничный пост «Узбекистан»', nameUz: null, address: 'Ташкент', regionCode: '27' },
  
  // Ферганская область
  { code: '30001', name: 'Приграничный пост «Аэропорт Фергана»', nameUz: null, address: 'Фергана', regionCode: '30' },
  { code: '30002', name: 'Таможенный пост ВЭД «Коканд»', nameUz: null, address: 'Коканд', regionCode: '30' },
  { code: '30003', name: 'Таможенный пост ВЭД «Кувасой»', nameUz: null, address: 'Кувасой', regionCode: '30' },
  { code: '30004', name: 'Приграничный пост «Фергана»', nameUz: null, address: 'Фергана', regionCode: '30' },
  { code: '30005', name: 'Приграничный пост «Андархан»', nameUz: null, address: 'Андархан', regionCode: '30' },
  { code: '30006', name: 'Приграничный пост «Риштон»', nameUz: null, address: 'Риштон', regionCode: '30' },
  { code: '30007', name: 'Приграничный пост «Укчи»', nameUz: null, address: 'Укчи', regionCode: '30' },
  { code: '30009', name: 'Таможенный пост ВЭД «Водий»', nameUz: null, address: 'Водий', regionCode: '30' },
  { code: '30010', name: 'Приграничный пост «Узбекистан»', nameUz: null, address: 'Фергана', regionCode: '30' },
  { code: '30012', name: 'Приграничный пост «Сох»', nameUz: null, address: 'Сох', regionCode: '30' },
  { code: '30015', name: 'Таможенный пост ВЭД «Киргули»', nameUz: null, address: 'Киргули', regionCode: '30' },
  { code: '30017', name: 'Таможенный пост ВЭД «Маргилан»', nameUz: null, address: 'Маргилан', regionCode: '30' },
  { code: '30018', name: 'Железнодорожный приграничный пост «Бешарык»', nameUz: null, address: 'Бешарык', regionCode: '30' },
  
  // Хорезмская область
  { code: '33001', name: 'Приграничный пост «Шават»', nameUz: null, address: 'Шават', regionCode: '33' },
  { code: '33004', name: 'Приграничный пост «Дустлик»', nameUz: null, address: 'Ургенч', regionCode: '33' },
  { code: '33005', name: 'Таможенный пост ВЭД «Хоразм тола»', nameUz: null, address: 'Ургенч', regionCode: '33' },
  { code: '33006', name: 'Железнодорожный приграничный пост «Ургенч»', nameUz: null, address: 'Ургенч', regionCode: '33' },
  { code: '33007', name: 'Таможенный пост ВЭД «Ургенч»', nameUz: null, address: 'Ургенч', regionCode: '33' },
  { code: '33011', name: 'Приграничный пост «Аэропорт Ургенч»', nameUz: null, address: 'Ургенч', regionCode: '33' },
  
  // г. Ташкент
  { code: '26002', name: 'Таможенный пост ВЭД «Ташкент-товарный»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26003', name: 'Таможенный пост ВЭД «Арк булак»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26004', name: 'Таможенный пост ВЭД «Чукурсай»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26005', name: 'Таможенный пост ВЭД «Чет эл ваколатхоналари»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26006', name: 'Таможенный пост ВЭД «Энергия»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26007', name: 'Таможенный пост ВЭД «Бош почтамт»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26009', name: 'Железнодорожный приграничный пост «Келес»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26010', name: 'Таможенный пост ВЭД «Сергели»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26012', name: 'Таможенный пост ВЭД «Файзабад»', nameUz: null, address: 'Ташкент', regionCode: '26' },
  { code: '26013', name: 'Железнодорожный приграничный пост «Техническая контора Чукурсай»', nameUz: null, address: 'Ташкент', regionCode: '26' },
];

export function CustomsOfficeSelect({
  value,
  onChange,
  placeholder = 'Выберите таможенный орган',
  disabled = false,
  className,
  error,
  compact = false,
  showFullName = false,
}: CustomsOfficeSelectProps) {
  const [open, setOpen] = React.useState(false);

  const offices = FALLBACK_CUSTOMS_OFFICES;

  const selectedOffice = React.useMemo(
    () => offices.find((o) => o.code === value),
    [offices, value]
  );

  const getDisplayValue = () => {
    if (!selectedOffice) {
      return compact ? '...' : placeholder;
    }
    
    // Показываем код и название
    if (showFullName) {
      return `${selectedOffice.code} - ${selectedOffice.name}`;
    }
    
    return selectedOffice.code;
  };

  return (
    <>
      {/* Текст-триггер: зелёный для выбора, чёрный после выбора (если showFullName) */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'hover:underline cursor-pointer font-medium text-left truncate',
          // Если выбрано и показываем полное имя - чёрный текст, иначе зелёный
          selectedOffice && showFullName ? 'text-black hover:text-gray-700' : 'text-green-600 hover:text-green-700',
          !showFullName && 'font-mono',
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
            <DialogTitle>Выберите таможенный орган</DialogTitle>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder="Поиск по коду или названию..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Таможенный пост не найден</CommandEmpty>
              <CommandGroup>
                {offices.map((office) => (
                  <CommandItem
                    key={office.code}
                    value={`${office.code} ${office.name} ${office.address || ''}`}
                    onSelect={() => {
                      onChange(office.code);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === office.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {office.code}
                        </span>
                        <span className="truncate text-sm">{office.name}</span>
                      </div>
                    </div>
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
