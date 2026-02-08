'use client';

import * as React from 'react';
import { UseFormReturn, useFieldArray, useWatch, useFormState, FieldErrors } from 'react-hook-form';
import { Plus, Trash2, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form';
import { CountrySelect, COUNTRIES } from '@/shared/ui/country-select';
import { CurrencySelect, CURRENCIES } from '@/shared/ui/currency-select';
import { CustomsOfficeSelect } from '@/shared/ui/customs-office-select';
import { LocationSelect } from '@/shared/ui/location-select';
import { IncotermsSelect } from '@/shared/ui/incoterms-select';
import { ModalSelect } from '@/shared/ui/modal-select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { TRANSPORT_TYPES } from '../schemas';
import { 
  PREVIOUS_DOCUMENT_TYPES, 
  PREVIOUS_DOCUMENT_RULES,
  TRANSACTION_NATURE_CODES,
  UNIT_CODES,
  PREFERENCE_CODES,
  DUTY_RATES,
  DUTY_RATES_BY_HS_GROUP,
  PREFERENTIAL_COUNTRIES,
  INCOTERMS_GROUPS
} from '@/shared/constants/gtd-reference';
import { Graph2ExporterForm } from './graph2-exporter-form';

// Типы таможенных режимов
const CUSTOMS_REGIMES = [
  { code: '10', abbr: 'ЭК', direction: 'ЭК', name: 'Экспорт' },
  { code: '11', abbr: 'РЭ', direction: 'ЭК', name: 'Реэкспорт' },
  { code: '31', abbr: 'ВВЗ', direction: 'ЭК', name: 'Временный вывоз' },
  { code: '40', abbr: 'ИМ', direction: 'ИМ', name: 'Импорт' },
  { code: '41', abbr: 'РИ', direction: 'ИМ', name: 'Реимпорт' },
  { code: '31', abbr: 'ВВВ', direction: 'ИМ', name: 'Временный ввоз' },
  { code: '51', abbr: 'ПВ', direction: 'ИМ', name: 'Переработка на тер.' },
  { code: '61', abbr: 'ПЭ', direction: 'ЭК', name: 'Переработка вне тер.' },
  { code: '70', abbr: 'ТС', direction: 'ИМ', name: 'Временное хранение' },
  { code: '71', abbr: 'СТ', direction: 'ИМ', name: 'Свободная зона' },
  { code: '72', abbr: 'БТ', direction: 'ИМ', name: 'Беспошлинная торговля' },
  { code: '73', abbr: 'СС', direction: 'ИМ', name: 'Свободный склад' },
  { code: '74', abbr: 'СВХ', direction: 'ИМ', name: 'Таможенный склад' },
  { code: '75', abbr: 'ОГ', direction: 'ИМ', name: 'Отказ в пользу гос.' },
  { code: '76', abbr: 'УН', direction: 'ИМ', name: 'Уничтожение' },
  { code: '80', abbr: 'ТТ', direction: 'ТТ', name: 'Транзит' },
] as const;

/**
 * Конфигурация режимов: автозаполнение и валидация
 * При выборе режима форма автоматически адаптируется
 */
interface RegimeConfig {
  /** Автозаполняемые поля */
  autoFill: {
    dispatchCountry?: string;      // Графа 15 - Страна отправления
    dispatchCountryCode?: string;  // Графа 15а - Код страны отправления
    destinationCountry?: string;   // Графа 17 - Страна назначения
    destinationCountryCode?: string; // Графа 17а - Код страны назначения
    exporterCountry?: string;      // Страна экспортера
  };
  /** Подсказки для пользователя */
  hints: {
    graph2?: string;  // Подсказка для графы 2
    graph8?: string;  // Подсказка для графы 8
    graph9?: string;  // Подсказка для графы 9
  };
  /** Какие графы не заполняются */
  disabledGraphs?: string[];
}

const REGIME_CONFIGS: Record<string, RegimeConfig> = {
  // Экспорт - товары вывозятся из Узбекистана
  'Экспорт': {
    autoFill: {
      dispatchCountry: 'UZ',
      dispatchCountryCode: '860',
      exporterCountry: 'UZ',
    },
    hints: {
      graph2: 'Экспортер — резидент Узбекистана',
      graph8: 'Получатель — иностранное лицо',
      graph9: 'Лицо, ответственное за финансовое урегулирование',
    },
    // Графы НЕ входящие в список обязательных для экспорта (см. gtd-export-10.mdc)
    // Обязательные: 1, 2, 3, 5, 7, 8, 9, 11, 12, 13, 14, 17, 17a, 18, 19, 20, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 54, «С»
    // Примечание: 15/15a автозаполняются как UZ и показываются readonly
    disabledGraphs: ['4', '6', '10', '16', '21', '27', '36', '51', '52', '53'],
  },
  // Реэкспорт - обратный вывоз ранее ввезённых товаров
  'Реэкспорт': {
    autoFill: {
      dispatchCountry: 'UZ',
      dispatchCountryCode: '860',
      exporterCountry: 'UZ',
    },
    hints: {
      graph2: 'Экспортер — лицо, осуществляющее реэкспорт',
      graph8: 'Получатель — иностранное лицо',
      graph9: 'Лицо, ответственное за финансовое урегулирование',
    },
    // Реэкспорт: те же отключённые графы как экспорт + дополнительно 39, 43, 48
    // Обязательные: 1, 2, 3, 5, 7, 8, 9, 11, 12, 13, 14, 17, 17a, 18, 19, 20, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 40, 41, 42, 44, 45, 46, 47, 49, 50, 54, «С»
    // НЕ заполняются: 39 (квота), 43 (метод), 48 (отсрочка)
    disabledGraphs: ['4', '6', '10', '16', '21', '27', '36', '39', '43', '48', '51', '52', '53'],
  },
  // Импорт - товары ввозятся в Узбекистан (выпуск для свободного обращения)
  'Импорт': {
    autoFill: {
      // НЕ заполняются: destinationCountry/Code (графы 17/17a убраны для импорта)
      // Графы 15/15a — заполняются пользователем (страна отправления)
    },
    hints: {
      graph2: 'Экспортер — иностранное лицо (отправитель товаров)',
      graph8: 'Получатель — резидент Узбекистана (импортёр)',
      graph9: 'Лицо, ответственное за финансовое урегулирование (резидент РУз)',
    },
    // Обязательные: 1,2,3,5,7,8,9,11,12,13,14,15,15а,18,19,20,21,22,23,24,25,26,28,29,30,31,32,33,34,35,37,38,39,40,41,42,43,44,45,46,47,48,49,50,54,«С»
    // НЕ заполняются: 4,6,10,16,17,17a,27,51,52,53
    disabledGraphs: ['4', '6', '10', '16', '27', '51', '52', '53'],
  },
  // Реимпорт - обратный ввоз ранее вывезённых товаров
  'Реимпорт': {
    autoFill: {
      destinationCountry: 'Узбекистан',
      destinationCountryCode: '860',
    },
    hints: {
      graph2: 'Экспортер — лицо, которому возвращаются товары',
      graph8: 'Получатель — резидент Узбекистана',
    },
  },
  // Временный вывоз — товары временно используются за рубежом
  'Временный вывоз': {
    autoFill: {
      exporterCountry: 'UZ',
      // НЕ заполняются: dispatchCountry/dispatchCountryCode (графа 15/15а)
    },
    hints: {
      graph2: 'Экспортер — резидент Узбекистана (лицо, временно вывозящее товары)',
      graph8: 'Получатель — иностранное лицо (временный)',
      graph9: '⭐ Лицо, получившее разрешение на временный вывоз товаров',
    },
    // Обязательные: 1,2,3,5,7,8,9,11,12,13,14,17,17а,18,19,20,21,22,23,24,25,26,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,49,50,54,«B»,«C»
    // НЕ заполняются: 4,6,10,15,15a,16,27,39,48,51,52,53
    disabledGraphs: ['4', '6', '10', '16', '27', '39', '48', '51', '52', '53'],
  },
  // Временный ввоз
  'Временный ввоз': {
    autoFill: {
      destinationCountry: 'Узбекистан',
      destinationCountryCode: '860',
    },
    hints: {
      graph2: 'Экспортер — иностранное лицо',
      graph8: 'Получатель — резидент Узбекистана (временно)',
    },
  },
  // Транзит
  'Транзит': {
    autoFill: {},
    hints: {
      graph2: 'Отправитель транзитного груза',
      graph8: 'Получатель транзитного груза',
    },
    disabledGraphs: ['9'], // Графа 9 не заполняется при транзите
  },
  // Переработка на таможенной территории
  'Переработка на тер.': {
    autoFill: {
      destinationCountry: 'Узбекистан',
      destinationCountryCode: '860',
    },
    hints: {
      graph2: 'Экспортер — иностранное лицо',
      graph8: 'Получатель — лицо, осуществляющее переработку',
    },
  },
  // Переработка вне таможенной территории
  'Переработка вне тер.': {
    autoFill: {
      dispatchCountry: 'UZ',
      dispatchCountryCode: '860',
    },
    hints: {
      graph2: 'Экспортер — резидент Узбекистана',
      graph8: 'Получатель — иностранное лицо (переработчик)',
    },
  },
};

/**
 * Описания всех граф ГТД для tooltips
 */
const GRAPH_DESCRIPTIONS: Record<string, { title: string; description: string; fields?: string[] }> = {
  '1': {
    title: 'Тип декларации',
    description: 'Выберите таможенный режим (экспорт, импорт, транзит и др.)',
    fields: ['Код режима (2 цифры)', 'Аббревиатура режима'],
  },
  '2': {
    title: 'Экспортер/Грузоотправитель',
    description: 'Лицо, отправляющее товары',
    fields: ['Наименование/ФИО', 'Адрес', 'ИНН (9 цифр) или ПИНФЛ (14 цифр)', 'Код страны (2 буквы)'],
  },
  '3': {
    title: 'Добавочные листы',
    description: 'Номер текущего листа / общее количество листов',
    fields: ['Формат: 1/3 (лист 1 из 3)'],
  },
  '4': {
    title: 'Отгрузочная спецификация',
    description: 'Ссылка на отгрузочную спецификацию',
    fields: ['Номер документа'],
  },
  '5': {
    title: 'Всего наименований товаров',
    description: 'Общее количество товарных позиций в декларации',
    fields: ['Число (автоматически)'],
  },
  '6': {
    title: 'Количество мест',
    description: 'Общее количество грузовых мест',
    fields: ['Число'],
  },
  '7': {
    title: 'Регистрационный номер ГТД',
    description: 'Присваивается таможенным органом при регистрации',
    fields: ['Код поста/дата/номер'],
  },
  '8': {
    title: 'Импортер/Грузополучатель',
    description: 'Лицо, получающее товары',
    fields: ['Наименование/ФИО', 'Адрес', 'ИНН (9 цифр) или ПИНФЛ (14 цифр)', 'Код страны (2 буквы)'],
  },
  '9': {
    title: 'Лицо, ответственное за финансовое урегулирование',
    description: 'Плательщик по внешнеторговому контракту',
    fields: ['Наименование/ФИО', 'ИНН', 'Адрес'],
  },
  '10': {
    title: 'Страна первого назначения',
    description: 'Первая страна назначения товаров',
    fields: ['Код страны'],
  },
  '11': {
    title: 'Торгующая страна',
    description: 'Страна контрагента по контракту',
    fields: ['Код страны (3 цифры)'],
  },
  '12': {
    title: 'Общая таможенная стоимость',
    description: 'Сумма таможенных стоимостей всех товаров',
    fields: ['Сумма в валюте контракта'],
  },
  '13': {
    title: 'Курс доллара США',
    description: 'Курс USD на дату декларирования',
    fields: ['Курс ЦБ'],
  },
  '14': {
    title: 'Декларант/Таможенный брокер',
    description: 'Лицо, подающее декларацию',
    fields: ['Наименование', 'Адрес', 'ИНН'],
  },
  '15': {
    title: 'Страна отправления',
    description: 'Страна, откуда отправлены товары',
    fields: ['Код страны (2 буквы)', 'Код страны (3 цифры)'],
  },
  '16': {
    title: 'Страна происхождения',
    description: 'Страна производства товаров',
    fields: ['Название страны'],
  },
  '17': {
    title: 'Страна назначения',
    description: 'Конечная страна назначения товаров',
    fields: ['Название страны', 'Код страны (3 цифры)'],
  },
  '18': {
    title: 'Транспортное средство при отправлении/прибытии',
    description: 'Данные о транспорте',
    fields: ['Вид транспорта', 'Номер ТС', 'Код страны ТС'],
  },
  '19': {
    title: 'Контейнер',
    description: 'Признак перевозки в контейнере',
    fields: ['0 — без контейнера', '1 — в контейнере'],
  },
  '20': {
    title: 'Условия поставки',
    description: 'Условия Incoterms',
    fields: ['Код условия', 'Базис поставки', 'Пункт'],
  },
  '21': {
    title: 'Транспортное средство на границе',
    description: 'ТС, пересекающее границу',
    fields: ['Номер ТС'],
  },
  '22': {
    title: 'Валюта и общая фактурная стоимость',
    description: 'Валюта контракта и сумма',
    fields: ['Код валюты (3 буквы)', 'Сумма'],
  },
  '23': {
    title: 'Курс валюты',
    description: 'Курс валюты контракта к UZS',
    fields: ['Единиц / Курс'],
  },
  '24': {
    title: 'Характер сделки',
    description: 'Тип внешнеторговой операции',
    fields: ['Код сделки (2 цифры)'],
  },
  '25': {
    title: 'Вид транспорта на границе',
    description: 'Код вида транспорта при пересечении границы',
    fields: ['Код (2 цифры)'],
  },
  '26': {
    title: 'Вид транспорта внутри страны',
    description: 'Код вида транспорта внутри страны',
    fields: ['Код (2 цифры)'],
  },
  '27': {
    title: 'Место погрузки/разгрузки',
    description: 'Пункт погрузки или разгрузки',
    fields: ['Название пункта'],
  },
  '28': {
    title: 'Финансовые и банковские сведения',
    description: 'Реквизиты для оплаты',
    fields: ['ИНН плательщика', 'Контракт', 'Банк', 'Адрес'],
  },
  '29': {
    title: 'Таможня на границе',
    description: 'Пункт пропуска',
    fields: ['Код таможенного поста'],
  },
  '30': {
    title: 'Местонахождение товаров',
    description: 'Где находятся товары при декларировании',
    fields: ['Адрес или код склада'],
  },
  '31': {
    title: 'Грузовые места и описание товаров',
    description: 'Детальное описание товара',
    fields: ['Описание', 'Количество мест', 'Вид упаковки', 'Маркировка'],
  },
  '32': {
    title: 'Товар №',
    description: 'Порядковый номер товара в декларации',
    fields: ['Номер (автоматически)'],
  },
  '33': {
    title: 'Код товара (ТН ВЭД)',
    description: '10-значный код товарной номенклатуры',
    fields: ['Код ТН ВЭД (10 цифр)'],
  },
  '34': {
    title: 'Код страны происхождения',
    description: 'Страна производства товара',
    fields: ['Код страны (2 буквы)'],
  },
  '35': {
    title: 'Вес брутто',
    description: 'Масса товара с упаковкой (кг)',
    fields: ['Вес в кг'],
  },
  '36': {
    title: 'Преференция',
    description: 'Код тарифной преференции',
    fields: ['Код преференции'],
  },
  '37': {
    title: 'Процедура',
    description: 'Код таможенной процедуры',
    fields: ['Заявляемый режим', 'Предшествующий режим'],
  },
  '38': {
    title: 'Вес нетто',
    description: 'Масса товара без упаковки (кг)',
    fields: ['Вес в кг'],
  },
  '39': {
    title: 'Квота',
    description: 'Сведения о квоте',
    fields: ['Номер квоты'],
  },
  '40': {
    title: 'Общая декларация/предшествующий документ',
    description: 'Ссылка на предшествующие документы',
    fields: ['Тип документа', 'Номер', 'Дата'],
  },
  '41': {
    title: 'Единица измерения',
    description: 'Дополнительная единица измерения',
    fields: ['Код единицы', 'Количество'],
  },
  '42': {
    title: 'Фактурная стоимость',
    description: 'Стоимость товара по инвойсу',
    fields: ['Сумма в валюте контракта'],
  },
  '43': {
    title: 'Метод определения таможенной стоимости',
    description: 'Код метода оценки',
    fields: ['Код метода (1-6)'],
  },
  '44': {
    title: 'Документы/дополнительная информация',
    description: 'Прилагаемые документы',
    fields: ['Тип документа', 'Номер', 'Дата'],
  },
  '45': {
    title: 'Таможенная стоимость',
    description: 'Стоимость для начисления пошлин',
    fields: ['Сумма в UZS'],
  },
  '46': {
    title: 'Статистическая стоимость',
    description: 'Стоимость для статистики в USD',
    fields: ['Сумма в USD'],
  },
  '47': {
    title: 'Исчисление таможенных пошлин и сборов',
    description: 'Расчёт платежей',
    fields: ['Вид платежа', 'Ставка', 'Сумма', 'Способ оплаты'],
  },
  '48': {
    title: 'Отсрочка платежей',
    description: 'Сведения об отсрочке/рассрочке',
    fields: ['Код', 'Срок'],
  },
  '49': {
    title: 'Наименование склада',
    description: 'Таможенный склад (при наличии)',
    fields: ['Номер лицензии'],
  },
  '50': {
    title: 'Доверитель',
    description: 'Лицо, от имени которого действует брокер',
    fields: ['Наименование', 'Подпись'],
  },
  '54': {
    title: 'Место и дата',
    description: 'Место подачи и дата декларации',
    fields: ['Город', 'Дата', 'Подпись'],
  },
};

/**
 * Компонент заголовка графы с tooltip
 */
const GraphHeader = ({ 
  graphNumber, 
  label, 
  className,
  regimeHint,
  children 
}: { 
  graphNumber: string;
  label?: string;
  className?: string;
  regimeHint?: string;
  children?: React.ReactNode;
}) => {
  const graphInfo = GRAPH_DESCRIPTIONS[graphNumber];
  const displayLabel = label || graphInfo?.title || `Графа ${graphNumber}`;
  
  return (
    <div className={cn(cellHeader, className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{displayLabel}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          <p className="font-semibold mb-1">Графа {graphNumber} — {graphInfo?.title || displayLabel}</p>
          <p className="text-[11px] opacity-90">{graphInfo?.description}</p>
          {regimeHint && (
            <p className="text-yellow-300 mt-1 text-[11px]">{regimeHint}</p>
          )}
          {graphInfo?.fields && graphInfo.fields.length > 0 && (
            <ul className="mt-1 text-[10px] list-disc list-inside opacity-80">
              {graphInfo.fields.map((field, i) => (
                <li key={i}>{field}</li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
      {children}
    </div>
  );
};

// Базовые стили
const cell = 'border border-black bg-white';
const cellHeader = 'text-[9px] leading-tight px-0.5 py-px border-b border-black bg-gray-50';
const cellContent = 'px-0.5 py-px';
const inputBase = 'h-5 text-[11px] border-0 p-0 px-0.5 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent';
const textareaBase = 'text-[11px] border-0 p-0 px-0.5 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none min-h-[24px]';

// Стиль для поля с ошибкой
const errorClass = '!bg-red-50 !border-red-500';

// Валидация ИНН Узбекистана
const validateTIN = (tin: string): { valid: boolean; message: string; type: string } => {
  if (!tin) return { valid: true, message: '', type: '' };
  const cleanTin = tin.replace(/\s/g, '');
  if (!/^\d+$/.test(cleanTin)) {
    return { valid: false, message: '!', type: '' };
  }
  if (cleanTin.length === 9) {
    return { valid: true, message: '✓', type: 'legal' };
  } else if (cleanTin.length === 14) {
    return { valid: true, message: '✓', type: 'individual' };
  } else if (cleanTin.length < 9) {
    return { valid: false, message: '...', type: '' };
  } else if (cleanTin.length > 9 && cleanTin.length < 14) {
    return { valid: false, message: '...', type: '' };
  }
  return { valid: false, message: '!', type: '' };
};

// Компонент для отображения валидации ИНН
const TINValidationBadge = ({ tin }: { tin: string }) => {
  const validation = validateTIN(tin);
  if (!tin) return null;
  
  // Показываем только если валидно или есть ошибка формата
  const cleanTin = tin.replace(/\s/g, '');
  const isIncomplete = cleanTin.length > 0 && cleanTin.length !== 9 && cleanTin.length !== 14;
  
  // Не показываем индикатор если ввод в процессе (неполный)
  if (isIncomplete && /^\d+$/.test(cleanTin)) return null;
  
  return (
    <span className={cn(
      'text-[8px] px-1 rounded ml-1',
      validation.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )} title={validation.valid ? (validation.type === 'legal' ? 'ИНН юр.лица (9 цифр)' : 'ПИНФЛ физ.лица (14 цифр)') : 'Неверный формат ИНН'}>
      {validation.message}
    </span>
  );
};

// Хелпер для проверки ошибки
const checkFieldError = (errors: FieldErrors, fieldName: unknown): boolean => {
  if (typeof fieldName !== 'string' || !fieldName) return false;
  const parts = fieldName.split('.');
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return false;
    const isArrayIndex = /^\d+$/.test(part);
    if (isArrayIndex && Array.isArray(current)) {
      current = (current as unknown[])[parseInt(part, 10)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  if (!current || typeof current !== 'object') return false;
  return 'message' in current || 'type' in current;
};

interface GTDOfficialFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  showErrors?: boolean;
  /** Поля, заполненные ИИ - будут подсвечены зелёным */
  aiFilledFields?: Set<string>;
  /** Callback когда пользователь изменяет AI-заполненное поле */
  onAIFieldEdit?: (fieldName: string) => void;
}

const REQUIRED_FIELDS = ['exporterName', 'consigneeName', 'declarationType', 'currency'];

/** CSS классы для AI-заполненных полей */
const AI_FILLED_STYLES = 'ring-2 ring-green-400 bg-green-50';
const AI_FILLED_HEADER_BADGE = 'ml-1 px-1 text-[7px] bg-green-100 text-green-700 rounded';

/** Список популярных мест поставки */
const DELIVERY_PLACES = [
  // Узбекистан
  'Ташкент', 'Самарканд', 'Бухара', 'Фергана', 'Андижан', 'Наманган', 'Карши', 'Нукус', 'Навои', 'Термез', 'Ургенч',
  // СНГ
  'Москва', 'Санкт-Петербург', 'Алматы', 'Астана', 'Бишкек', 'Душанбе', 'Ашхабад', 'Баку', 'Минск',
  // Азия
  'Пекин', 'Шанхай', 'Гуанчжоу', 'Сеул', 'Токио', 'Дубай', 'Стамбул',
  // Европа
  'Берлин', 'Гамбург', 'Варшава', 'Прага', 'Вена', 'Милан', 'Рига',
  // Порты
  'порт Владивосток', 'порт Новороссийск', 'порт Шанхай', 'порт Роттердам',
];

/** Компонент ввода места поставки с автоподсказками */
function DeliveryPlaceInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Синхронизация с внешним значением
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Фильтрация и ограничение до 5 результатов
  const filteredPlaces = React.useMemo(() => {
    if (!inputValue) return DELIVERY_PLACES.slice(0, 5);
    const lower = inputValue.toLowerCase();
    return DELIVERY_PLACES
      .filter(place => place.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (place: string) => {
    setInputValue(place);
    onChange(place);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        className="w-full h-5 px-1 text-[10px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="Место поставки"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && filteredPlaces.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-auto">
          {filteredPlaces.map((place) => (
            <div
              key={place}
              className="px-2 py-1 text-[10px] cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onMouseDown={() => handleSelect(place)}
            >
              {place}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GTDOfficialForm({ 
  form, 
  showErrors = false,
  aiFilledFields = new Set(),
  onAIFieldEdit
}: GTDOfficialFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const { errors } = useFormState({ control: form.control });
  const formValues = useWatch({ control: form.control });

  // Хелпер для проверки является ли поле AI-заполненным
  const isAIFilled = React.useCallback((fieldName: string): boolean => {
    return aiFilledFields.has(fieldName);
  }, [aiFilledFields]);

  // Обработчик изменения AI-заполненного поля
  const handleAIFieldChange = React.useCallback((fieldName: string) => {
    if (isAIFilled(fieldName) && onAIFieldEdit) {
      onAIFieldEdit(fieldName);
    }
  }, [isAIFilled, onAIFieldEdit]);

  // Компонент бейджа для AI-заполненных полей
  const AIBadge = React.useCallback(({ fieldName }: { fieldName: string }) => {
    if (!isAIFilled(fieldName)) return null;
    return <span className={AI_FILLED_HEADER_BADGE} title="Заполнено ИИ">AI</span>;
  }, [isAIFilled]);
  const items = useWatch({ control: form.control, name: 'items' });
  const declarationType = useWatch({ control: form.control, name: 'declarationType' });
  const departureTransportType = useWatch({ control: form.control, name: 'departureTransportType' });
  const tradingCountry = useWatch({ control: form.control, name: 'tradingCountry' });
  const transitDestinationCountry = useWatch({ control: form.control, name: 'transitDestinationCountry' });
  const exporterCountry = useWatch({ control: form.control, name: 'exporterCountry' });
  const consigneeCountry = useWatch({ control: form.control, name: 'consigneeCountry' });
  const dispatchCountry = useWatch({ control: form.control, name: 'dispatchCountry' });
  const transactionNature = useWatch({ control: form.control, name: 'transactionNature' });
  
  // Текущая конфигурация режима (для подсказок и валидации)
  const currentRegimeConfig = React.useMemo(() => {
    if (!declarationType) return null;
    return REGIME_CONFIGS[declarationType] || null;
  }, [declarationType]);
  
  // Проверка, отключена ли графа для текущего режима
  const isGraphDisabled = React.useCallback((graphNumber: string): boolean => {
    if (!currentRegimeConfig?.disabledGraphs) return false;
    return currentRegimeConfig.disabledGraphs.includes(graphNumber);
  }, [currentRegimeConfig]);
  
  // Флаг для предотвращения автозаполнения при начальной загрузке
  const isInitialLoadRef = React.useRef(true);
  React.useEffect(() => {
    // Сбрасываем флаг через задержку после первого рендера
    // Увеличенный таймаут для надёжной загрузки данных из БД
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  const totalInvoiceAmount = useWatch({ control: form.control, name: 'totalInvoiceAmount' });

  const isFieldEmpty = React.useCallback((fieldName: string): boolean => {
    const parts = fieldName.split('.');
    let value: unknown = formValues;
    for (const part of parts) {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'object') return true;
      const isArrayIndex = /^\d+$/.test(part);
      if (isArrayIndex && Array.isArray(value)) {
        value = (value as unknown[])[parseInt(part, 10)];
      } else {
        value = (value as Record<string, unknown>)[part];
      }
    }
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  }, [formValues]);
  
  const hasError = React.useCallback((fieldName: unknown): boolean => {
    if (typeof fieldName !== 'string') return false;
    const schemaError = checkFieldError(errors, fieldName);
    if (schemaError) return true;
    if (showErrors) {
      const isRequired = REQUIRED_FIELDS.some(reqField => {
        if (reqField === fieldName) return true;
        if (reqField.startsWith('items.0.')) {
          const pattern = reqField.replace('items.0.', 'items.\\d+.');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(fieldName);
        }
        return false;
      });
      if (isRequired && isFieldEmpty(fieldName)) return true;
    }
    return false;
  }, [errors, showErrors, isFieldEmpty]);

  // Автоматический подсчёт блока 6
  React.useEffect(() => {
    if (items && Array.isArray(items)) {
      const total = items.reduce((sum: number, item: { packageQuantity?: number }) => 
        sum + (item?.packageQuantity || 0), 0);
      form.setValue('totalPackages', total);
    }
  }, [items, form]);

  // Автоматическая синхронизация вида транспорта:
  // Экспорт: графа 18 → графы 25 и 26
  // Импорт: графа 21 → графа 25, графа 18 → графа 26
  const borderTransportType = useWatch({ control: form.control, name: 'borderTransportType' });
  
  React.useEffect(() => {
    if (declarationType === 'Импорт') {
      // Импорт: граф 25 = из графы 21, граф 26 = из графы 18
      if (borderTransportType) {
        form.setValue('borderTransportMode', borderTransportType);
      }
      if (departureTransportType) {
        form.setValue('inlandTransportMode', departureTransportType);
      }
    } else {
      // Экспорт: графа 18 → обе графы 25 и 26
      if (departureTransportType) {
        const transportCode = TRANSPORT_TYPES.find(t => t.code === departureTransportType)?.code || departureTransportType;
        form.setValue('borderTransportMode', transportCode);
        form.setValue('inlandTransportMode', transportCode);
      }
    }
  }, [departureTransportType, borderTransportType, declarationType, form]);

  // Автоматическое вычисление кода режима и синхронизация связанных полей
  // Когда меняется тип декларации, обновляются:
  // - declarationTypeCode (код режима в графе 1)
  // - procedureCode у всех товаров (графа 37)
  // - автозаполняемые поля из конфигурации режима
  React.useEffect(() => {
    if (declarationType) {
      const regime = CUSTOMS_REGIMES.find(r => r.name === declarationType);
      if (regime) {
        // Устанавливаем код режима в графе 1
        form.setValue('declarationTypeCode', regime.code);
        
        // Синхронизируем код процедуры во всех товарах (графа 37, первая часть)
        const currentItems = form.getValues('items');
        if (currentItems && Array.isArray(currentItems)) {
          currentItems.forEach((_, idx) => {
            form.setValue(`items.${idx}.procedureCode`, regime.code);
          });
        }
        
        // Применяем автозаполнение из конфигурации режима
        const regimeConfig = REGIME_CONFIGS[declarationType];
        if (regimeConfig?.autoFill) {
          const { autoFill } = regimeConfig;
          
          // Страна отправления (графа 15)
          if (autoFill.dispatchCountry) {
            form.setValue('dispatchCountry', autoFill.dispatchCountry, { shouldDirty: false });
          }
          if (autoFill.dispatchCountryCode) {
            form.setValue('dispatchCountryCode', autoFill.dispatchCountryCode, { shouldDirty: false });
          }
          
          // Страна назначения (графа 17)
          if (autoFill.destinationCountry) {
            form.setValue('transitDestinationCountry', autoFill.destinationCountry, { shouldDirty: false });
          }
          if (autoFill.destinationCountryCode) {
            form.setValue('destinationCountryCode', autoFill.destinationCountryCode, { shouldDirty: false });
          }
          
          // Страна экспортера (графа 2)
          if (autoFill.exporterCountry) {
            form.setValue('exporterCountry', autoFill.exporterCountry, { shouldDirty: false });
          }
        }
      }
    }
  }, [declarationType, form]);

  // Автоматическое вычисление числового кода торговой страны при загрузке
  // Если tradingCountry уже установлен, но tradingCountryCode пуст - вычисляем его
  React.useEffect(() => {
    // Пропускаем при начальной загрузке чтобы не затереть данные из БД
    if (isInitialLoadRef.current) return;
    if (tradingCountry) {
      const country = COUNTRIES.find(c => c.code === tradingCountry);
      if (country) {
        const currentCode = form.getValues('tradingCountryCode');
        if (!currentCode) {
          form.setValue('tradingCountryCode', country.numCode);
        }
      }
    }
  }, [tradingCountry, form]);

  // Автоматическое вычисление кода страны назначения (графа 17а)
  // Когда выбирается страна назначения (графа 17), её код автоматически отображается в 17а
  React.useEffect(() => {
    // Пропускаем при начальной загрузке чтобы не затереть данные из БД
    if (isInitialLoadRef.current) return;
    if (transitDestinationCountry) {
      const country = COUNTRIES.find(c => c.code === transitDestinationCountry);
      if (country) {
        form.setValue('destinationCountryCode', country.numCode, { shouldDirty: false });
      }
    }
  }, [transitDestinationCountry, form]);

  // Автозаполнение страны отправления (графа 15) из страны экспортера (графа 2)
  // При экспорте: страна отправления = страна экспортера
  // НЕ автозаполняем при начальной загрузке чтобы не затереть данные из БД
  React.useEffect(() => {
    if (isInitialLoadRef.current) return; // Пропускаем при начальной загрузке
    if (exporterCountry) {
      const currentDispatch = form.getValues('dispatchCountry');
      // Заполняем только если поле пустое
      if (!currentDispatch) {
        form.setValue('dispatchCountry', exporterCountry, { shouldDirty: false });
      }
    }
  }, [exporterCountry, form]);

  // Автозаполнение кода страны отправления (графа 15а) из страны отправления (графа 15)
  React.useEffect(() => {
    // Пропускаем при начальной загрузке чтобы не затереть данные из БД
    if (isInitialLoadRef.current) return;
    if (dispatchCountry) {
      const country = COUNTRIES.find(c => c.code === dispatchCountry);
      if (country) {
        form.setValue('dispatchCountryCode', country.numCode, { shouldDirty: false });
      }
    }
  }, [dispatchCountry, form]);

  // Автозаполнение страны назначения (графа 17) из страны получателя (графа 8)
  // При импорте: страна назначения = страна получателя
  // НЕ автозаполняем при начальной загрузке чтобы не затереть данные из БД
  React.useEffect(() => {
    if (isInitialLoadRef.current) return; // Пропускаем при начальной загрузке
    if (consigneeCountry) {
      const currentDestination = form.getValues('transitDestinationCountry');
      // Заполняем только если поле пустое
      if (!currentDestination) {
        form.setValue('transitDestinationCountry', consigneeCountry, { shouldDirty: false });
      }
    }
  }, [consigneeCountry, form]);

  // Получение кода режима по названию типа декларации
  const getRegimeCode = React.useCallback(() => {
    if (!declarationType) return '40';
    const regime = CUSTOMS_REGIMES.find(r => r.name === declarationType);
    return regime?.code || '40';
  }, [declarationType]);

  // ========== СВЯЗЬ ГРАФЫ 22 И 24 ==========
  
  // Валидация: предупреждение если безвозмездная сделка, но стоимость > 0
  const isGratuitousWithValue = React.useMemo(() => {
    if (!transactionNature) return false;
    const nature = TRANSACTION_NATURE_CODES.find(t => t.code === transactionNature);
    return nature && !nature.requiresPayment && (totalInvoiceAmount || 0) > 0;
  }, [transactionNature, totalInvoiceAmount]);

  // Безвозмездная сделка (код 80) - Графа 9 не заполняется
  const paymentForm = useWatch({ control: form.control, name: 'paymentForm' });
  const isGratuitousTransaction = paymentForm === '80';

  // ========== АВТОМАТИЧЕСКИЕ РАСЧЁТЫ ==========
  
  // Авто-расчёт общей фактурной стоимости (Графа 22) = сумма itemPrice всех товаров
  const watchedItems = useWatch({ control: form.control, name: 'items' }) as Array<{
    itemPrice?: number;
    customsValue?: number;
    packageQuantity?: number;
    statisticalValue?: number;
    hsCode?: string;
    originCountryCode?: string;
    dutyRate?: number;
    dutyAmount?: number;
    vatAmount?: number;
    feeAmount?: number;
    totalPayment?: number;
    preferenceCode?: string;
  }> | undefined;
  const exchangeRate = useWatch({ control: form.control, name: 'exchangeRate' });
  
  // Функция получения ставки пошлины по HS коду
  const getDutyRateByHsCode = React.useCallback((hsCode: string): number => {
    if (!hsCode || hsCode.length < 2) return DUTY_RATES.DEFAULT_DUTY_RATE;
    const hsGroup = hsCode.substring(0, 2);
    return DUTY_RATES_BY_HS_GROUP[hsGroup]?.rate ?? DUTY_RATES.DEFAULT_DUTY_RATE;
  }, []);

  // Функция получения преференции по стране происхождения
  const getPreferenceByCountry = React.useCallback((countryCode: string): string => {
    if (!countryCode) return '000';
    return PREFERENTIAL_COUNTRIES[countryCode]?.preferenceCode ?? '000';
  }, []);

  // Функция проверки нужно ли добавлять транспорт к там.стоимости
  const shouldAddTransportCost = React.useCallback((incoterm: string): boolean => {
    if (!incoterm) return false;
    // Определяем группу Incoterms по первой букве
    const firstLetter = incoterm.charAt(0).toUpperCase() as keyof typeof INCOTERMS_GROUPS;
    const group = INCOTERMS_GROUPS[firstLetter];
    if (group) {
      return group.addTransportToCustomsValue;
    }
    return false;
  }, []);
  
  // Ref для предотвращения бесконечных циклов
  const isCalculatingRef = React.useRef(false);
  const lastCalculatedRef = React.useRef<string>('');

  React.useEffect(() => {
    if (isCalculatingRef.current) return;
    if (!watchedItems || watchedItems.length === 0) return;
    
    // Создаём ключ для сравнения - только по входным данным (itemPrice, packageQuantity)
    const inputKey = watchedItems.map(item => 
      `${item?.itemPrice || 0}-${item?.packageQuantity || 0}`
    ).join('|');
    
    // Пропускаем если входные данные не изменились
    if (lastCalculatedRef.current === inputKey) return;
    lastCalculatedRef.current = inputKey;
    
    isCalculatingRef.current = true;
    
    try {
      const totalInvoice = watchedItems.reduce((sum: number, item) => sum + (parseFloat(String(item?.itemPrice)) || 0), 0);
      const currentTotalInvoice = form.getValues('totalInvoiceAmount');
      if (currentTotalInvoice !== totalInvoice) {
        form.setValue('totalInvoiceAmount', totalInvoice, { shouldDirty: false });
      }
      
      // Авто-расчёт общей таможенной стоимости (Графа 12) = сумма customsValue всех товаров
      const totalCustoms = watchedItems.reduce((sum: number, item) => sum + (parseFloat(String(item?.customsValue)) || 0), 0);
      const currentTotalCustoms = form.getValues('totalCustomsValue');
      if (currentTotalCustoms !== totalCustoms) {
        form.setValue('totalCustomsValue', totalCustoms, { shouldDirty: false });
      }
      
      // Авто-расчёт общего количества мест (Графа 6)
      const totalPackages = watchedItems.reduce((sum: number, item) => sum + (parseInt(String(item?.packageQuantity)) || 0), 0);
      const currentTotalPackages = form.getValues('totalPackages');
      if (currentTotalPackages !== totalPackages) {
        form.setValue('totalPackages', totalPackages, { shouldDirty: false });
      }
      
      // Авто-расчёт итогов платежей для Блока 47 и B
      const totalDuty = watchedItems.reduce((sum: number, item) => sum + (parseFloat(String(item?.dutyAmount)) || 0), 0);
      const totalVat = watchedItems.reduce((sum: number, item) => sum + (parseFloat(String(item?.vatAmount)) || 0), 0);
      const totalFee = watchedItems.reduce((sum: number, item) => sum + (parseFloat(String(item?.feeAmount)) || 0), 0);
      const grandTotal = totalDuty + totalVat + totalFee;
      
      // Обновляем поля для Блока 47
      form.setValue('dutyBase', totalCustoms > 0 ? Math.round(totalCustoms).toString() : '', { shouldDirty: false });
      form.setValue('totalDutyAmount', totalDuty, { shouldDirty: false });
      form.setValue('totalVatAmount', totalVat, { shouldDirty: false });
      form.setValue('totalFeeAmount', totalFee, { shouldDirty: false });
      form.setValue('calcAmount', grandTotal > 0 ? `${Math.round(grandTotal).toLocaleString('ru-RU')} сум.` : '', { shouldDirty: false });
      form.setValue('calcTotal', grandTotal > 0 ? `${Math.round(grandTotal).toLocaleString('ru-RU')} UZS` : '', { shouldDirty: false });
    } finally {
      // Сбрасываем флаг с небольшой задержкой
      setTimeout(() => {
        isCalculatingRef.current = false;
      }, 100);
    }
  }, [watchedItems, form]);

  // Функция пересчёта платежей для одного товара (вызывается вручную)
  const recalculateItemDuties = React.useCallback((idx: number) => {
    const item = form.getValues(`items.${idx}`);
    if (!item) return;
    
    const itemPrice = parseFloat(String(item.itemPrice)) || 0;
    const rate = parseFloat(String(exchangeRate)) || 1;
    const hsCode = item.hsCode || '';
    const originCountry = item.originCountryCode || '';
    const currentIncoterms = form.getValues('incotermsCode') || '';
    
    // 1. Определяем таможенную стоимость
    // Приоритет: уже введённая таможенная стоимость > расчёт из цены товара
    let customsValue = parseFloat(String(item.customsValue)) || 0;
    
    // Если таможенная стоимость не введена, рассчитываем из цены товара
    if (customsValue === 0 && itemPrice > 0) {
      const needsTransportCost = shouldAddTransportCost(currentIncoterms);
      customsValue = itemPrice * rate;
      if (needsTransportCost) {
        customsValue *= 1.05; // +5% на транспорт
      }
      customsValue = Math.round(customsValue * 100) / 100;
      form.setValue(`items.${idx}.customsValue`, customsValue);
      form.setValue(`items.${idx}.statisticalValue`, customsValue);
    }
    
    // 2. Автоподбор преференции по стране
    const suggestedPreference = getPreferenceByCountry(originCountry);
    if (suggestedPreference !== '000') {
      form.setValue(`items.${idx}.preferenceCode`, suggestedPreference);
    }
    
    // 3. Рассчитываем платежи (если есть таможенная стоимость)
    if (customsValue > 0) {
      const currentDeclarationType = form.getValues('declarationType');
      const isExport = currentDeclarationType === 'Экспорт' || currentDeclarationType === 'Реэкспорт' || currentDeclarationType === 'Временный вывоз';
      const preference = form.getValues(`items.${idx}.preferenceCode`) || '000';
      
      // === ТАМОЖЕННАЯ ПОШЛИНА ===
      let dutyRate = 0;
      let dutyAmount = 0;
      
      if (isExport) {
        // При экспорте пошлина обычно 0% (экспортные пошлины редки в РУз)
        dutyRate = 0;
        dutyAmount = 0;
      } else {
        // При импорте - по ставке из HS кода
        dutyRate = getDutyRateByHsCode(hsCode);
        // Применяем преференции
        if (preference === '200') dutyRate = 0; // Освобождение от пошлины (СНГ)
        else if (preference === '100') dutyRate = dutyRate * 0.5; // 50% скидка
        dutyAmount = Math.round(customsValue * dutyRate / 100);
      }
      
      form.setValue(`items.${idx}.dutyRate`, dutyRate);
      form.setValue(`items.${idx}.dutyAmount`, dutyAmount);
      
      // === НДС ===
      let vatRateValue = 0;
      let vatAmount = 0;
      
      if (isExport) {
        // При экспорте НДС = 0% (освобождение согласно НК РУз)
        vatRateValue = 0;
        vatAmount = 0;
      } else {
        // При импорте - 12% от (там.стоимость + пошлина)
        const vatBase = customsValue + dutyAmount;
        vatRateValue = preference === '300' ? 0 : DUTY_RATES.VAT_RATE;
        vatAmount = Math.round(vatBase * vatRateValue / 100);
      }
      
      form.setValue(`items.${idx}.vatRate`, vatRateValue as 0 | 12);
      form.setValue(`items.${idx}.vatAmount`, vatAmount);
      
      // === ТАМОЖЕННЫЙ СБОР (взимается всегда) ===
      let feeAmount = Math.round(customsValue * DUTY_RATES.CUSTOMS_FEE_RATE / 100);
      feeAmount = Math.max(feeAmount, DUTY_RATES.CUSTOMS_FEE_MIN);
      feeAmount = Math.min(feeAmount, DUTY_RATES.CUSTOMS_FEE_MAX);
      form.setValue(`items.${idx}.feeAmount`, feeAmount);
      
      // Итого платежей по товару
      form.setValue(`items.${idx}.totalPayment`, dutyAmount + vatAmount + feeAmount);
    }
  }, [form, exchangeRate, shouldAddTransportCost, getDutyRateByHsCode, getPreferenceByCountry]);

  // Функция пересчёта всех товаров
  const recalculateAllDuties = React.useCallback(() => {
    const items = form.getValues('items');
    if (!items || items.length === 0) {
      toast.warning('Добавьте товарную позицию для расчёта платежей');
      return;
    }
    
    // Пересчитываем каждую позицию
    items.forEach((_: unknown, idx: number) => recalculateItemDuties(idx));
    
    // Принудительно обновляем итоги после небольшой задержки (чтобы форма обновилась)
    setTimeout(() => {
      const updatedItems = form.getValues('items') as Array<{
        customsValue?: number;
        dutyAmount?: number;
        vatAmount?: number;
        feeAmount?: number;
      }>;
      
      if (!updatedItems) return;
      
      const totalCustoms = updatedItems.reduce((sum, item) => sum + (parseFloat(String(item?.customsValue)) || 0), 0);
      const totalDuty = updatedItems.reduce((sum, item) => sum + (parseFloat(String(item?.dutyAmount)) || 0), 0);
      const totalVat = updatedItems.reduce((sum, item) => sum + (parseFloat(String(item?.vatAmount)) || 0), 0);
      const totalFee = updatedItems.reduce((sum, item) => sum + (parseFloat(String(item?.feeAmount)) || 0), 0);
      const grandTotal = totalDuty + totalVat + totalFee;
      
      // Обновляем поля для Блока 47
      form.setValue('dutyBase', totalCustoms > 0 ? Math.round(totalCustoms).toString() : '');
      form.setValue('totalDutyAmount', totalDuty);
      form.setValue('totalVatAmount', totalVat);
      form.setValue('totalFeeAmount', totalFee);
      form.setValue('calcAmount', grandTotal > 0 ? `${Math.round(grandTotal).toLocaleString('ru-RU')} сум.` : '');
      form.setValue('calcTotal', grandTotal > 0 ? `${Math.round(grandTotal).toLocaleString('ru-RU')} UZS` : '');
      
      if (grandTotal > 0) {
        toast.success(`Платежи рассчитаны: ${Math.round(grandTotal).toLocaleString('ru-RU')} UZS`);
      } else {
        toast.info('Заполните таможенную стоимость (Блок 45) для расчёта платежей');
      }
    }, 100);
  }, [form, recalculateItemDuties]);
  
  // Используем в эффекте при изменении курса
  React.useEffect(() => {
    if (!exchangeRate || parseFloat(String(exchangeRate)) <= 0) return;
    // Пересчитываем при изменении курса (с задержкой чтобы избежать лишних вызовов)
    const timer = setTimeout(() => {
      recalculateAllDuties();
    }, 500);
    return () => clearTimeout(timer);
  }, [exchangeRate]); // eslint-disable-line react-hooks/exhaustive-deps

  const addProduct = () => {
    append({
      itemNumber: fields.length + 1,
      description: '',
      hsCode: '',
      originCountryCode: '',
      grossWeight: 0,
      netWeight: 0,
      packageQuantity: 1,
      packageType: 'CT',
      marksNumbers: '',
      itemPrice: 0,
      customsValue: 0,
      procedureCode: getRegimeCode(),
      previousProcedureCode: declarationType === 'Реэкспорт' ? '40' : '00',
      quotaNumber: '0',
      supplementaryQuantity: 1,
      supplementaryUnit: '796',
      valuationMethodCode: '0',
      additionalInfo: '',
      dutyRate: 0,
      dutyAmount: 0,
      vatRate: 12,
      vatAmount: 0,
      feeAmount: 0,
      totalPayment: 0,
    });
  };

  const fetchExchangeRate = React.useCallback(async (currencyCode?: string) => {
    try {
      // CurrencySelect возвращает буквенный код (USD, EUR, RUB)
      const alphaCode = currencyCode || form.getValues('currency') || 'USD';
      
      // Если валюта = UZS, курс = 1
      if (alphaCode === 'UZS') {
        form.setValue('exchangeRate', '1');
        return;
      }
      
      const res = await fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/${alphaCode}/`);
      const data = await res.json();
      if (data && data[0]?.Rate) {
        form.setValue('exchangeRate', data[0].Rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // При ошибке пробуем загрузить USD
      try {
        const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/');
        const data = await res.json();
        if (data && data[0]?.Rate) {
          form.setValue('exchangeRate', data[0].Rate);
        }
      } catch {
        // Игнорируем
      }
    }
  }, [form]);

  // Следим за изменением валюты в графе 22 и обновляем курс
  const selectedCurrency = useWatch({ control: form.control, name: 'currency' });
  
  React.useEffect(() => {
    if (selectedCurrency) {
      fetchExchangeRate(selectedCurrency);
    }
  }, [selectedCurrency, fetchExchangeRate]);

  // Автозагрузка курса валюты при открытии формы
  React.useEffect(() => {
    const currentRate = form.getValues('exchangeRate');
    // Загружаем курс только если он не заполнен или равен 0
    if (!currentRate || currentRate === '0' || currentRate === 0) {
      fetchExchangeRate();
    }
  }, [fetchExchangeRate, form]);

  return (
    <div className="w-full bg-white text-black font-sans text-[9px] print:text-[11px]">
      {/* ========== ВЕРХНЯЯ ЧАСТЬ: Заголовок слева + Блоки 1-7 справа ========== */}
      <div className="grid grid-cols-12 border border-black">
        {/* ЛЕВАЯ КОЛОНКА: Заголовок + ED + Блок 2 (занимает 3 ряда) */}
        <div className={cn(cell, 'col-span-5 row-span-3 border-t-0 border-l-0 border-b-0')}>
          {/* Заголовок с ED */}
          <div className="flex items-center justify-between p-1 border-b border-black">
            <div>
              <div className="font-bold text-[11px] leading-tight">ГРУЗОВАЯ ТАМОЖЕННАЯ</div>
              <div className="font-bold text-[11px] leading-tight">ДЕКЛАРАЦИЯ</div>
            </div>
            <div className="font-bold text-[14px] px-4">ED</div>
          </div>
          {/* Блок 2 - Экспортер/Грузоотправитель (полная версия) */}
          <div className="text-[10px] px-0.5 py-px bg-gray-50 border-b border-black">
            <GraphHeader 
              graphNumber="2" 
              label="2. Экспортер/Грузоотправитель"
              className="flex justify-between items-center"
              regimeHint={currentRegimeConfig?.hints?.graph2}
            >
              <AIBadge fieldName="exporterName" />
            </GraphHeader>
          </div>
          <div className={cn(cellContent, 'p-1', hasError('exporterName') && errorClass, isAIFilled('exporterName') && 'bg-green-50')}>
            <Graph2ExporterForm 
              form={form}
              regimeHint={currentRegimeConfig?.hints?.graph2}
              isForeign={declarationType === 'Импорт' || declarationType === 'Реимпорт' || declarationType === 'Временный ввоз' || declarationType === 'Переработка на тер.'}
              onCopyToGraph9={() => {
                form.setValue('financialResponsibleName', form.getValues('exporterName'));
                form.setValue('financialResponsibleTin', form.getValues('exporterTin'));
              }}
              onCopyToGraph14={() => {
                form.setValue('declarantName', form.getValues('exporterName'));
                form.setValue('declarantTin', form.getValues('exporterTin'));
              }}
            />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блоки 1, 3, 4, 5, 6, 7 */}
        <div className="col-span-7 border-l border-black">
          {/* Ряды 1-2: Блоки 1, 3, 4 + объединённая пустая графа справа */}
          <div className="grid grid-cols-7">
            {/* Левая часть: блоки 1, 3, 4 */}
            <div className="col-span-5">
              {/* Ряд 1: Блок 1 */}
              <div className={cn(cell, 'border-t-0 border-l-0 border-r-0')}>
                <GraphHeader graphNumber="1" label="1. Тип декларации" />
                <div className={cn(cellContent, 'flex items-center gap-1')}>
                  {/* 1-й подраздел: Направление (ЭК/ИМ/ТТ) - выбирается через ModalSelect с режимами */}
                  <FormField control={form.control} name="declarationType" render={({ field }) => {
                    // Находим текущий режим по имени
                    const currentRegime = CUSTOMS_REGIMES.find(r => r.name === field.value);
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ModalSelect
                              value={field.value || ''}
                              onChange={(val) => {
                                field.onChange(val);
                                const regime = CUSTOMS_REGIMES.find(r => r.name === val);
                                if (regime) {
                                  form.setValue('declarationTypeCode', regime.code);
                                }
                              }}
                              options={CUSTOMS_REGIMES.map(r => ({ value: r.name, label: r.direction, description: `${r.abbr} — ${r.name} (${r.code})` }))}
                              placeholder="--"
                              dialogTitle="Выберите тип декларации"
                              searchPlaceholder="Поиск режима..."
                              className={cn("text-[11px] font-bold min-w-[24px]", currentRegime && "text-black")}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[9px]">
                          <p className="font-bold">1-й подраздел: Направление</p>
                          <p className="text-gray-400">{currentRegime ? `${currentRegime.direction} — ${currentRegime.name} (${currentRegime.code})` : 'Выберите режим'}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }} />
                  <span className="text-[10px] font-bold">|</span>
                  <FormField control={form.control} name="declarationTypeCode" render={({ field }) => (
                    <Input className={cn(inputBase, 'w-8 text-center font-bold h-5')} {...field} value={field.value || '--'} readOnly />
                  )} />
                  <span className="text-[10px] font-bold">|</span>
                </div>
              </div>
              {/* Ряд 2: Блоки 3, 4 */}
              <div className="grid grid-cols-5 border-t border-black">
                <div className={cn(cell, 'col-span-2 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="3" label="3 Доб.лист" />
                  <div className={cn(cellContent, 'text-center font-bold')}>1/{fields.length}</div>
                </div>
                <div className={cn(cell, 'col-span-3 border-t-0 border-r-0 border-b-0', isGraphDisabled('4') && 'bg-gray-100 opacity-50')}>
                  <GraphHeader graphNumber="4" label="4 Отгр.спец." />
                  <div className={cellContent}>
                    {isGraphDisabled('4') ? (
                      <div className="text-[9px] text-gray-400 italic text-center">Не заполняется</div>
                    ) : (
                      <FormField control={form.control} name="referenceNumber" render={({ field }) => (
                        <Input className={cn(inputBase, 'h-5')} {...field} value={field.value ?? ''} />
                      )} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Правая часть: объединённая пустая графа (на 2 ряда) */}
            <div className={cn(cell, 'col-span-2 row-span-2 border-t-0 border-r-0 border-b-0')}>
              <div className="h-full"></div>
            </div>
          </div>

          {/* Ряд 3: Блоки 5, 6, 7 */}
          <div className="grid grid-cols-7 border-t border-black min-h-[40px]">
            <div className={cn(cell, 'col-span-2 border-t-0 border-l-0 border-b-0 flex flex-col')}>
              <GraphHeader graphNumber="5" label="5.Всего наим. товаров" />
              <div className={cn(cellContent, 'text-center font-bold flex-1 flex items-center justify-center')}>{fields.length}</div>
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-b-0 flex flex-col', isGraphDisabled('6') && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="6" label="6. Кол-во мест" />
              <div className={cn(cellContent, 'text-center flex-1 flex items-center justify-center')}>
                {isGraphDisabled('6') ? (
                  <div className="text-[9px] text-gray-400 italic">Не заполняется</div>
                ) : (
                  <FormField control={form.control} name="totalPackages" render={({ field }) => (
                    <Input type="number" className={cn(inputBase, 'text-center font-bold h-5')} {...field} value={field.value ?? 0} readOnly />
                  )} />
                )}
              </div>
            </div>
            <div className={cn(cell, 'col-span-3 border-t-0 border-r-0 border-b-0 flex flex-col')}>
              <GraphHeader graphNumber="7" label="7. Регистр. номер ГТД" />
              <div className={cn(cellContent, 'flex items-center gap-0.5 flex-1')}>
                <FormField control={form.control} name="customsPostCode" render={({ field }) => (
                  <div className="w-12">
                    <CustomsOfficeSelect value={field.value} onChange={field.onChange} placeholder="--" compact className="h-5 text-[10px]" />
                  </div>
                )} />
                <span className="text-[11px]">/</span>
                <FormField control={form.control} name="registrationDate" render={({ field }) => (
                  <Input 
                    type="date" 
                    className={cn(
                      inputBase, 
                      'relative w-24 text-[11px] h-5 cursor-pointer',
                      // Скрываем иконку календаря, но делаем её кликабельной на всю ширину поля
                      '[&::-webkit-calendar-picker-indicator]:opacity-0',
                      '[&::-webkit-calendar-picker-indicator]:absolute',
                      '[&::-webkit-calendar-picker-indicator]:inset-0',
                      '[&::-webkit-calendar-picker-indicator]:w-full',
                      '[&::-webkit-calendar-picker-indicator]:h-full',
                      '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
                    )} 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                )} />
                <span className="text-[11px]">/</span>
                <FormField control={form.control} name="registrationSequence" render={({ field }) => (
                  <Input className={cn(inputBase, 'flex-1 text-[10px] h-5')} placeholder="№" {...field} value={field.value ?? ''} />
                )} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 8-13 (как на образце) ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ КОЛОНКА: Блок 8 - занимает всю высоту */}
        <div className={cn(cell, 'col-span-5 row-span-3 border-l-0 border-b-0', hasError('consigneeName') && errorClass, isAIFilled('consigneeName') && 'bg-green-50')}>
          <GraphHeader 
            graphNumber="8" 
            label="8. Импортер/грузополучатель" 
            className="flex justify-between items-center"
            regimeHint={currentRegimeConfig?.hints?.graph8}
          >
            <AIBadge fieldName="consigneeName" />
            <div className="flex gap-0.5">
              <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1" onClick={() => {
                form.setValue('financialResponsibleName', form.getValues('consigneeName'));
                form.setValue('financialResponsibleTin', form.getValues('consigneeTin'));
              }} title="Копировать в гр.9">
                <Copy className="h-2 w-2 mr-0.5" />→9
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1" onClick={() => {
                form.setValue('declarantName', form.getValues('consigneeName'));
                form.setValue('declarantTin', form.getValues('consigneeTin'));
              }} title="Копировать в гр.14">
                <Copy className="h-2 w-2 mr-0.5" />→14
              </Button>
            </div>
          </GraphHeader>
          <div className={cellContent}>
            {/* === ДЛЯ ИМПОРТА: Получатель — РЕЗИДЕНТ (расширенная форма) === */}
            {(declarationType === 'Импорт' || declarationType === 'Реимпорт' || declarationType === 'Временный ввоз' || declarationType === 'Переработка на тер.') ? (
              <div className="space-y-0.5">
                {/* Наименование */}
                <FormField control={form.control} name="consigneeName" render={({ field }) => (
                  <Input 
                    className={cn(inputBase, 'w-full h-5 text-[10px]', isAIFilled('consigneeName') && AI_FILLED_STYLES)} 
                    placeholder="Наименование (ООО «Компания»)" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={(e) => { field.onChange(e); handleAIFieldChange('consigneeName'); }}
                  />
                )} />
                {/* Адрес */}
                <FormField control={form.control} name="consigneeAddress" render={({ field }) => (
                  <Textarea 
                    className={cn(textareaBase, 'w-full min-h-[22px]')} 
                    placeholder="Юридический адрес" 
                    {...field} value={(field.value as string) ?? ''} 
                  />
                )} />
                {/* Телефон + Email */}
                <div className="flex gap-1">
                  <FormField control={form.control} name="consigneePhone" render={({ field }) => (
                    <Input className={cn(inputBase, 'flex-1 h-4 text-[9px]')} placeholder="+998 XX XXX XX XX" {...field} value={(field.value as string) ?? ''} />
                  )} />
                  <FormField control={form.control} name="consigneeEmail" render={({ field }) => (
                    <Input type="email" className={cn(inputBase, 'flex-1 h-4 text-[9px]')} placeholder="email@domain.uz" {...field} value={(field.value as string) ?? ''} />
                  )} />
                </div>
                {/* ОКПО / ИНН / Регион */}
                <div className="flex items-center gap-0.5 pt-0.5 border-t border-gray-200">
                  <Tooltip>
                    <TooltipTrigger asChild><span className="text-[7px] text-gray-500 cursor-help">ОКПО:</span></TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      <p className="font-bold">Код в правом верхнем углу</p>
                      <p>00000001 — Физ. лицо резидент</p>
                      <p>00000003 — Организация с гос. долей</p>
                      <p>88888888 — Межд. организации</p>
                      <p>99999999 — Дипл. представительства</p>
                    </TooltipContent>
                  </Tooltip>
                  <FormField control={form.control} name="consigneeOkpo" render={({ field }) => (
                    <Input className={cn(inputBase, 'w-16 h-4 font-mono text-center text-[8px]')} placeholder="12345678" maxLength={8} {...field} value={(field.value as string) ?? ''} onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 8))} />
                  )} />
                  <span className="text-[8px]">/</span>
                  <span className="text-[7px] text-gray-500">ИНН:</span>
                  <FormField control={form.control} name="consigneeTin" render={({ field }) => (
                    <div className="flex items-center">
                      <Input className={cn(inputBase, 'w-20 h-4 font-mono text-[8px]')} placeholder="123456789" maxLength={14} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 14))} />
                      <TINValidationBadge tin={field.value || ''} />
                    </div>
                  )} />
                  <span className="text-[8px]">/</span>
                  <span className="text-[7px] text-gray-500">Рег.:</span>
                  <FormField control={form.control} name="consigneeRegionCode" render={({ field }) => (
                    <LocationSelect value={(field.value as string) || ''} onChange={field.onChange} placeholder="Регион" className="w-24 h-4 text-[8px]" />
                  )} />
                </div>
                {/* По поручению */}
                <FormField control={form.control} name="consigneeIsOnBehalf" render={({ field }) => (
                  <div className="flex items-center gap-1 pt-0.5 border-t border-gray-200">
                    <input type="checkbox" id="consigneeIsOnBehalf" checked={field.value || false} onChange={(e) => field.onChange(e.target.checked)} className="h-3 w-3" />
                    <label htmlFor="consigneeIsOnBehalf" className="text-[8px] text-gray-600 cursor-pointer">По поручению другого лица</label>
                  </div>
                )} />
                {form.watch('consigneeIsOnBehalf') && (
                  <div className="p-1 bg-blue-50 rounded border border-blue-200">
                    <div className="text-[8px] text-blue-600 font-medium mb-0.5">Импортёр (по чьему поручению):</div>
                    <FormField control={form.control} name="consigneePrincipalName" render={({ field }) => (
                      <Input className={cn(inputBase, 'h-4 text-[9px] mb-0.5')} placeholder="Наименование импортёра" {...field} value={field.value ?? ''} />
                    )} />
                    <FormField control={form.control} name="consigneePrincipalAddress" render={({ field }) => (
                      <Input className={cn(inputBase, 'h-4 text-[9px]')} placeholder="Адрес импортёра" {...field} value={field.value ?? ''} />
                    )} />
                  </div>
                )}
              </div>
            ) : (
              /* === ДЛЯ ЭКСПОРТА: Получатель — ИНОСТРАННОЕ лицо (простая форма) === */
              <>
                <FormField control={form.control} name="consigneeName" render={({ field }) => (
                  <Textarea 
                    className={cn(textareaBase, 'min-h-[30px]', isAIFilled('consigneeName') && AI_FILLED_STYLES)} 
                    placeholder="Наименование/ФИО, страна, адрес" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={(e) => { field.onChange(e); handleAIFieldChange('consigneeName'); }}
                  />
                )} />
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[8px] text-gray-500">Страна:</span>
                  <FormField control={form.control} name="consigneeCountry" render={({ field }) => (
                    <div className="w-20">
                      <CountrySelect value={field.value} onChange={field.onChange} placeholder="..." compact className="h-4 text-[9px]" />
                    </div>
                  )} />
                  <span className="text-[8px] text-gray-500 ml-1">ИНН:</span>
                  <FormField control={form.control} name="consigneeTin" render={({ field }) => (
                    <div className="flex-1 flex items-center">
                      <Input className={cn(inputBase, 'flex-1 h-4 font-mono text-[9px]')} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 14))} placeholder="(опционально)" />
                    </div>
                  )} />
                </div>
                
                <FormField control={form.control} name="consigneeIsOnBehalf" render={({ field }) => (
                  <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-200">
                    <input type="checkbox" id="consigneeIsOnBehalf" checked={field.value || false} onChange={(e) => field.onChange(e.target.checked)} className="h-3 w-3" />
                    <label htmlFor="consigneeIsOnBehalf" className="text-[8px] text-gray-600 cursor-pointer">По поручению другого лица</label>
                  </div>
                )} />
                {form.watch('consigneeIsOnBehalf') && (
                  <div className="mt-1 p-1 bg-blue-50 rounded border border-blue-200">
                    <div className="text-[8px] text-blue-600 font-medium mb-0.5">Поручитель:</div>
                    <FormField control={form.control} name="consigneePrincipalName" render={({ field }) => (
                      <Input className={cn(inputBase, 'h-4 text-[9px] mb-0.5')} placeholder="Наименование поручителя" {...field} value={field.value ?? ''} />
                    )} />
                    <FormField control={form.control} name="consigneePrincipalAddress" render={({ field }) => (
                      <Input className={cn(inputBase, 'h-4 text-[9px]')} placeholder="Адрес поручителя" {...field} value={field.value ?? ''} />
                    )} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блок 9 + Блоки 10-13 */}
        <div className="col-span-7 border-l border-black">
          {/* Блок 9 - заголовок + данные */}
          <div className={cn(cell, 'border-t-0 border-l-0 border-r-0', isGratuitousTransaction && 'bg-gray-100 opacity-60')}>
            <div className={cn(cellHeader, 'flex justify-between items-center')}>
              <GraphHeader 
                graphNumber="9" 
                label="9 Лицо ответ. за фин. урегулир-е"
                regimeHint={currentRegimeConfig?.hints?.graph9}
              />
              {isGratuitousTransaction ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[8px] text-gray-500 italic cursor-help">Не заполняется</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px]">
                    <p>При безвозмездной поставке (код 80) графа 9 не заполняется</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
              <div className="flex gap-0.5 items-center">
                {/* Код статуса в верхней части */}
                <FormField control={form.control} name="financialResponsibleStatusCode" render={({ field }) => (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <select 
                        className="h-4 text-[8px] border border-gray-300 rounded px-0.5 bg-white"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">№ —</option>
                        <option value="00000001">00000001 (физ.резидент)</option>
                        <option value="00000002">00000002 (физ.нерезидент)</option>
                        <option value="00000003">00000003 (гос.доля)</option>
                        <option value="88888888">88888888 (межд.орг)</option>
                        <option value="99999999">99999999 (диплом.)</option>
                      </select>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      <p>Код статуса лица (верхняя часть)</p>
                    </TooltipContent>
                  </Tooltip>
                )} />
                <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1 bg-blue-50" onClick={() => {
                  form.setValue('financialResponsibleName', form.getValues('exporterName'));
                  form.setValue('financialResponsibleTin', form.getValues('exporterTin'));
                  form.setValue('financialResponsibleRegionCode', form.getValues('exporterRegionCode'));
                }} title="Скопировать из гр.2 (Экспортер)">
                  <Copy className="h-2 w-2 mr-0.5" />←2
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1 bg-blue-50" onClick={() => {
                  form.setValue('financialResponsibleName', form.getValues('consigneeName'));
                  form.setValue('financialResponsibleTin', form.getValues('consigneeTin'));
                }} title="Скопировать из гр.8 (Получатель)">
                  <Copy className="h-2 w-2 mr-0.5" />←8
                </Button>
              </div>
              )}
            </div>
            {!isGratuitousTransaction && (
            <div className={cellContent}>
              {/* Наименование и адрес */}
              <FormField control={form.control} name="financialResponsibleName" render={({ field }) => (
                <Textarea className={cn(textareaBase, 'min-h-[18px] text-[9px]')} placeholder="Наименование/ФИО, адрес" {...field} value={field.value ?? ''} />
              )} />
              {/* Телефон и Email */}
              <div className="flex items-center gap-0.5 mt-0.5">
                <FormField control={form.control} name="financialResponsiblePhone" render={({ field }) => (
                  <Input 
                    className={cn(inputBase, 'w-20 h-4 text-[8px]')} 
                    placeholder="Телефон"
                    {...field} 
                    value={field.value ?? ''} 
                  />
                )} />
                <FormField control={form.control} name="financialResponsibleEmail" render={({ field }) => (
                  <Input 
                    type="email"
                    className={cn(inputBase, 'flex-1 h-4 text-[8px]')} 
                    placeholder="email@domain.uz"
                    {...field} 
                    value={field.value ?? ''} 
                  />
                )} />
              </div>
              {/* ИНН / Код района */}
              <div className="flex items-center gap-0.5 mt-0.5 pt-0.5 border-t border-gray-200">
                <span className="text-[8px] text-gray-500">№</span>
                <FormField control={form.control} name="financialResponsibleTin" render={({ field }) => (
                  <div className="flex items-center">
                    <Input 
                      className={cn(inputBase, 'w-24 h-4 font-mono text-[9px]')} 
                      {...field} 
                      value={field.value ?? ''} 
                      onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 14))}
                      placeholder="ИНН/ПИНФЛ"
                    />
                    <TINValidationBadge tin={field.value || ''} />
                  </div>
                )} />
                <span className="text-[9px]">/</span>
                <FormField control={form.control} name="financialResponsibleRegionCode" render={({ field }) => (
                  <LocationSelect 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                    placeholder="Регион" 
                    className="w-24 h-4 text-[8px]" 
                  />
                )} />
              </div>
            </div>
            )}
          </div>

          {/* Блоки 10-13: Ряд 1 - заголовки */}
          <div className="grid grid-cols-8 border-t border-black">
            <div className={cn(cell, 'col-span-1 border-t-0 border-l-0 border-b-0', isGraphDisabled('10') && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="10" label="10. Стр. 1" />
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-b-0')}>
              <GraphHeader graphNumber="11" label="11. Торг. страна" />
            </div>
            <div className={cn(cell, 'col-span-3 border-t-0 border-b-0')}>
              <GraphHeader graphNumber="12" label="12.Общ.там.стоим." />
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-r-0 border-b-0')}>
              <GraphHeader graphNumber="13" label="13." />
            </div>
          </div>

          {/* Блоки 10-13: Ряд 2 - данные */}
          <div className="grid grid-cols-8 border-t border-black">
            <div className={cn(cell, 'col-span-1 border-t-0 border-l-0 border-b-0', isGraphDisabled('10') && 'bg-gray-100 opacity-50')}>
              <div className={cellContent}>
                {isGraphDisabled('10') ? (
                  <div className="text-[8px] text-gray-400 italic text-center">—</div>
                ) : (
                  <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} placeholder="..." compact className="h-5 text-[11px]" />
                  )} />
                )}
              </div>
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-b-0')}>
              <div className={cn(cellContent, 'flex items-center gap-0.5')}>
                <FormField control={form.control} name="tradingCountry" render={({ field }) => (
                  <CountrySelect 
                    value={field.value} 
                    onChange={(val: string, numericCode?: string) => {
                      field.onChange(val);
                      // Устанавливаем числовой код страны
                      if (numericCode) {
                        form.setValue('tradingCountryCode', numericCode);
                      }
                    }} 
                    placeholder="..." 
                    compact 
                    className="h-5 text-[11px]" 
                  />
                )} />
                {/* Числовой код страны */}
                <FormField control={form.control} name="tradingCountryCode" render={({ field }) => (
                  <span className="text-[10px] font-bold">{field.value || ''}</span>
                )} />
                <span className="text-[10px] font-bold">/</span>
                <FormField control={form.control} name="offshoreIndicator" render={({ field }) => (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <select 
                        className="w-4 h-4 text-[10px] text-center border-0 bg-transparent font-bold appearance-none cursor-pointer hover:bg-gray-100 rounded"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        value={field.value || '2'}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      <p>1 — оффшорная зона</p>
                      <p>2 — НЕ оффшорная зона</p>
                    </TooltipContent>
                  </Tooltip>
                )} />
              </div>
            </div>
            <div className={cn(cell, 'col-span-3 border-t-0 border-b-0')}>
              <div className={cellContent}>
                <FormField control={form.control} name="totalCustomsValue" render={({ field }) => (
                  <Input type="number" className={cn(inputBase, 'font-bold h-5')} {...field} value={field.value ?? 0} readOnly />
                )} />
              </div>
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-r-0 border-b-0')}>
              <div className={cn(cellContent, 'flex items-center gap-0.5')}>
                <FormField control={form.control} name="exchangeRate" render={({ field }) => (
                  <Input 
                    className={cn(inputBase, 'flex-1 h-5')} 
                    {...field} 
                    value={field.value ?? ''} 
                    readOnly
                    placeholder="Загрузка..."
                  />
                )} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => fetchExchangeRate()}
                      className="w-4 h-4 flex items-center justify-center text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Обновить курс"
                    >
                      ↻
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px]">
                    Обновить курс выбранной валюты с ЦБ РУз
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 14-17а (как на образце) ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ КОЛОНКА: Блок 14 - занимает 2 ряда */}
        <div className={cn(cell, 'col-span-5 row-span-2 border-l-0 border-b-0')}>
          <div className="flex items-center justify-between border-b border-black">
            <GraphHeader graphNumber="14" label="14. Декларант/таможенный брокер" className="border-b-0 flex-1 flex items-center gap-1">
              <div className="flex gap-0.5">
                <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1 bg-blue-50" onClick={() => {
                  form.setValue('declarantName', form.getValues('exporterName'));
                  form.setValue('declarantTin', form.getValues('exporterTin'));
                  form.setValue('declarantPhone', form.getValues('exporterPhone'));
                  form.setValue('declarantEmail', form.getValues('exporterEmail'));
                }} title="Скопировать из гр.2 (Экспортер)">
                  <Copy className="h-2 w-2 mr-0.5" />←2
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] px-1 bg-blue-50" onClick={() => {
                  form.setValue('declarantName', form.getValues('consigneeName'));
                  form.setValue('declarantTin', form.getValues('consigneeTin'));
                  form.setValue('declarantPhone', form.getValues('consigneePhone'));
                  form.setValue('declarantEmail', form.getValues('consigneeEmail'));
                }} title="Скопировать из гр.8 (Получатель)">
                  <Copy className="h-2 w-2 mr-0.5" />←8
                </Button>
              </div>
            </GraphHeader>
            <FormField control={form.control} name="declarantTin" render={({ field }) => (
              <div className="flex items-center">
                <Input 
                  className={cn(inputBase, 'w-24 text-right h-5 font-mono')} 
                  placeholder="ИНН" 
                  {...field} 
                  value={field.value ?? ''} 
                  onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 14))}
                />
                <TINValidationBadge tin={field.value || ''} />
              </div>
            )} />
          </div>
          <div className={cellContent}>
            <FormField control={form.control} name="declarantName" render={({ field }) => (
              <Textarea className={cn(textareaBase, 'min-h-[28px]')} placeholder="Наименование/ФИО, адрес" {...field} value={field.value ?? ''} />
            )} />
            {/* Телефон и Email */}
            <div className="flex items-center gap-1 mt-0.5 pt-0.5 border-t border-gray-200">
              <FormField control={form.control} name="declarantPhone" render={({ field }) => (
                <Input 
                  className={cn(inputBase, 'flex-1 h-4 text-[8px]')} 
                  placeholder="Телефон" 
                  {...field} 
                  value={field.value ?? ''} 
                />
              )} />
              <FormField control={form.control} name="declarantEmail" render={({ field }) => (
                <Input 
                  className={cn(inputBase, 'flex-1 h-4 text-[8px]')} 
                  placeholder="Email" 
                  {...field} 
                  value={field.value ?? ''} 
                />
              )} />
            </div>
            {/* Чекбокс "Таможенный брокер" */}
            <FormField control={form.control} name="isBroker" render={({ field }) => (
              <div className="flex items-center gap-1 mt-0.5">
                <input 
                  type="checkbox" 
                  id="isBroker" 
                  checked={field.value || false} 
                  onChange={(e) => field.onChange(e.target.checked)} 
                  className="h-3 w-3" 
                />
                <label htmlFor="isBroker" className="text-[8px] text-gray-600 cursor-pointer">
                  Таможенный брокер
                </label>
              </div>
            )} />
            {/* Поля брокера (если выбран) */}
            {form.watch('isBroker') && (
              <div className="mt-0.5 p-1 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-1">
                  <FormField control={form.control} name="brokerInn" render={({ field }) => (
                    <Input 
                      className={cn(inputBase, 'w-20 h-4 text-[8px] font-mono')} 
                      placeholder="ИНН брокера" 
                      {...field} 
                      value={field.value ?? ''} 
                      onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
                    />
                  )} />
                  <FormField control={form.control} name="brokerLicense" render={({ field }) => (
                    <Input 
                      className={cn(inputBase, 'flex-1 h-4 text-[8px]')} 
                      placeholder="№ лицензии" 
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  )} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блоки 15, 15а, 17а, 16, 17 */}
        <div className="col-span-7 border-l border-black">
          {/* Ряд 1: Блоки 15, 15а, 17а */}
          <div className="grid grid-cols-7">
            {/* Графа 15 - при экспорте/реэкспорте readonly (всегда UZ), при врем. вывозе НЕ заполняется */}
            <div className={cn(cell, 'col-span-2 border-t-0 border-l-0', 
              (declarationType === 'Экспорт' || declarationType === 'Реэкспорт') && 'bg-gray-50',
              declarationType === 'Временный вывоз' && 'bg-gray-100 opacity-50'
            )}>
              <GraphHeader graphNumber="15" label="15. Страна отп." />
              <div className={cellContent}>
                {declarationType === 'Временный вывоз' ? (
                  <div className="text-[8px] text-gray-400 italic text-center">Не заполняется</div>
                ) : (declarationType === 'Экспорт' || declarationType === 'Реэкспорт') ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[10px] font-bold text-center cursor-help">UZ (Узбекистан)</div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      При экспорте страна отправления всегда Узбекистан
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <FormField control={form.control} name="dispatchCountry" render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} placeholder="..." compact className="h-5 text-[11px]" />
                  )} />
                )}
              </div>
            </div>
            {/* Графа 15а - код страны отправления */}
            <div className={cn(cell, 'col-span-2 border-t-0', 
              (declarationType === 'Экспорт' || declarationType === 'Реэкспорт') && 'bg-gray-50',
              declarationType === 'Временный вывоз' && 'bg-gray-100 opacity-50'
            )}>
              <GraphHeader graphNumber="15" label="15а.Код стр отп." />
              <div className={cellContent}>
                {declarationType === 'Временный вывоз' ? (
                  <div className="text-[8px] text-gray-400 italic text-center">—</div>
                ) : (
                  <FormField control={form.control} name="dispatchCountryCode" render={({ field }) => (
                    <Input className={cn(inputBase, 'text-center h-5 font-bold')} {...field} value={field.value ?? ''} readOnly />
                  )} />
                )}
              </div>
            </div>
            <div className={cn(cell, 'col-span-3 border-t-0 border-r-0', declarationType === 'Импорт' && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="17" label="17а.Код стр назн." />
              <div className={cellContent}>
                {declarationType === 'Импорт' ? (
                  <div className="text-[8px] text-gray-400 italic text-center">—</div>
                ) : (
                  <FormField control={form.control} name="destinationCountryCode" render={({ field }) => (
                    <Input className={cn(inputBase, 'text-center h-5 font-bold')} {...field} value={field.value ?? ''} readOnly />
                  )} />
                )}
              </div>
            </div>
          </div>

          {/* Ряд 2: Блоки 16, 17 */}
          <div className="grid grid-cols-7 border-t border-black">
            <div className={cn(cell, 'col-span-4 border-t-0 border-l-0 border-b-0', isGraphDisabled('16') && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="16" label="16. Страна происхождения" />
              <div className={cellContent}>
                {isGraphDisabled('16') ? (
                  <div className="text-[8px] text-gray-400 italic text-center">Не заполняется</div>
                ) : (
                  <FormField control={form.control} name="originCountry" render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} placeholder="..." compact className="h-5 text-[11px]" />
                  )} />
                )}
              </div>
            </div>
            <div className={cn(cell, 'col-span-3 border-t-0 border-r-0 border-b-0', declarationType === 'Импорт' && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="17" label="17. Страна назначения" />
              <div className={cellContent}>
                {declarationType === 'Импорт' ? (
                  <div className="text-[8px] text-gray-400 italic text-center">Не заполняется</div>
                ) : (
                  <FormField control={form.control} name="transitDestinationCountry" render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} placeholder="--" showFullName className="h-5 text-[11px]" />
                  )} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 18-20 ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* Блок 18 */}
        <div className={cn(cell, 'col-span-5 border-l-0')}>
          <GraphHeader graphNumber="18" label={declarationType === 'Импорт' ? '18. Трансп. средство при прибытии' : '18. Трансп. средство при отправлении'} />
          <div className={cn(cellContent, 'flex items-center gap-0.5')}>
            {/* Левый подраздел: КОЛ-ВО ВИД_ТС: НОМЕР */}
            <FormField control={form.control} name="transportCount" render={({ field }) => (
              <Input type="number" min={1} className={cn(inputBase, 'w-6 text-center h-5')} {...field} value={field.value ?? 1} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
            )} />
            <FormField control={form.control} name="departureTransportType" render={({ field }) => (
              <ModalSelect
                value={field.value || '30'}
                onChange={field.onChange}
                options={TRANSPORT_TYPES.map(t => ({ value: t.code, label: t.name }))}
                placeholder="Тип"
                dialogTitle="Выберите вид транспорта"
                searchPlaceholder="Поиск..."
                className="text-[11px]"
              />
            )} />
            <span className="text-[10px]">:</span>
            <FormField control={form.control} name="departureTransportNumber" render={({ field }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input 
                    className={cn(inputBase, 'flex-1 h-5')} 
                    placeholder={form.watch('transportCount') > 1 ? "Номера через ;" : "Номер ТС"} 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  {form.watch('transportCount') > 1 
                    ? "При нескольких ТС номера через точку с запятой: A123BC; B456DE" 
                    : "Номер транспортного средства"
                  }
                </TooltipContent>
              </Tooltip>
            )} />
            {/* Правый подраздел: Код страны ТС */}
            <span className="text-[10px] text-gray-400 mx-0.5">|</span>
            <FormField control={form.control} name="transportNationality" render={({ field }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-12">
                    <CountrySelect 
                      value={field.value} 
                      onChange={field.onChange} 
                      placeholder="Страна" 
                      compact 
                      className="h-5 text-[10px]" 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                  <p>Код страны регистрации ТС</p>
                  {form.watch('transportCount') > 1 && (
                    <p className="text-orange-500 mt-1">При разных странах ТС укажите 999</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )} />
          </div>
        </div>
        {/* Блок 19 - Контейнер (0 - нет, 1 - да) */}
        <div className={cn(cell, 'col-span-1')}>
          <GraphHeader graphNumber="19" label="19.Конт." />
          <div className={cn(cellContent, 'text-center')}>
            <FormField control={form.control} name="containerIndicator" render={({ field }) => (
              <ModalSelect
                value={field.value || '0'}
                onChange={field.onChange}
                options={[
                  { value: '0', label: '0', description: 'Без контейнера' },
                  { value: '1', label: '1', description: 'В контейнере' },
                ]}
                placeholder="0"
                dialogTitle="Контейнерная перевозка"
                className="text-[11px]"
              />
            )} />
          </div>
        </div>
        {/* Блок 20 */}
        <div className={cn(cell, 'col-span-6 border-r-0')}>
          <GraphHeader graphNumber="20" label="20. Условия поставки" />
          <div className={cn(cellContent, 'flex items-center gap-0.5')}>
            {/* 1-й подраздел: Цифровой код */}
            <FormField control={form.control} name="incotermsCode" render={({ field }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input className={cn(inputBase, 'w-6 text-center h-5')} {...field} value={field.value ?? ''} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Цифровой код условия поставки</TooltipContent>
              </Tooltip>
            )} />
            {/* 2-й подраздел: Буквенный код + место */}
            <FormField control={form.control} name="incoterms" render={({ field }) => (
              <div className="w-14">
                <IncotermsSelect 
                  value={field.value} 
                  onChange={(alphaCode, numericCode) => {
                    field.onChange(alphaCode);
                    // Автозаполнение цифрового кода
                    if (numericCode) {
                      form.setValue('incotermsCode', numericCode);
                    }
                  }} 
                  compact 
                  className="h-5 text-[11px]" 
                />
              </div>
            )} />
            <DeliveryPlaceInput 
              value={form.watch('deliveryPlace') || ''} 
              onChange={(val) => form.setValue('deliveryPlace', val)} 
            />
            {/* 3-й подраздел: Форма расчета / Форма отправки */}
            <FormField control={form.control} name="paymentForm" render={({ field }) => (
              <ModalSelect
                value={field.value || '10'}
                onChange={field.onChange}
                options={declarationType === 'Импорт' ? [
                  { value: '10', label: '10', description: 'Предоплата' },
                  { value: '20', label: '20', description: 'Аккредитив' },
                  { value: '30', label: '30', description: 'Гарантия банка' },
                  { value: '40', label: '40', description: 'Инкассо' },
                  { value: '50', label: '50', description: 'По факту импорта' },
                  { value: '60', label: '60', description: 'По консигнации' },
                  { value: '70', label: '70', description: 'Бартер' },
                  { value: '80', label: '80', description: 'Безвозмездно' },
                ] : [
                  { value: '10', label: '10', description: 'Предоплата' },
                  { value: '20', label: '20', description: 'Аккредитив' },
                  { value: '30', label: '30', description: 'Гарантия банка' },
                  { value: '40', label: '40', description: 'Полис страхования' },
                  { value: '50', label: '50', description: 'По факту экспорта' },
                  { value: '60', label: '60', description: 'По консигнации' },
                  { value: '70', label: '70', description: 'Бартер' },
                  { value: '80', label: '80', description: 'Безвозмездно' },
                ]}
                placeholder="10"
                dialogTitle="Форма расчёта"
                className="w-8 text-[10px]"
              />
            )} />
            <span className="text-[10px]">/</span>
            <FormField control={form.control} name="shippingForm" render={({ field }) => (
              <ModalSelect
                value={field.value || '01'}
                onChange={field.onChange}
                options={[
                  { value: '01', label: '01', description: 'Напрямую контрагенту' },
                  { value: '02', label: '02', description: 'НЕ напрямую контрагенту' },
                ]}
                placeholder="01"
                dialogTitle="Форма отправки"
                className="w-8 text-[10px]"
              />
            )} />
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 21-24 ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* Блок 21 - НЕ заполняется при экспорте/реэкспорте, НО заполняется при врем. вывозе и импорте */}
        <div className={cn(cell, 'col-span-3 border-l-0', (isGraphDisabled('21') || declarationType === 'Экспорт' || declarationType === 'Реэкспорт') && 'bg-gray-100 opacity-50')}>
          <GraphHeader graphNumber="21" label="21. Транспортное средство на границе" />
          <div className={cellContent}>
            {(isGraphDisabled('21') || declarationType === 'Экспорт' || declarationType === 'Реэкспорт') ? (
              <div className="text-[8px] text-gray-400 italic text-center">Не заполняется</div>
            ) : declarationType === 'Импорт' ? (
              /* Для импорта: полная структура — тип ТС, номер, страна */
              <div className="space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <FormField control={form.control} name="borderTransportType" render={({ field }) => (
                    <ModalSelect
                      value={field.value || '30'}
                      onChange={field.onChange}
                      options={TRANSPORT_TYPES.map(t => ({ value: t.code, label: t.name }))}
                      placeholder="Тип"
                      dialogTitle="Вид транспорта на границе"
                      className="text-[9px]"
                    />
                  )} />
                  <span className="text-[8px]">:</span>
                  <FormField control={form.control} name="borderTransportNumber" render={({ field }) => (
                    <Input className={cn(inputBase, 'flex-1 h-4 text-[8px]')} placeholder="Номер ТС" {...field} value={field.value ?? ''} />
                  )} />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="text-[7px] text-gray-400">Страна:</span>
                  <FormField control={form.control} name="borderTransportCountry" render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} placeholder="..." compact className="h-4 text-[8px]" />
                  )} />
                </div>
              </div>
            ) : (
              <FormField control={form.control} name="borderTransportNumber" render={({ field }) => (
                <Input className={cn(inputBase, 'h-5')} placeholder="0" {...field} value={field.value ?? '0'} />
              )} />
            )}
          </div>
        </div>
        {/* Блок 22 - автоматически рассчитывается из суммы товаров */}
        <div className={cn(cell, 'col-span-4')}>
          <GraphHeader graphNumber="22" label="22.Вал. и общ факт стоим" className="flex items-center gap-1">
            {isGratuitousWithValue && (
              <span className="text-[7px] bg-orange-100 text-orange-700 px-1 rounded" title="При безвозмездной сделке стоимость должна быть 0">
                ⚠️
              </span>
            )}
          </GraphHeader>
          <div className={cn(cellContent, 'flex items-center gap-0.5')}>
            <FormField control={form.control} name="currency" render={({ field }) => (
              <div className="w-12">
                <CurrencySelect value={field.value} onChange={field.onChange} compact className="h-5 text-[11px]" />
              </div>
            )} />
            <FormField control={form.control} name="totalInvoiceAmount" render={({ field }) => (
              <Input 
                type="number" 
                className={cn(
                  inputBase, 
                  'flex-1 text-right h-5 font-bold bg-blue-50',
                  isGratuitousWithValue && 'border border-orange-400 bg-orange-50'
                )} 
                {...field} 
                value={field.value ?? ''} 
                readOnly 
                title={isGratuitousWithValue 
                  ? "⚠️ При безвозмездной сделке (гр.24) стоимость должна быть 0" 
                  : "Автоматически рассчитывается как сумма фактурных стоимостей товаров"
                } 
              />
            )} />
          </div>
        </div>
        {/* Блок 23 */}
        <div className={cn(cell, 'col-span-2')}>
          <GraphHeader graphNumber="23" label="23. Курс вал." />
          <div className={cn(cellContent, 'flex items-center gap-0.5')}>
            <span className="text-[10px] whitespace-nowrap">1 /</span>
            <FormField control={form.control} name="exchangeRate" render={({ field }) => (
              <Input 
                className={cn(inputBase, 'flex-1 h-5')} 
                {...field} 
                value={field.value ?? ''} 
                readOnly
                placeholder="..."
              />
            )} />
          </div>
        </div>
        {/* Блок 24 - связан с графой 22 */}
        <div className={cn(cell, 'col-span-3 border-r-0')}>
          <GraphHeader graphNumber="24" label="24. Хар-р сделки" className="flex items-center gap-1">
            {isGratuitousWithValue && (
              <span className="text-[7px] bg-orange-100 text-orange-700 px-1 rounded" title="Безвозмездная сделка - стоимость в гр.22 должна быть 0">
                ⚠️
              </span>
            )}
          </GraphHeader>
          <div className={cn(cellContent, 'flex items-center gap-0.5')}>
            {/* Первая часть - характер сделки */}
            <FormField control={form.control} name="transactionNature" render={({ field }) => {
              const currentNature = TRANSACTION_NATURE_CODES.find(t => t.code === field.value);
              return (
                <ModalSelect
                  value={field.value || ''}
                  onChange={field.onChange}
                  options={TRANSACTION_NATURE_CODES.map(t => ({ 
                    value: t.code, 
                    label: t.code, 
                    description: `${t.name}${!t.requiresPayment ? ' (без оплаты)' : ''}` 
                  }))}
                  placeholder="--"
                  dialogTitle="Характер сделки"
                  searchPlaceholder="Поиск..."
                  className={cn(
                    "text-[10px] min-w-[30px]",
                    currentNature && !currentNature.requiresPayment && "text-orange-600"
                  )}
                />
              );
            }} />
            {/* Вторая часть - код валюты расчёта (автоматически из графы 22) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] font-bold text-gray-700 min-w-[30px] text-center cursor-help">
                  {(() => {
                    // Находим числовой код валюты по буквенному коду из графы 22
                    const curr = CURRENCIES.find(c => c.code === selectedCurrency);
                    return curr?.numCode || '---';
                  })()}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                <p>Цифровой код валюты расчёта</p>
                <p className="text-gray-400">Автоматически из графы 22</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 25-30 (как на образце) ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ ЧАСТЬ: Блоки 25, 26, 27, 29, 30 */}
        <div className="col-span-6 border-r border-black">
          {/* Ряд 1: Блоки 25, 26, 27 */}
          <div className="grid grid-cols-6">
            <div className={cn(cell, 'col-span-2 border-t-0 border-l-0')}>
              <GraphHeader graphNumber="25" label="25.Вид транс на границе" />
              <div className={cellContent}>
                <FormField control={form.control} name="borderTransportMode" render={({ field }) => {
                  const currentTransport = TRANSPORT_TYPES.find(t => t.code === field.value);
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <ModalSelect
                            value={field.value || ''}
                            onChange={field.onChange}
                            options={TRANSPORT_TYPES.map(t => ({
                              value: t.code,
                              label: t.code,
                              description: t.name
                            }))}
                            placeholder="--"
                            dialogTitle="Вид транспорта на границе"
                            searchPlaceholder="Поиск..."
                            className="text-[10px] text-center w-full"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        <p>{currentTransport ? `${currentTransport.code} — ${currentTransport.name}` : 'Выберите вид транспорта'}</p>
                        <p className="text-gray-400">Автозаполнение из графы 18</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }} />
              </div>
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0')}>
              <GraphHeader graphNumber="26" label="26.Вид транс внутр страны" />
              <div className={cellContent}>
                <FormField control={form.control} name="inlandTransportMode" render={({ field }) => {
                  const currentTransport = TRANSPORT_TYPES.find(t => t.code === field.value);
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <ModalSelect
                            value={field.value || ''}
                            onChange={field.onChange}
                            options={TRANSPORT_TYPES.map(t => ({
                              value: t.code,
                              label: t.code,
                              description: t.name
                            }))}
                            placeholder="--"
                            dialogTitle="Вид транспорта внутри страны"
                            searchPlaceholder="Поиск..."
                            className="text-[10px] text-center w-full"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        <p>{currentTransport ? `${currentTransport.code} — ${currentTransport.name}` : 'Выберите вид транспорта'}</p>
                        <p className="text-gray-400">Автозаполнение из графы 18</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }} />
              </div>
            </div>
            <div className={cn(cell, 'col-span-2 border-t-0 border-r-0', isGraphDisabled('27') && 'bg-gray-100 opacity-50')}>
              <GraphHeader graphNumber="27" label="27.Место погр/разг" />
              <div className={cellContent}>
                {isGraphDisabled('27') ? (
                  <div className="text-[8px] text-gray-400 italic text-center">—</div>
                ) : (
                  <FormField control={form.control} name="loadingPlace" render={({ field }) => (
                    <LocationSelect value={field.value} onChange={field.onChange} placeholder="--" showFullName className="h-5 text-[9px]" />
                  )} />
                )}
              </div>
            </div>
          </div>
          {/* Ряд 2: Блоки 29, 30 */}
          <div className="grid grid-cols-6 border-t border-black min-h-[40px]">
            <div className={cn(cell, 'col-span-2 border-t-0 border-l-0 border-b-0 flex flex-col')}>
              <GraphHeader graphNumber="29" label="29. Таможня на границе" />
              <div className={cn(cellContent, 'flex-1 flex items-center')}>
                <FormField control={form.control} name="exitCustomsOffice" render={({ field }) => (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <CustomsOfficeSelect 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder="Выберите пост" 
                          showFullName 
                          className="h-5 text-[9px]" 
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] max-w-[250px]">
                      <p>{declarationType === 'Импорт' ? 'Таможенный пост ввоза товаров в РУз' : 'Таможенный пост вывоза товаров'}</p>
                      <p className="text-gray-400">Для трубопровода/ЛЭП — код поста контроля</p>
                    </TooltipContent>
                  </Tooltip>
                )} />
              </div>
            </div>
            <div className={cn(cell, 'col-span-4 border-t-0 border-r-0 border-b-0 flex flex-col')}>
              <GraphHeader graphNumber="30" label="30. Местонахождение товаров" />
              {/* Для трубопровода/ЛЭП не заполняется */}
              {(form.watch('departureTransportType') === '71' || form.watch('departureTransportType') === '72') ? (
                <div className={cn(cellContent, 'flex-1 flex items-center justify-center')}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[8px] text-gray-400 italic cursor-help">Не заполняется для трубопровода/ЛЭП</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      При перемещении по трубопроводу или ЛЭП графа 30 не заполняется
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className={cn(cellContent, 'flex-1 space-y-0.5')}>
                  {/* Тип места */}
                  <div className="flex items-center gap-1">
                    <FormField control={form.control} name="goodsLocationType" render={({ field }) => (
                      <select
                        className="text-[9px] border border-gray-300 rounded px-1 py-0.5 bg-white"
                        value={field.value || 'address'}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="address">Адрес</option>
                        <option value="warehouse">Там. склад</option>
                        <option value="freeZone">Своб. зона</option>
                        <option value="dutyFree">Магазин б/п</option>
                        <option value="railway">Ж/Д станция</option>
                      </select>
                    )} />
                    {/* Код района */}
                    <FormField control={form.control} name="goodsLocationRegionCode" render={({ field }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            className={cn(inputBase, 'w-12 h-5 text-center')} 
                            placeholder="Код" 
                            maxLength={5}
                            {...field} 
                            value={field.value ?? ''} 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          Код района (Приложение №15)
                        </TooltipContent>
                      </Tooltip>
                    )} />
                  </div>
                  {/* Адрес/Номер лицензии/Станция */}
                  <FormField control={form.control} name="goodsLocation" render={({ field }) => {
                    const locationType = form.watch('goodsLocationType') || 'address';
                    const placeholders: Record<string, string> = {
                      address: 'Почтовый адрес (без индекса)',
                      warehouse: 'Номер и дата лицензии склада',
                      freeZone: 'Номер и дата лицензии зоны',
                      dutyFree: 'Номер и дата лицензии магазина',
                      railway: 'Наименование ж/д станции',
                    };
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            className={cn(inputBase, 'h-5 text-[9px]')} 
                            placeholder={placeholders[locationType]}
                            {...field} 
                            value={field.value ?? ''} 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                          {locationType === 'address' && <p>Почтовый адрес места нахождения товаров</p>}
                          {locationType === 'warehouse' && <p>Лицензия таможенного/свободного склада</p>}
                          {locationType === 'freeZone' && <p>Лицензия свободной экономической зоны</p>}
                          {locationType === 'dutyFree' && <p>Лицензия магазина беспошлинной торговли</p>}
                          {locationType === 'railway' && <p>Наименование железнодорожной станции</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Блок 28 (занимает 2 ряда) */}
        <div className={cn(cell, 'col-span-6 row-span-2 border-t-0 border-r-0 border-b-0')}>
          <GraphHeader graphNumber="28" label="28. Финансовые и банковские сведения" />
          <div className={cn(cellContent, 'space-y-1')}>
            {/* ИНН/ПИНФЛ плательщика */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="text-[8px] text-gray-500 cursor-help">ИНН/ПИНФЛ:</label>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] max-w-[250px]">
                  <p>ИНН плательщика таможенных платежей</p>
                  <p className="text-gray-400">Для физлиц — ПИНФЛ (14 цифр)</p>
                  <p className="text-gray-400">При оплате нерезидентом — ИНН/ПИНФЛ брокера или декларанта</p>
                </TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="payerTin" render={({ field }) => (
                <Input 
                  className={cn(inputBase, 'flex-1 h-5')} 
                  placeholder="ИНН (9 цифр) или ПИНФЛ (14 цифр)" 
                  maxLength={14}
                  {...field} 
                  value={field.value ?? ''} 
                />
              )} />
              {/* Кнопки копирования */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      const tin = form.getValues('exporterTin');
                      if (tin) form.setValue('payerTin', tin);
                    }}
                    className="text-[8px] text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
                  >
                    ←Гр.2
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Скопировать ИНН из графы 2</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      const tin = form.getValues('declarantTin');
                      if (tin) form.setValue('payerTin', tin);
                    }}
                    className="text-[8px] text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
                  >
                    ←Гр.14
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Скопировать ИНН из графы 14</TooltipContent>
              </Tooltip>
            </div>
            {/* Дополнительная информация */}
            <FormField control={form.control} name="financialInfo" render={({ field }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Textarea 
                    className={cn(textareaBase, 'min-h-[50px]')} 
                    placeholder="Банк, № контракта, реквизиты..." 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">
                  Дополнительные банковские реквизиты (опционально)
                </TooltipContent>
              </Tooltip>
            )} />
          </div>
        </div>
      </div>

      {/* ========== ТОВАРНЫЕ ПОЗИЦИИ (31-49) ========== */}
      {fields.map((field, index) => (
        <div key={field.id} className="border-x border-b border-black">
          {/* Главный грид: ЛЕВАЯ часть (31 + ref + 44) | ПРАВАЯ часть (32-49) */}
          <div className="grid grid-cols-12">
            {/* ===== ЛЕВАЯ КОЛОНКА: Блок 31 + справочный номер + Блок 44 ===== */}
            <div className="col-span-5 border-r border-black">
              {/* Блок 31 - Грузовые места и описание товаров */}
              <div className={cn(cell, 'border-t-0 border-l-0 border-r-0')}>
                <GraphHeader graphNumber="31" label="31. Грузовые места и описание товаров" />
                <div className={cn(cellContent, 'space-y-1')}>
                  {/* 1) Наименование и описание товара */}
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-[7px] text-gray-500 cursor-help">1) Наименование товара:</label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] max-w-[250px]">
                        <p>Торговое/коммерческое наименование</p>
                        <p className="text-gray-400">Марки, модели, артикулы, сорта, стандарты</p>
                      </TooltipContent>
                    </Tooltip>
                    <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => (
                      <Textarea 
                        className={cn(textareaBase, 'min-h-[40px] text-[9px]')} 
                        placeholder="Наименование, характеристики, состав..." 
                        {...f} 
                        value={f.value ?? ''} 
                      />
                    )} />
                  </div>
                  
                  {/* Марка/бренд */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-[7px] text-gray-500 cursor-help whitespace-nowrap">Марка:</label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        Марка/бренд товара (или «без марки»)
                      </TooltipContent>
                    </Tooltip>
                    <FormField control={form.control} name={`items.${index}.brand`} render={({ field: f }) => (
                      <Input 
                        className={cn(inputBase, 'flex-1 h-5 text-[9px]')} 
                        placeholder="без марки" 
                        {...f} 
                        value={f.value ?? ''} 
                      />
                    )} />
                  </div>
                  
                  {/* 2) Упаковка */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-[7px] text-gray-500 cursor-help whitespace-nowrap">2) Упак:</label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                        <p>Количество мест, вид упаковки</p>
                        <p className="text-gray-400">01-насыпью, 02-навалом, 03-наливом</p>
                      </TooltipContent>
                    </Tooltip>
                    <FormField control={form.control} name={`items.${index}.packageQuantity`} render={({ field: f }) => (
                      <Input 
                        className={cn(inputBase, 'w-10 h-5 text-center text-[9px]')} 
                        placeholder="кол" 
                        type="number"
                        {...f} 
                        value={f.value ?? ''} 
                      />
                    )} />
                    <FormField control={form.control} name={`items.${index}.packageType`} render={({ field: f }) => (
                      <ModalSelect
                        value={f.value || ''}
                        onChange={f.onChange}
                        options={[
                          { value: 'CT', label: 'CT', description: 'Картонная коробка' },
                          { value: 'BX', label: 'BX', description: 'Коробка' },
                          { value: 'CR', label: 'CR', description: 'Ящик' },
                          { value: 'BG', label: 'BG', description: 'Мешок' },
                          { value: 'PK', label: 'PK', description: 'Упаковка' },
                          { value: 'PL', label: 'PL', description: 'Паллет' },
                          { value: 'DR', label: 'DR', description: 'Барабан' },
                          { value: 'RO', label: 'RO', description: 'Рулон' },
                          { value: 'TB', label: 'TB', description: 'Труба/тюбик' },
                          { value: 'CY', label: 'CY', description: 'Цилиндр/баллон' },
                          { value: 'JR', label: 'JR', description: 'Банка (стекло)' },
                          { value: 'CA', label: 'CA', description: 'Канистра' },
                          { value: '01', label: '01', description: 'Насыпью (без упаковки)' },
                          { value: '02', label: '02', description: 'Навалом (без упаковки)' },
                          { value: '03', label: '03', description: 'Наливом (без упаковки)' },
                        ]}
                        placeholder="Упак."
                        dialogTitle="Вид упаковки"
                        searchPlaceholder="Поиск вида упаковки..."
                        className="flex-1 text-[10px]"
                      />
                    )} />
                  </div>
                  
                  {/* 3) Номера контейнеров */}
                  {form.watch('containerIndicator') === '1' && (
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="text-[7px] text-gray-500 cursor-help whitespace-nowrap">3) Конт:</label>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          <p>Номера контейнеров через запятую</p>
                          <p className="text-gray-400">Часть контейнера: после номера «часть»</p>
                        </TooltipContent>
                      </Tooltip>
                      <FormField control={form.control} name={`items.${index}.containerNumbers`} render={({ field: f }) => (
                        <Input 
                          className={cn(inputBase, 'flex-1 h-5 text-[9px] font-mono')} 
                          placeholder="ABCU1234567, DEFG7654321" 
                          {...f} 
                          value={f.value ?? ''} 
                        />
                      )} />
                    </div>
                  )}
                  
                  {/* 4) Акцизные марки (для подакцизных товаров) */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label 
                          className="text-[7px] text-gray-400 cursor-pointer whitespace-nowrap hover:text-blue-500"
                          onClick={() => {
                            const curr = form.getValues(`items.${index}.exciseMarks`) || '';
                            if (!curr) form.setValue(`items.${index}.exciseMarks`, 'Серия ___, №№ ___, кол-во: ___');
                          }}
                        >
                          4) Акциз
                        </label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                        <p>Для подакцизных товаров</p>
                        <p className="text-gray-400">Серия, номера и количество акцизных марок</p>
                        <p className="text-blue-500 mt-1">Клик для ввода</p>
                      </TooltipContent>
                    </Tooltip>
                    {form.watch(`items.${index}.exciseMarks`) ? (
                      <FormField control={form.control} name={`items.${index}.exciseMarks`} render={({ field: f }) => (
                        <Input 
                          className={cn(inputBase, 'flex-1 h-5 text-[9px]')} 
                          placeholder="Серия, номера, кол-во" 
                          {...f} 
                          value={f.value ?? ''} 
                        />
                      )} />
                    ) : (
                      <span className="text-[8px] text-gray-300 italic">—</span>
                    )}
                  </div>
                  
                  {/* 5) Для трубопровода/ЛЭП: период поставки */}
                  {(form.watch('departureTransportType') === '71' || form.watch('departureTransportType') === '72') && (
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="text-[7px] text-gray-500 cursor-help whitespace-nowrap">5) Период:</label>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          <p>Период поставки для трубопровода/ЛЭП</p>
                          <p className="text-gray-400">Формат: с ДД.ММ.ГГГГ по ДД.ММ.ГГГГ</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-[8px] text-gray-500">с</span>
                      <FormField control={form.control} name={`items.${index}.deliveryPeriodFrom`} render={({ field: f }) => (
                        <Input 
                          className={cn(inputBase, 'w-20 h-5 text-center text-[9px]')} 
                          placeholder="ДД.ММ.ГГГГ" 
                          maxLength={10}
                          {...f} 
                          value={f.value ?? ''} 
                        />
                      )} />
                      <span className="text-[8px] text-gray-500">по</span>
                      <FormField control={form.control} name={`items.${index}.deliveryPeriodTo`} render={({ field: f }) => (
                        <Input 
                          className={cn(inputBase, 'w-20 h-5 text-center text-[9px]')} 
                          placeholder="ДД.ММ.ГГГГ" 
                          maxLength={10}
                          {...f} 
                          value={f.value ?? ''} 
                        />
                      )} />
                    </div>
                  )}
                  
                  {/* 6-11) Только для импорта: дополнительные пункты */}
                  {declarationType === 'Импорт' && (
                    <div className="space-y-1 border-t border-dashed border-blue-200 pt-1 mt-1">
                      {/* 6) Агрегированный импортный код */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">6) Агр.код:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            Агрегированный импортный код товаров
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.aggregateImportCode`} render={({ field: f }) => (
                          <Input className={cn(inputBase, 'flex-1 h-4 text-[8px]')} placeholder="—" {...f} value={f.value ?? ''} />
                        )} />
                      </div>
                      {/* 7) Срок годности */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">7) Срок годн:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                            <p>Срок годности (использования)</p>
                            <p className="text-gray-400">Для продовольственных товаров и лекарственных средств</p>
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.shelfLife`} render={({ field: f }) => (
                          <Input className={cn(inputBase, 'flex-1 h-4 text-[8px]')} placeholder="ДД.ММ.ГГГГ" maxLength={10} {...f} value={f.value ?? ''} />
                        )} />
                      </div>
                      {/* 8) Коды инвестиционных проектов */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">8) Инвест:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                            <p className="font-bold">Код инвестиционного проекта</p>
                            <p className="text-gray-400">101-103 — Инв. программа Президента</p>
                            <p className="text-gray-400">201-203 — Развитие территорий</p>
                            <p className="text-gray-400">301 — Прочие, 000 — Нет</p>
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.investmentProjectCode`} render={({ field: f }) => (
                          <ModalSelect
                            value={f.value || '000'}
                            onChange={f.onChange}
                            options={[
                              { value: '000', label: '000', description: 'Не относится к инвестпроекту' },
                              { value: '101', label: '101', description: 'Прямые иностр. инвестиции (Инв. программа)' },
                              { value: '102', label: '102', description: 'Кредиты МФО под гос. гарантии' },
                              { value: '103', label: '103', description: 'Иные проекты (решение Президента)' },
                              { value: '201', label: '201', description: 'Развитие территорий (иностр. инвестиции)' },
                              { value: '202', label: '202', description: 'Развитие территорий (кредиты банков)' },
                              { value: '203', label: '203', description: 'Иные проекты развития территорий' },
                              { value: '301', label: '301', description: 'Прочие проекты инв. программы' },
                            ]}
                            placeholder="000"
                            dialogTitle="Код инвестиционного проекта"
                            className="flex-1 text-[9px]"
                          />
                        )} />
                      </div>
                      {/* 9) Код сферы тех. оборудования */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">9) Сфера:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                            <p>3-значный код сферы (Приложение №16)</p>
                            <p className="text-gray-400">Для технологического оборудования</p>
                            <p className="text-gray-400">000 — если сфера не указана</p>
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.equipmentSphereCode`} render={({ field: f }) => (
                          <Input className={cn(inputBase, 'w-12 h-4 text-center text-[8px]')} placeholder="000" maxLength={3} {...f} value={f.value ?? ''} />
                        )} />
                        {/* 10) Год изготовления */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">10) Год:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p>Год изготовления оборудования</p>
                            <p className="text-gray-400">После / — тех. параметры</p>
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.manufacturingYear`} render={({ field: f }) => (
                          <Input className={cn(inputBase, 'w-16 h-4 text-center text-[8px]')} placeholder="2024" maxLength={20} {...f} value={f.value ?? ''} />
                        )} />
                      </div>
                      {/* 11) Госзакупки */}
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="text-[7px] text-blue-500 cursor-help whitespace-nowrap">11) Госзак:</label>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p>01 — госзакупки, 02 — нет</p>
                          </TooltipContent>
                        </Tooltip>
                        <FormField control={form.control} name={`items.${index}.govPurchaseCode`} render={({ field: f }) => (
                          <ModalSelect
                            value={f.value || '02'}
                            onChange={f.onChange}
                            options={[
                              { value: '01', label: '01', description: 'В рамках государственных закупок' },
                              { value: '02', label: '02', description: 'НЕ в рамках госзакупок' },
                            ]}
                            placeholder="02"
                            dialogTitle="Государственные закупки"
                            className="flex-1 text-[9px]"
                          />
                        )} />
                      </div>
                    </div>
                  )}
                  
                  {/* Нижняя часть: ИНН изготовителя/потребителя | Доп. единица */}
                  <div className="flex items-center gap-1 pt-0.5 border-t border-gray-200">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1">
                          <label className="text-[6px] text-gray-400">{declarationType === 'Импорт' ? 'ИНН/Район потреб.' : 'ИНН/Район изгот.'}</label>
                          <FormField control={form.control} name={`items.${index}.manufacturerTin`} render={({ field: f }) => (
                            <Input 
                              className={cn(inputBase, 'w-full h-4 text-[8px]')} 
                              placeholder="ИНН/код района" 
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          )} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                        {declarationType === 'Импорт' ? (
                          <>
                            <p>ИНН/КОД_РАЙОНА потребителя товара</p>
                            <p className="text-gray-400">Если неизвестен — данные получателя</p>
                          </>
                        ) : (
                          <>
                            <p>ИНН/КОД_РАЙОНА изготовителя</p>
                            <p className="text-gray-400">Если неизвестен — данные отправителя</p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-20">
                          <label className="text-[6px] text-gray-400">Доп.ед.изм.</label>
                          <FormField control={form.control} name={`items.${index}.supplementaryQuantity`} render={({ field: f }) => (
                            <Input 
                              className={cn(inputBase, 'w-full h-4 text-[8px] text-right')} 
                              placeholder="0.00" 
                              type="number"
                              step="0.01"
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          )} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        <p>Количество в доп. единице измерения</p>
                        <p className="text-gray-400">Не заполняется если только «кг»</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              {/* Строка со справочным номером контейнера/транспорта */}
              <div className="grid grid-cols-3 border-b border-black">
                {/* Ячейка 1: Номер контейнера/транспорта (один инпут) */}
                <div className={cn(cell, 'col-span-1 border-t-0 border-l-0 border-b-0')}>
                  <div className={cn(cellContent, 'py-1')}>
                    <FormField control={form.control} name={`items.${index}.containerTransportNumber`} render={({ field: f }) => (
                      <Input className={cn(inputBase, 'w-full h-5')} placeholder="204505304 / 1708220" {...f} value={f.value ?? ''} />
                    )} />
                  </div>
                </div>
                {/* Ячейка 2: Признак контейнера (0 = нет, 1 = да) */}
                <div className={cn(cell, 'col-span-1 border-t-0 border-b-0')}>
                  <div className={cn(cellContent, 'py-1')}>
                    <FormField control={form.control} name={`items.${index}.containerIndicator`} render={({ field: f }) => (
                      <Input className={cn(inputBase, 'w-full text-center h-5')} placeholder="0" {...f} value={f.value ?? '0'} />
                    )} />
                  </div>
                </div>
                {/* Ячейка 3: Пустое поле (резерв для доп. кодов) */}
                <div className={cn(cell, 'col-span-1 border-t-0 border-r-0 border-b-0')}>
                  <div className={cn(cellContent, 'py-1')}>
                    <FormField control={form.control} name={`items.${index}.additionalPackageCode`} render={({ field: f }) => (
                      <Input className={cn(inputBase, 'w-full h-5')} {...f} value={f.value ?? ''} />
                    )} />
                  </div>
                </div>
              </div>
              {/* Блок 44 - Доп. информация / Документы */}
              <div className={cn(cell, 'border-t-0 border-l-0 border-r-0 border-b-0')}>
                <GraphHeader graphNumber="44" label="44.Документы/доп.информация" className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[7px] text-blue-600 cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[9px] max-w-[280px]">
                      <p className="font-bold">Формат: КОД АББР № номер от дата</p>
                      <div className="text-gray-400 mt-1 space-y-0.5">
                        <p><b>а)</b> 101 — Лицензия</p>
                        <p><b>б)</b> 202 CMR / 205 АВИА — транспорт</p>
                        <p>220 — Инвойс</p>
                        <p><b>в)</b> 301 — Контракт + ID ЕЭИС ВТО</p>
                        {declarationType === 'Временный вывоз' && (
                          <p className="text-orange-500"><b>⭐</b> 303 — Договор аренды</p>
                        )}
                        <p><b>г)</b> 417 — Серт. соответствия</p>
                        <p>419 — Фитосанитарный серт.</p>
                        <p><b>д)</b> 501 — Рег. МИВТ</p>
                        <p>502 — Свид-во ИПБЮЛ</p>
                        <p><b>е)</b> 610 — Льготы</p>
                        {declarationType === 'Импорт' && (
                          <>
                            <p className="text-blue-400">620 — Льгота по пошлине</p>
                            <p className="text-blue-400">629 — Льгота по НДС</p>
                          </>
                        )}
                        <p><b>ж)</b> {declarationType === 'Импорт' ? '701 — Серт. происх. (импорт)' : '702 — Серт. происхождения'}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </GraphHeader>
                <div className={cellContent}>
                  <FormField control={form.control} name={`items.${index}.additionalInfo`} render={({ field: f }) => (
                    <div className="space-y-1">
                      {/* Быстрые кнопки добавления документов */}
                      <div className="flex flex-wrap gap-0.5 mb-1">
                        {[
                          { code: '101', abbr: 'ЛИЦ', title: 'Лицензия' },
                          { code: '202', abbr: 'CMR', title: 'CMR накладная' },
                          { code: '205', abbr: 'АВИА', title: 'Авиа накладная' },
                          { code: '220', abbr: 'ИНВ', title: 'Инвойс' },
                          { code: '301', abbr: 'КНТ', title: 'Контракт' },
                          ...(declarationType === 'Временный вывоз' ? [{ code: '303', abbr: 'АРЕНД', title: 'Договор аренды' }] : []),
                          { code: '417', abbr: 'ССТ', title: 'Сертификат соотв.' },
                          { code: '419', abbr: 'ФТСС', title: 'Фитосанитарный серт.' },
                          { code: '501', abbr: 'МИВТ', title: 'Рег. МИВТ' },
                          { code: '502', abbr: 'ИПБЮЛ', title: 'Свид-во ИПБЮЛ' },
                          { code: '610', abbr: 'ЛЬГОТ', title: 'Льготы' },
                          ...(declarationType === 'Импорт' ? [
                            { code: '620', abbr: 'ПОШЛ', title: 'Льгота по пошлине' },
                            { code: '629', abbr: 'НДС', title: 'Льгота по НДС' },
                            { code: '701', abbr: 'СПТИМ', title: 'Серт. происхождения (импорт)' },
                          ] : [
                            { code: '702', abbr: 'СПТЭК', title: 'Серт. происхождения (экспорт)' },
                          ]),
                        ].map(doc => (
                          <Tooltip key={doc.code}>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-4 text-[7px] px-1"
                                onClick={() => {
                                  const currentDocs = f.value || '';
                                  const newLine = currentDocs ? '\n' : '';
                                  f.onChange(currentDocs + newLine + `${doc.code} ${doc.abbr} № ___ от ___`);
                                }}
                              >
                                +{doc.abbr}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[9px]">
                              {doc.code} — {doc.title}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Textarea 
                            className={cn(textareaBase, 'min-h-[50px] text-[9px] font-mono')} 
                            placeholder="301 КНТ № ЭКС-123 от 01.01.2025&#10;220 ИНВ № 456 от 15.01.2025&#10;417 ССТ № UZ.SMT.01.065.12345 от 10.01.2025" 
                            {...f} 
                            value={f.value ?? ''} 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[9px] max-w-[250px]">
                          <p>Каждый документ с новой строки</p>
                          <p className="text-gray-400">+ ID контракта в ЕЭИС ВТО</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )} />
                </div>
              </div>
            </div>

            {/* ===== ПРАВАЯ КОЛОНКА: Блоки 32-49 ===== */}
            <div className="col-span-7">
              {/* Ряд 1: Блок 32 | Блок 33 */}
              <div className="grid grid-cols-7 border-b border-black">
                <div className={cn(cell, 'col-span-2 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="32" label="32.Товар №" />
                  <div className={cn(cellContent, 'text-center font-bold text-[10px]')}>{index + 1}</div>
                </div>
                <div className={cn(cell, 'col-span-5 border-t-0 border-r-0 border-b-0')}>
                  <GraphHeader graphNumber="33" label="33.Код товара (ТН ВЭД)" />
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.hsCode`} render={({ field: f }) => {
                      const hsValue = f.value || '';
                      const isValid = hsValue.length === 10 && /^\d{10}$/.test(hsValue);
                      const isPartial = hsValue.length > 0 && hsValue.length < 10;
                      // Определяем группу товара по первым 2 цифрам
                      const hsGroup = hsValue.substring(0, 2);
                      const groupNames: Record<string, string> = {
                        '01': 'Живые животные', '02': 'Мясо', '03': 'Рыба', '04': 'Молоко, яйца',
                        '05': 'Продукты животного происх.', '06': 'Живые растения', '07': 'Овощи',
                        '08': 'Фрукты, орехи', '09': 'Кофе, чай, пряности', '10': 'Зерновые',
                        '11': 'Продукция мукомольной пром.', '12': 'Масличные семена',
                        '27': 'Топливо, нефть', '28': 'Неорг. химия', '29': 'Орг. химия',
                        '39': 'Пластмассы', '40': 'Каучук', '44': 'Древесина', '48': 'Бумага',
                        '52': 'Хлопок', '61': 'Трикотаж', '62': 'Одежда текстиль',
                        '72': 'Чёрные металлы', '73': 'Изделия из чёрных металлов',
                        '84': 'Оборудование, машины', '85': 'Электрооборудование',
                        '87': 'Автомобили', '90': 'Приборы, инструменты',
                      };
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Input 
                                className={cn(
                                  inputBase, 
                                  'font-mono font-bold h-5 flex-1',
                                  isPartial && 'border border-orange-400 bg-orange-50',
                                  isValid && 'border border-green-400 bg-green-50'
                                )} 
                                placeholder="0000000000" 
                                maxLength={10}
                                {...f} 
                                value={hsValue}
                                onChange={(e) => f.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                              />
                              {hsValue && (
                                <span className={cn(
                                  'text-[7px] px-1 rounded whitespace-nowrap',
                                  isValid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                )}>
                                  {isValid ? '✓' : `${hsValue.length}/10`}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[250px]">
                            <p className="font-bold">10-значный код ТН ВЭД</p>
                            {hsGroup && groupNames[hsGroup] && (
                              <p className="text-blue-600">Группа {hsGroup}: {groupNames[hsGroup]}</p>
                            )}
                            <p className="text-gray-400">Без пробелов и разделителей</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }} />
                  </div>
                </div>
              </div>

              {/* Ряд 2: Блок 34 | Блок 35 */}
              <div className="grid grid-cols-7 border-b border-black">
                <div className={cn(cell, 'col-span-3 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="34" label="34.Код стр. происх." />
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.originCountryCode`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5">
                            <CountrySelect 
                              value={f.value} 
                              onChange={(code, numericCode) => {
                                f.onChange(numericCode || code);
                              }} 
                              placeholder="Выбрать" 
                              showNumericCode 
                              className="h-5 text-[10px] flex-1" 
                            />
                            {/* Быстрые кнопки */}
                            <button
                              type="button"
                              onClick={() => f.onChange('860')}
                              className={cn(
                                "text-[7px] px-1 py-0.5 rounded border",
                                f.value === '860' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 hover:bg-gray-100'
                              )}
                              title="Узбекистан"
                            >
                              UZ
                            </button>
                            <button
                              type="button"
                              onClick={() => f.onChange('000')}
                              className={cn(
                                "text-[7px] px-1 py-0.5 rounded border",
                                f.value === '000' ? 'bg-orange-100 border-orange-400 text-orange-700' : 'border-gray-300 hover:bg-gray-100'
                              )}
                              title="Неизвестно"
                            >
                              ?
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                          <p>Цифровой код страны происхождения</p>
                          <p className="text-gray-400">000 — если неизвестна</p>
                          <p className="text-gray-400">EU — для ЕС без конкретной страны</p>
                        </TooltipContent>
                      </Tooltip>
                    )} />
                  </div>
                </div>
                <div className={cn(cell, 'col-span-2 border-t-0 border-b-0')}>
                  <GraphHeader graphNumber="35" label="35.Вес брутто (кг)" />
                  <div className={cellContent}>
                    {/* Не заполняется для ЛЭП (код 72) */}
                    {form.watch('departureTransportType') === '72' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[8px] text-gray-400 italic cursor-help">Не заполн. для ЛЭП</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          При перемещении по ЛЭП графа 35 не заполняется
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.grossWeight`} render={({ field: f }) => {
                        const netWeight = form.watch(`items.${index}.netWeight`);
                        const grossWeight = f.value || 0;
                        const isValid = !netWeight || grossWeight >= netWeight;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input 
                                type="number" 
                                step="0.001" 
                                className={cn(
                                  inputBase, 
                                  'h-5',
                                  !isValid && 'border border-red-400 bg-red-50',
                                  isValid && grossWeight > 0 && 'border border-green-400 bg-green-50'
                                )} 
                                placeholder="0.000"
                                {...f} 
                                value={grossWeight || ''} 
                                onChange={e => f.onChange(parseFloat(e.target.value) || 0)} 
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                              <p>Масса товара с упаковкой</p>
                              <p className="text-gray-400">Без контейнеров и трансп. оборуд.</p>
                              <p className="text-gray-400">Точность: до 3 знаков (0.001 кг)</p>
                              {!isValid && <p className="text-red-500 font-bold">Брутто должен быть ≥ Нетто!</p>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }} />
                    )}
                  </div>
                </div>
                <div className={cn(cell, 'col-span-2 border-t-0 border-r-0 border-b-0', isGraphDisabled('36') && 'bg-gray-100 opacity-50')}>
                  <GraphHeader graphNumber="36" label="36.Преференция" />
                  <div className={cellContent}>
                    {isGraphDisabled('36') ? (
                      <div className="text-[8px] text-gray-400 italic text-center">—</div>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.preferenceCode`} render={({ field: f }) => (
                        <ModalSelect
                          value={f.value || '000'}
                          onChange={f.onChange}
                          options={PREFERENCE_CODES.map(p => ({ value: p.code, label: p.code, description: p.name }))}
                          placeholder="000"
                          dialogTitle="Код преференции"
                          searchPlaceholder="Поиск..."
                          className="text-[10px]"
                        />
                      )} />
                    )}
                  </div>
                </div>
              </div>

              {/* Ряд 3: Блок 37 | Блок 38 | Блок 39 */}
              <div className="grid grid-cols-7 border-b border-black">
                <div className={cn(cell, 'col-span-2 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="37" label="37.Процедура" />
                  <div className={cn(cellContent, 'flex items-center gap-0.5')}>
                    {/* Первая часть - код текущего режима (XX) */}
                    <FormField control={form.control} name={`items.${index}.procedureCode`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            className={cn(inputBase, 'w-6 text-center h-5 font-bold bg-blue-50 text-blue-700')} 
                            {...f} 
                            value={f.value ?? '10'} 
                            readOnly 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          <p className="font-bold">Заявляемый режим (XX)</p>
                          <p className="text-gray-400">Авто из типа декларации</p>
                        </TooltipContent>
                      </Tooltip>
                    )} />
                    <span className="text-[8px] text-gray-400">/</span>
                    {/* Вторая часть - код предшествующего режима (YY) */}
                    <FormField control={form.control} name={`items.${index}.previousProcedureCode`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {declarationType === 'Реэкспорт' ? (
                              <ModalSelect
                                value={f.value || '40'}
                                onChange={f.onChange}
                                options={[
                                  { value: '40', label: '40', description: 'После импорта (выпуск)' },
                                  { value: '74', label: '74', description: 'После там. склада' },
                                  { value: '31', label: '31', description: 'После врем. ввоза' },
                                  { value: '51', label: '51', description: 'После переработки на тер.' },
                                  { value: '70', label: '70', description: 'После врем. хранения' },
                                  { value: '80', label: '80', description: 'После транзита' },
                                ]}
                                placeholder="YY"
                                dialogTitle="Предшествующий режим (обязательно)"
                                className="text-[10px] w-8"
                              />
                            ) : declarationType === 'Временный вывоз' ? (
                              <ModalSelect
                                value={f.value || '00'}
                                onChange={f.onChange}
                                options={[
                                  { value: '00', label: '00', description: 'Первичный временный вывоз' },
                                  { value: '40', label: '40', description: 'Ранее импортированный товар' },
                                  { value: '10', label: '10', description: 'После экспорта (редко)' },
                                ]}
                                placeholder="YY"
                                dialogTitle="Предшествующий режим"
                                className="text-[10px] w-8"
                              />
                            ) : (
                              <Input 
                                className={cn(inputBase, 'w-6 text-center h-5')} 
                                {...f} 
                                value={f.value ?? '00'} 
                                placeholder="00"
                                maxLength={2}
                              />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                          <p className="font-bold">Предшествующий режим (YY)</p>
                          {declarationType === 'Реэкспорт' ? (
                            <>
                              <p className="text-red-500">⭐ Обязательно для реэкспорта!</p>
                              <p className="text-gray-400">40-импорт, 74-склад, 31-врем.ввоз</p>
                            </>
                          ) : declarationType === 'Временный вывоз' ? (
                            <>
                              <p className="text-gray-400">00 — первичный временный вывоз</p>
                              <p className="text-gray-400">40 — ранее импортированный</p>
                            </>
                          ) : (
                            <p className="text-gray-400">00 — если нет</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )} />
                    <span className="text-[8px] text-gray-400">/</span>
                    {/* Третья часть - особенность перемещения (ZZZ) */}
                    <FormField control={form.control} name={`items.${index}.additionalProcedureCode`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            className={cn(inputBase, 'w-8 text-center h-5')} 
                            {...f} 
                            value={f.value ?? '000'} 
                            placeholder="000"
                            maxLength={3}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                          <p className="font-bold">Особенность перемещения (ZZZ)</p>
                          <p className="text-gray-400">000 — обычный экспорт</p>
                          <p className="text-gray-400">001 — гуманит. помощь</p>
                          <p className="text-gray-400">002 — техн. помощь</p>
                        </TooltipContent>
                      </Tooltip>
                    )} />
                  </div>
                </div>
                <div className={cn(cell, 'col-span-3 border-t-0 border-b-0')}>
                  <GraphHeader graphNumber="38" label="38.Вес нетто (кг)" />
                  <div className={cellContent}>
                    {/* Не заполняется для ЛЭП (код 72) */}
                    {form.watch('departureTransportType') === '72' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[8px] text-gray-400 italic cursor-help">Не заполн. для ЛЭП</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          При перемещении по ЛЭП графа 38 не заполняется
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.netWeight`} render={({ field: f }) => {
                        const grossWeight = form.watch(`items.${index}.grossWeight`);
                        const netWeight = f.value || 0;
                        const isValid = !grossWeight || netWeight <= grossWeight;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input 
                                type="number" 
                                step="0.001" 
                                className={cn(
                                  inputBase, 
                                  'h-5',
                                  !isValid && 'border border-red-400 bg-red-50',
                                  isValid && netWeight > 0 && 'border border-green-400 bg-green-50'
                                )} 
                                placeholder="0.000"
                                {...f} 
                                value={netWeight || ''} 
                                onChange={e => f.onChange(parseFloat(e.target.value) || 0)} 
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                              <p className="font-bold">Масса товара без упаковки</p>
                              <p className="text-gray-400">С первичной упаковкой — если для розницы</p>
                              <p className="text-gray-400">Точность: до 3 знаков (0.001 кг)</p>
                              <p className="text-gray-400">Трубопровод: = брутто</p>
                              {!isValid && <p className="text-red-500 font-bold">Нетто должен быть ≤ Брутто!</p>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }} />
                    )}
                  </div>
                </div>
                <div className={cn(cell, 'col-span-2 border-t-0 border-r-0 border-b-0', isGraphDisabled('39') && 'bg-gray-100 opacity-50')}>
                  <GraphHeader graphNumber="39" label="39.Квота" />
                  <div className={cellContent}>
                    {isGraphDisabled('39') ? (
                      <div className="text-[8px] text-gray-400 italic text-center">—</div>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.quotaNumber`} render={({ field: f }) => {
                        const hasQuota = f.value && f.value !== '0' && f.value !== '';
                        return hasQuota ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input 
                                className={cn(inputBase, 'h-5')} 
                                placeholder="0"
                                {...f} 
                                value={f.value ?? ''} 
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                              <p className="font-bold">Остаток квоты</p>
                              <p className="text-gray-400">Указывается остаток БЕЗ учёта текущей партии</p>
                              <p className="text-gray-400 mt-1">Пример: 10000 м³</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="text-[9px] text-gray-400 italic text-center cursor-pointer hover:text-blue-500"
                                onClick={() => f.onChange('___')}
                              >
                                — (клик для ввода)
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                              <p className="font-bold">Заполняется только для квотируемых товаров</p>
                              <p className="text-gray-400">Товары с количественными ограничениями</p>
                              <p className="text-gray-400 mt-1">Если товар без квоты — оставить пустым</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Ряд 4: Блок 40 (на всю ширину правой колонки) */}
              {(() => {
                const prevProcCode = form.watch(`items.${index}.previousProcedureCode`);
                const isReexport = declarationType === 'Реэкспорт';
                // Для Реэкспорта — всегда обязательна, для остальных — если предшествующий режим != '00'
                const isPrevDocRequired = isReexport || (prevProcCode && prevProcCode !== '00');
                
                // Получаем допустимые типы документов
                const getAllowedTypes = () => {
                  const key = prevProcCode as string;
                  if (key && key in PREVIOUS_DOCUMENT_RULES) {
                    const rules = PREVIOUS_DOCUMENT_RULES[key as keyof typeof PREVIOUS_DOCUMENT_RULES];
                    return rules.docTypes as readonly string[];
                  }
                  // Для реэкспорта без указанного режима — допускаем все типы
                  return [] as readonly string[];
                };
                const allowedTypes = getAllowedTypes();
                
                if (!isPrevDocRequired) {
                  return (
                    <div className={cn(cell, 'border-t-0 border-l-0 border-r-0')}>
                      <GraphHeader graphNumber="40" label="40.Общая декларация/предшествующий документ" />
                      <div className={cn(cellContent)}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[9px] text-gray-400 italic cursor-help">
                              Не требуется (предшествующий режим: 00)
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[250px]">
                            <p>Заполняется только если товар ранее был под другим режимом</p>
                            <p className="text-gray-400 mt-1">Формат: ТИП/ККККК-ДДММГГ-ННННННН-Т</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className={cn(cell, 'border-t-0 border-l-0 border-r-0')}>
                    <GraphHeader graphNumber="40" label="40.Общая декларация/предшествующий документ" className="bg-yellow-50 flex justify-between">
                      <span className="text-[8px] text-orange-600 font-medium">
                        {isReexport ? '⭐ Обязательно (Реэкспорт)' : 'Обязательно'}
                      </span>
                    </GraphHeader>
                    <div className={cn(cellContent, 'flex items-center gap-1 flex-wrap')}>
                      {/* Тип документа */}
                      <FormField control={form.control} name={`items.${index}.prevDocType`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ModalSelect
                                value={f.value || ''}
                                onChange={f.onChange}
                                options={PREVIOUS_DOCUMENT_TYPES
                                  .filter(d => !allowedTypes.length || allowedTypes.includes(d.code))
                                  .map(d => ({ value: d.code, label: d.code, description: d.name }))}
                                placeholder="Тип"
                                dialogTitle="Тип предшествующего документа"
                                searchPlaceholder="Поиск..."
                                className="text-[10px] min-w-[45px]"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p className="font-bold">Тип документа</p>
                            <p className="text-gray-400">ГТД, ТД, ТПО и др.</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                      <span className="text-[10px]">/</span>
                      
                      {/* Код таможни */}
                      <FormField control={form.control} name={`items.${index}.prevDocCustomsCode`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              className={cn(inputBase, 'w-12 text-center h-5 text-[10px]')} 
                              placeholder="00000"
                              maxLength={5}
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p className="font-bold">Код таможни</p>
                            <p className="text-gray-400">5 цифр из предшеств. ГТД</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                      <span className="text-[10px]">-</span>
                      
                      {/* Дата (ДДММГГ) */}
                      <FormField control={form.control} name={`items.${index}.prevDocDate`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              className={cn(inputBase, 'w-14 text-center h-5 text-[10px]')} 
                              placeholder="ДДММГГ"
                              maxLength={6}
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p className="font-bold">Дата регистрации</p>
                            <p className="text-gray-400">Формат: ДДММГГ</p>
                            <p className="text-gray-400">Пример: 310312</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                      <span className="text-[10px]">-</span>
                      
                      {/* Номер документа */}
                      <FormField control={form.control} name={`items.${index}.prevDocNumber`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              className={cn(inputBase, 'w-16 text-center h-5 text-[10px]')} 
                              placeholder="0000000"
                              maxLength={7}
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p className="font-bold">Регистрационный номер</p>
                            <p className="text-gray-400">7 цифр (порядковый номер)</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                      <span className="text-[10px]">-</span>
                      
                      {/* Номер товара */}
                      <FormField control={form.control} name={`items.${index}.prevDocItemNumber`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              className={cn(inputBase, 'w-8 text-center h-5 text-[10px]')} 
                              placeholder="0"
                              maxLength={3}
                              {...f} 
                              value={f.value ?? ''} 
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p className="font-bold">№ товара</p>
                            <p className="text-gray-400">из предшеств. ГТД</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                    </div>
                  </div>
                );
              })()}

              {/* Ряд 5: Блок 41 | Блок 42 | Блок 43 */}
              <div className="grid grid-cols-7 border-b border-black">
                <div className={cn(cell, 'col-span-1 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="41" label="41.Ед.изм" />
                  <div className={cellContent}>
                    {/* Не заполняется если единица только кг (166) */}
                    {form.watch(`items.${index}.supplementaryUnit`) === '166' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-gray-400 italic cursor-help">—</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          <p>Не заполняется если единица только «кг»</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.supplementaryUnit`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ModalSelect
                                value={f.value || '796'}
                                onChange={f.onChange}
                                options={UNIT_CODES.filter(u => u.code !== '166').map(u => ({ value: u.code, label: `${u.code} ${u.name}`, description: u.fullName }))}
                                placeholder="шт"
                                dialogTitle="Дополнительная единица измерения"
                                searchPlaceholder="Поиск..."
                                className="text-[11px]"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[180px]">
                            <p className="font-bold">Код ед. изм. из ТН ВЭД</p>
                            <p className="text-gray-400">Пример: 006 (м), 796 (шт)</p>
                            <p className="text-blue-500 mt-1">Не заполн. если только «кг»</p>
                          </TooltipContent>
                        </Tooltip>
                      )} />
                    )}
                  </div>
                </div>
                <div className={cn(cell, 'col-span-4 border-t-0 border-b-0')}>
                  <GraphHeader graphNumber="42" label="42.Факт.стоимость" className="flex items-center gap-1">
                    <span className="text-[7px] text-blue-600 font-medium">{form.watch('currency') || 'USD'}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-3 text-[7px] px-1 bg-blue-50"
                      onClick={() => recalculateItemDuties(index)}
                      title="Пересчитать пошлины"
                    >
                      ⟳
                    </Button>
                  </GraphHeader>
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.itemPrice`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className={cn(inputBase, 'h-5')} 
                            placeholder="0.00"
                            {...f} 
                            value={f.value || ''} 
                            onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
                            onBlur={() => recalculateItemDuties(index)}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                          <p className="font-bold">Фактурная стоимость товара</p>
                          <p className="text-gray-400">В валюте контракта (Гр.22)</p>
                          <p className="text-gray-400">Округление: до 2 знаков</p>
                          <p className="text-gray-400 mt-1">Безвозмездно: по документам</p>
                          <p className="text-gray-400">Валюта: сумма перемещаемой</p>
                          <p className="text-gray-400">Ценные бумаги: номинал</p>
                        </TooltipContent>
                      </Tooltip>
                    )} />
                  </div>
                </div>
                <div className={cn(cell, 'col-span-2 border-t-0 border-r-0 border-b-0', isGraphDisabled('43') && 'bg-gray-100 opacity-50')}>
                  <GraphHeader graphNumber="43" label="43.М.О." />
                  <div className={cellContent}>
                    {isGraphDisabled('43') ? (
                      <div className="text-[8px] text-gray-400 italic text-center">—</div>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.valuationMethodCode`} render={({ field: f }) => (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ModalSelect
                                value={f.value || (declarationType === 'Импорт' ? '0' : '1')}
                                onChange={f.onChange}
                                options={declarationType === 'Импорт' ? [
                                  { value: '0', label: '0', description: 'Товар НЕ для собственных нужд' },
                                  { value: '1', label: '1', description: 'Товар для собственных нужд' },
                                ] : [
                                  { value: '0', label: '0', description: 'Экспорт продукции НЕ собственного производства' },
                                  { value: '1', label: '1', description: 'Экспорт продукции собственного производства' },
                                ]}
                                placeholder={declarationType === 'Импорт' ? '0' : '1'}
                                dialogTitle={declarationType === 'Импорт' ? 'Назначение товара (Импорт)' : 'Метод определения (Экспорт)'}
                                searchPlaceholder="Поиск..."
                                className="text-[11px]"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                            {declarationType === 'Импорт' ? (
                              <>
                                <p className="font-bold">Назначение товара</p>
                                <p className="text-gray-400">0 — НЕ для собственных нужд</p>
                                <p className="text-gray-400">1 — Для собственных нужд</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold">Метод определения</p>
                                <p className="text-gray-400">0 — НЕ собственное производство</p>
                                <p className="text-gray-400">1 — Собственное производство</p>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )} />
                    )}
                  </div>
                </div>
              </div>

              {/* Ряд 6: Блок 45 | Блок 46 */}
              {/* Ряд 6: Блок 45 | Блок 46 - с автоматическим расчётом */}
              <div className="grid grid-cols-7 border-b border-black">
                <div className={cn(cell, 'col-span-4 border-t-0 border-l-0 border-b-0')}>
                  <GraphHeader graphNumber="45" label="45.Там.стоимость" className="flex items-center gap-1">
                    <span className="text-[7px] text-blue-600 font-medium">{form.watch('currency') || 'USD'}</span>
                    <span className="text-[6px] text-gray-400">(авто)</span>
                  </GraphHeader>
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.customsValue`} render={({ field: f }) => (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className={cn(inputBase, 'font-bold h-5 bg-blue-50')} 
                            placeholder="0.00"
                            {...f} 
                            value={f.value || ''} 
                            onChange={e => f.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] max-w-[220px]">
                          <p className="font-bold">Таможенная стоимость</p>
                          <p className="text-gray-400">В валюте контракта (Гр.22)</p>
                          <p className="text-gray-400">Авто: Гр.42 × курс</p>
                          <p className="text-gray-400">Округление: до 2 знаков</p>
                          <p className="text-blue-500 mt-1">Безвозмездно: по документам</p>
                        </TooltipContent>
                      </Tooltip>
                    )} />
                  </div>
                </div>
                <div className={cn(cell, 'col-span-3 border-t-0 border-r-0 border-b-0')}>
                  <GraphHeader graphNumber="46" label="46.Стат.стоим." className="flex items-center gap-1">
                    <span className="text-[7px] text-green-600 font-medium">тыс.USD</span>
                  </GraphHeader>
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.statisticalValue`} render={() => {
                      // Авто-расчёт:
                      // Экспорт: там.стоимость (гр.45) / курс USD / 1000
                      // Импорт: фактурная стоимость (гр.42) / курс USD / 1000 (приведение к CIP/CIF)
                      const isImport = declarationType === 'Импорт';
                      const baseVal = isImport 
                        ? (form.watch(`items.${index}.itemPrice`) || 0)
                        : (form.watch(`items.${index}.customsValue`) || 0);
                      const usdRate = parseFloat(String(form.watch('exchangeRate'))) || 1;
                      const statVal = baseVal > 0 ? (baseVal / usdRate / 1000).toFixed(3) : '';
                      
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input 
                              type="text" 
                              className={cn(inputBase, 'h-5 bg-gray-50 text-right')} 
                              placeholder="0.000"
                              value={statVal}
                              readOnly
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                            <p className="font-bold">Статистическая стоимость</p>
                            <p className="text-gray-400">В тысячах долларов США</p>
                            {isImport ? (
                              <p className="text-gray-400">Авто: Гр.42 (факт.) / курс USD / 1000</p>
                            ) : (
                              <p className="text-gray-400">Авто: Гр.45 (там.) / курс USD / 1000</p>
                            )}
                            <p className="text-gray-400">Округление: до 3 знаков</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }} />
                  </div>
                </div>
              </div>

              {/* Ряд 7: Блок 48 | Блок 49 */}
              <div className="grid grid-cols-7">
                <div className={cn(cell, 'col-span-3 border-t-0 border-l-0 border-b-0', isGraphDisabled('48') && 'bg-gray-100 opacity-50')}>
                  <GraphHeader graphNumber="48" label="48. Отсрочка платежей" />
                  <div className={cellContent}>
                    {isGraphDisabled('48') ? (
                      <div className="text-[8px] text-gray-400 italic text-center">Не заполняется</div>
                    ) : (
                      <FormField control={form.control} name={`items.${index}.deferredPayment`} render={({ field: f }) => {
                        const hasDeferred = f.value && f.value !== '0' && f.value !== '';
                        return hasDeferred ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input 
                                className={cn(inputBase, 'h-5 font-mono text-[9px]')} 
                                {...f} 
                                value={f.value ?? ''} 
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[9px] max-w-[220px]">
                              <p className="font-bold">Формат отсрочки:</p>
                              <p className="text-gray-400">XX.ДД.ММ.ГГГГ</p>
                              <p className="font-bold mt-1">Формат рассрочки:</p>
                              <p className="text-gray-400">ПН.XX.ДД.ММ.ГГГГ.СУММА</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="text-[9px] text-gray-400 italic text-center cursor-pointer hover:text-blue-500"
                                onClick={() => f.onChange('20.__.__.____')}
                              >
                                — (клик для ввода)
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[9px] max-w-[220px]">
                              <p className="font-bold">Заполняется при отсрочке/рассрочке</p>
                              <p className="text-gray-400 mt-1">Отсрочка: XX.ДД.ММ.ГГГГ</p>
                              <p className="text-gray-400">XX — код платежа (10, 20, 29)</p>
                              <p className="text-gray-400 mt-1">Рассрочка: ПН.XX.ДД.ММ.ГГГГ.СУММА</p>
                              <p className="text-gray-400">Пример: 1.20.01.06.2025.100000000</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }} />
                    )}
                  </div>
                </div>
                <div className={cn(cell, 'col-span-4 border-t-0 border-r-0 border-b-0')}>
                  <GraphHeader graphNumber="49" label="49. Наименование склада" />
                  <div className={cellContent}>
                    <FormField control={form.control} name={`items.${index}.warehouseName`} render={({ field: f }) => {
                      const hasWarehouse = f.value && f.value !== '0' && f.value !== '';
                      return hasWarehouse ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input className={cn(inputBase, 'h-5')} {...f} value={f.value ?? ''} />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            <p>№ и дата лицензии там./своб. склада</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="text-[9px] text-gray-400 italic text-center cursor-pointer hover:text-blue-500"
                              onClick={() => f.onChange('Лиц. № ___ от ___')}
                            >
                              — (клик для ввода)
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                            <p className="font-bold">Заполняется если товары хранились на складе</p>
                            <p className="text-gray-400">№ и дата лицензии там./своб. склада</p>
                            <p className="text-gray-400 mt-1">Если не хранились — оставить пустым</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка удаления товара */}
          {fields.length > 1 && (
            <div className="p-0.5 bg-gray-50 border-t border-gray-200">
              <Button type="button" variant="ghost" size="sm" className="h-4 text-[6px] text-red-500" onClick={() => remove(index)}>
                <Trash2 className="h-2 w-2 mr-0.5" />Удалить товар #{index + 1}
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Кнопка добавления товара */}
      <div className="border-x border-b border-black p-1 bg-gray-50">
        <Button type="button" variant="outline" size="sm" className="w-full h-5 text-[10px] border-dashed border-green-500 text-green-600" onClick={addProduct}>
          <Plus className="h-2 w-2 mr-0.5" />Добавить товар
        </Button>
      </div>

      {/* ========== БЛОКИ 47 + B (верхняя часть) ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ КОЛОНКА: Блок 47 */}
        <div className={cn(cell, 'col-span-6 border-l-0 border-b-0')}>
          <GraphHeader graphNumber="47" label="47. Исчисление таможенных пошлин и сборов" className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" className="h-4 text-[8px] px-1 bg-blue-50 hover:bg-blue-100" onClick={recalculateAllDuties}>
              <RefreshCw className="h-2.5 w-2.5 mr-0.5" />Пересчитать
            </Button>
          </GraphHeader>
          <div className={cellContent}>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <th className="text-left p-0.5 border-r border-black w-8 cursor-help">Вид</th>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[9px]">
                      <p className="font-bold">Код вида платежа</p>
                      <p className="text-gray-400">10 — Там. сбор</p>
                      <p className="text-gray-400">20 — Там. пошлина</p>
                      <p className="text-gray-400">29 — НДС</p>
                    </TooltipContent>
                  </Tooltip>
                  <th className="text-left p-0.5 border-r border-black">Осн. начисл-я</th>
                  <th className="text-left p-0.5 border-r border-black w-14">Ставка</th>
                  <th className="text-left p-0.5 border-r border-black">Сумма</th>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <th className="text-left p-0.5 border-r border-black w-10 cursor-help">СП</th>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[9px] max-w-[180px]">
                      <p className="font-bold">Способ платежа</p>
                      <p className="text-gray-400">БН — Безналичный</p>
                      <p className="text-gray-400">КТ — Наличными</p>
                      <p className="text-gray-400">УН — Условное</p>
                      <p className="text-gray-400">ОП — Отсрочка</p>
                      <p className="text-gray-400">РП — Рассрочка</p>
                      <p className="text-gray-400">ВЗ — Взаимозачёт НДС</p>
                      <p className="text-gray-400">ОО — Не производится</p>
                    </TooltipContent>
                  </Tooltip>
                </tr>
              </thead>
              <tbody>
                {/* Строка 1: Таможенный сбор (код 10) */}
                <tr className="border-b border-black">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="p-0.5 border-r border-black text-center font-medium cursor-help">10</td>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-[9px]">
                      <p className="font-bold">Таможенный сбор</p>
                      <p className="text-gray-400">За оформление ГТД</p>
                    </TooltipContent>
                  </Tooltip>
                  <td className="p-0.5 border-r border-black">
                    <FormField control={form.control} name="dutyBase" render={({ field }) => (
                      <span className="text-[10px]">{field.value || '-'}</span>
                    )} />
                  </td>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="p-0.5 border-r border-black text-center cursor-help">
                        <span className="text-[9px]">4 БРВ</span>
                      </td>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[9px]">
                      <p>4 базовых расчётных величины</p>
                      <p className="text-gray-400">Мин: 50 000 UZS</p>
                      <p className="text-gray-400">Макс: 3 000 000 UZS</p>
                    </TooltipContent>
                  </Tooltip>
                  <td className="p-0.5 border-r border-black text-right">
                    <FormField control={form.control} name="totalFeeAmount" render={({ field }) => (
                      <span className="text-[10px] font-medium">{typeof field.value === 'number' && field.value > 0 ? Math.round(field.value).toLocaleString('ru-RU') : '-'}</span>
                    )} />
                  </td>
                  <td className="p-0.5 border-r border-black text-center">
                    <FormField control={form.control} name="feePaymentMethod" render={({ field }) => (
                      <ModalSelect
                        value={field.value || 'БН'}
                        onChange={field.onChange}
                        options={[
                          { value: 'БН', label: 'БН', description: 'Безналичный расчёт' },
                          { value: 'КТ', label: 'КТ', description: 'Наличными' },
                          { value: 'УН', label: 'УН', description: 'Условное начисление' },
                          { value: 'ОП', label: 'ОП', description: 'Отсрочка' },
                          { value: 'РП', label: 'РП', description: 'Рассрочка' },
                          { value: 'ВЗ', label: 'ВЗ', description: 'Взаимозачёт НДС' },
                          { value: 'ОО', label: 'ОО', description: 'Платёж не производится' },
                        ]}
                        placeholder="СП"
                        dialogTitle="Способ платежа (сбор)"
                        className="text-[10px]"
                      />
                    )} />
                  </td>
                </tr>
                {/* Строка 2: Таможенная пошлина (код 20) */}
                <tr className="border-b border-black">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="p-0.5 border-r border-black text-center font-medium cursor-help">20</td>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-[9px]">
                      <p className="font-bold">Таможенная пошлина</p>
                      <p className="text-blue-400">{declarationType === 'Временный вывоз' ? 'Условное начисление (УН)' : declarationType === 'Импорт' ? 'По ставке ТН ВЭД' : 'При экспорте обычно 0%'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <td className="p-0.5 border-r border-black">
                    <FormField control={form.control} name="dutyBase" render={({ field }) => (
                      <span className="text-[10px]">{field.value || '-'}</span>
                    )} />
                  </td>
                  <td className="p-0.5 border-r border-black text-center">
                    <span className="text-[9px]">
                      {declarationType === 'Экспорт' || declarationType === 'Реэкспорт' || declarationType === 'Временный вывоз'
                        ? '0%' 
                        : (watchedItems && watchedItems[0]?.dutyRate ? `${watchedItems[0].dutyRate}%` : '0%')}
                    </span>
                  </td>
                  <td className="p-0.5 border-r border-black text-right">
                    <FormField control={form.control} name="totalDutyAmount" render={({ field }) => (
                      <span className="text-[10px] font-medium">{typeof field.value === 'number' && field.value > 0 ? Math.round(field.value).toLocaleString('ru-RU') : '-'}</span>
                    )} />
                  </td>
                  <td className="p-0.5 border-r border-black text-center">
                    <FormField control={form.control} name="dutyPaymentMethod" render={({ field }) => (
                      <ModalSelect
                        value={field.value || (declarationType === 'Временный вывоз' ? 'УН' : (declarationType === 'Экспорт' || declarationType === 'Реэкспорт') ? 'ОО' : 'БН')}
                        onChange={field.onChange}
                        options={[
                          { value: 'БН', label: 'БН', description: 'Безналичный расчёт' },
                          { value: 'КТ', label: 'КТ', description: 'Наличными' },
                          { value: 'УН', label: 'УН', description: 'Условное начисление' },
                          { value: 'ОП', label: 'ОП', description: 'Отсрочка' },
                          { value: 'РП', label: 'РП', description: 'Рассрочка' },
                          { value: 'ВЗ', label: 'ВЗ', description: 'Взаимозачёт НДС' },
                          { value: 'ОО', label: 'ОО', description: 'Платёж не производится' },
                        ]}
                        placeholder="СП"
                        dialogTitle="Способ платежа (пошлина)"
                        className="text-[10px]"
                      />
                    )} />
                  </td>
                </tr>
                {/* Строка 3: НДС (код 29) */}
                <tr className="border-b border-black">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td className="p-0.5 border-r border-black text-center font-medium cursor-help">29</td>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-[9px]">
                      <p className="font-bold">НДС</p>
                      <p className="text-gray-400">База: ТС + пошлина</p>
                      <p className="text-blue-400">{declarationType === 'Временный вывоз' ? 'Условное начисление (УН)' : declarationType === 'Импорт' ? 'Ставка 12%' : 'Экспорт: 0% (освобождение)'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <td className="p-0.5 border-r border-black">
                    <span className="text-[9px] text-gray-500">ТС + пошлина</span>
                  </td>
                  <td className="p-0.5 border-r border-black text-center">
                    <span className="text-[9px]">{(declarationType === 'Экспорт' || declarationType === 'Реэкспорт' || declarationType === 'Временный вывоз') ? '0%' : '12%'}</span>
                  </td>
                  <td className="p-0.5 border-r border-black text-right">
                    <FormField control={form.control} name="totalVatAmount" render={({ field }) => (
                      <span className="text-[10px] font-medium">{typeof field.value === 'number' && field.value > 0 ? Math.round(field.value).toLocaleString('ru-RU') : '-'}</span>
                    )} />
                  </td>
                  <td className="p-0.5 border-r border-black text-center">
                    <FormField control={form.control} name="vatPaymentMethod" render={({ field }) => (
                      <ModalSelect
                        value={field.value || (declarationType === 'Временный вывоз' ? 'УН' : (declarationType === 'Экспорт' || declarationType === 'Реэкспорт') ? 'ВЗ' : 'БН')}
                        onChange={field.onChange}
                        options={[
                          { value: 'БН', label: 'БН', description: 'Безналичный расчёт' },
                          { value: 'КТ', label: 'КТ', description: 'Наличными' },
                          { value: 'УН', label: 'УН', description: 'Условное начисление' },
                          { value: 'ОП', label: 'ОП', description: 'Отсрочка' },
                          { value: 'РП', label: 'РП', description: 'Рассрочка' },
                          { value: 'ВЗ', label: 'ВЗ', description: 'Взаимозачёт НДС' },
                          { value: 'ОО', label: 'ОО', description: 'Платёж не производится' },
                        ]}
                        placeholder="СП"
                        dialogTitle="Способ платежа (НДС)"
                        className="text-[10px]"
                      />
                    )} />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="text-right p-0.5 font-bold border-r border-black">Всего:</td>
                  <td colSpan={2} className="p-0.5 text-right font-bold">
                    {(() => {
                      const fee = parseFloat(String(form.watch('totalFeeAmount'))) || 0;
                      const duty = parseFloat(String(form.watch('totalDutyAmount'))) || 0;
                      const vat = parseFloat(String(form.watch('totalVatAmount'))) || 0;
                      const total = fee + duty + vat;
                      return total > 0 ? Math.round(total).toLocaleString('ru-RU') : '-';
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блок B */}
        <div className={cn(cell, 'col-span-6 border-r-0 border-b-0')}>
          <div className={cellHeader}>В. Подробности подсчета</div>
          <div className={cellContent}>
            {/* Таблица подсчета по видам платежей */}
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="border-b border-black">
                  <td className="p-0.5 border-r border-black w-8 text-center">10</td>
                  <td className="p-0.5 text-right">
                    <FormField control={form.control} name="totalFeeAmount" render={({ field }) => (
                      <span>{typeof field.value === 'number' && field.value > 0 ? `${Math.round(field.value).toLocaleString('ru-RU')} сум.` : '-'}</span>
                    )} />
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-0.5 border-r border-black w-8 text-center">20</td>
                  <td className="p-0.5 text-right">
                    <FormField control={form.control} name="totalDutyAmount" render={({ field }) => (
                      <span>{typeof field.value === 'number' && field.value > 0 ? `${Math.round(field.value).toLocaleString('ru-RU')} сум.` : '-'}</span>
                    )} />
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-0.5 border-r border-black w-8 text-center">29</td>
                  <td className="p-0.5 text-right">
                    <FormField control={form.control} name="totalVatAmount" render={({ field }) => (
                      <span>{typeof field.value === 'number' && field.value > 0 ? `${Math.round(field.value).toLocaleString('ru-RU')} сум.` : '-'}</span>
                    )} />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="text-right p-0.5 font-bold">
                    <span>Всего: </span>
                    <FormField control={form.control} name="calcTotal" render={({ field }) => (
                      <span className="font-bold">{field.value || '-'}</span>
                    )} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ 50 + C ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ КОЛОНКА: Блок 50 */}
        <div className={cn(cell, 'col-span-6 border-l-0 border-b-0')}>
          <GraphHeader graphNumber="50" label="50. Доверитель" className="flex items-center justify-between">
            <div className="flex gap-0.5">
              <Button type="button" variant="ghost" size="sm" className="h-3 text-[6px] px-1 bg-blue-50" onClick={() => {
                form.setValue('principalInfo', `Ответственность за представленные документы и сведения несёт\n${form.getValues('exporterName') || 'ФИО, должность'}, тел: ${form.getValues('exporterPhone') || '+998__'}`);
                form.setValue('principalTin', form.getValues('exporterTin') || '');
              }} title="Скопировать из гр.2 (Экспортер)">
                ←Гр.2
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-3 text-[6px] px-1 bg-blue-50" onClick={() => {
                form.setValue('principalInfo', `Ответственность за представленные документы и сведения несёт\n${form.getValues('declarantName') || 'ФИО, должность'}, тел: ${form.getValues('declarantPhone') || '+998__'}`);
                form.setValue('principalTin', form.getValues('declarantTin') || '');
              }} title="Скопировать из гр.14 (Декларант)">
                ←Гр.14
              </Button>
            </div>
          </GraphHeader>
          <div className={cellContent}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <FormField control={form.control} name="principalInfo" render={({ field }) => (
                    <Textarea 
                      className={cn(textareaBase, 'min-h-[40px] text-[9px]')} 
                      placeholder="Ответственность за представленные документы и сведения несёт&#10;ФИО, должность, телефон" 
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] max-w-[250px]">
                <p className="font-bold">Лицо, ответственное за документы</p>
                <p className="text-gray-400">ФИО, должность, телефон</p>
                <p className="text-gray-400 mt-1">Если по доверенности:</p>
                <p className="text-gray-400">+ номер, дата и срок доверенности</p>
              </TooltipContent>
            </Tooltip>
            <div className="mt-1 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[9px] text-gray-500 cursor-help">ПИНФЛ/ИНН:</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">
                  <p>14 цифр (ПИНФЛ) или 9 цифр (ИНН)</p>
                  <p className="text-gray-400">Нерезидент без ИНН: 99999999999999</p>
                </TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="principalTin" render={({ field }) => (
                <Input 
                  className={cn(inputBase, 'w-36 h-4 font-mono text-[9px]')} 
                  placeholder="ПИНФЛ/ИНН" 
                  maxLength={14}
                  {...field} 
                  value={field.value ?? ''} 
                />
              )} />
            </div>
            {/* Для Временного вывоза: обязательство с датой обратного ввоза */}
            {declarationType === 'Временный вывоз' && (
              <div className="mt-1.5 border-t border-dashed border-orange-300 pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[8px] text-orange-600 font-medium mb-0.5 cursor-help">⭐ Обязательство обратного ввоза:</div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[9px] max-w-[260px]">
                    <p className="font-bold">Обязательное поле для временного вывоза</p>
                    <p className="text-gray-400 mt-1">Указать срок, до которого товары должны быть ввезены обратно или переведены в иной таможенный режим</p>
                  </TooltipContent>
                </Tooltip>
                <FormField control={form.control} name="returnObligationText" render={({ field }) => (
                  <Textarea 
                    className={cn(textareaBase, 'min-h-[28px] text-[8px] border-orange-300 bg-orange-50')} 
                    placeholder="Обязуюсь ввезти товары обратно либо перевести в иной таможенный режим до «__» «____» 20__." 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                )} />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] text-orange-600">Срок до:</span>
                  <FormField control={form.control} name="returnDate" render={({ field }) => (
                    <Input 
                      className={cn(inputBase, 'w-24 h-4 font-mono text-[8px] border-orange-300 bg-orange-50')} 
                      placeholder="ДД.ММ.ГГГГ" 
                      maxLength={10}
                      {...field} 
                      value={field.value ?? ''} 
                    />
                  )} />
                  <Button type="button" variant="ghost" size="sm" className="h-3 text-[6px] px-1 bg-orange-100" onClick={() => {
                    const returnDateVal = form.getValues('returnDate') || '';
                    const text = `Обязуюсь ввезти товары обратно либо перевести в иной таможенный режим до ${returnDateVal || '«__» «____» 20__'}.`;
                    form.setValue('returnObligationText', text);
                  }} title="Сгенерировать текст обязательства">
                    Авто
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блок C */}
        <div className={cn(cell, 'col-span-6 border-r-0 border-b-0')}>
          <div className={cn(cellHeader, 'flex items-center justify-between')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">С.</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] max-w-[220px]">
                <p className="font-bold">Графа «С»</p>
                <p className="text-gray-400">1 — ID внешнеторгового контракта в ЕЭИС ВТО</p>
                {declarationType === 'Реэкспорт' && (
                  <p className="text-orange-500 mt-1">2 — Дата рег. предшествующей ГТД (обязательно)</p>
                )}
                {declarationType === 'Временный вывоз' && (
                  <p className="text-orange-500 mt-1">Заполняется по правилам экспорта</p>
                )}
                {declarationType === 'Импорт' && (
                  <p className="text-blue-500 mt-1">2 — Дата ввоза товаров на территорию РУз</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={cellContent}>
            <div className="flex gap-1 mb-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] cursor-help">1.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">
                  <p className="font-bold">ID контракта в ЕЭИС ВТО</p>
                  <p className="text-gray-400">Уникальный идентификатор</p>
                  {declarationType === 'Реэкспорт' && (
                    <p className="text-gray-400 mt-1">Не заполняется, если вывоз не связан с контрактом</p>
                  )}
                </TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="cField1" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5 font-mono text-[9px]')} placeholder="ID контракта ЕЭИС ВТО" {...field} value={field.value ?? ''} />
              )} />
            </div>
            {/* Поле 2 — только для Реэкспорта (дата ГТД), Импорта (дата ввоза) */}
            {(declarationType === 'Реэкспорт' || declarationType === 'Импорт') && (
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[10px] cursor-help">2.</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[9px] max-w-[220px]">
                    {declarationType === 'Реэкспорт' ? (
                      <>
                        <p className="font-bold text-orange-500">⭐ Дата рег. предшествующей ГТД</p>
                        <p className="text-gray-400">Дата ГТД при оформлении в режим:</p>
                        <p className="text-gray-400">40 — импорт, 51 — переработка</p>
                        <p className="text-gray-400">Или дата ГТД другого режима</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-blue-500">Дата ввоза товаров в РУз</p>
                        <p className="text-gray-400">По штампу на товаросопроводительных документах</p>
                        <p className="text-gray-400">Или по дате оформления ККДГ/МДП</p>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
                <FormField control={form.control} name="cField2" render={({ field }) => (
                  <Input 
                    className={cn(
                      inputBase, 
                      'flex-1 h-5 font-mono text-[9px]',
                      declarationType === 'Реэкспорт' && 'border-orange-300 bg-orange-50',
                      declarationType === 'Импорт' && 'border-blue-300 bg-blue-50'
                    )} 
                    placeholder={declarationType === 'Реэкспорт' ? 'ДД.ММ.ГГГГ (дата предш. ГТД)' : 'ДД.ММ.ГГГГ (дата ввоза в РУз)'} 
                    maxLength={10}
                    {...field} 
                    value={field.value ?? ''} 
                  />
                )} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== БЛОКИ D + 54 ========== */}
      <div className="grid grid-cols-12 border-x border-b border-black">
        {/* ЛЕВАЯ КОЛОНКА: Блок D */}
        <div className={cn(cell, 'col-span-6 border-l-0 border-b-0')}>
          <div className={cellHeader}>Д. Таможенный контроль</div>
          <div className={cn(cellContent, 'min-h-[80px]')}>
            <FormField control={form.control} name="customsControlNotes" render={({ field }) => (
              <Textarea className={cn(textareaBase, 'min-h-[70px]')} placeholder="(заполняется инспектором)" {...field} value={field.value ?? ''} />
            )} />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Блок 54 */}
        <div className={cn(cell, 'col-span-6 border-r-0 border-b-0')}>
          <GraphHeader graphNumber="54" label="54. Место и дата:" className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" className="h-3 text-[6px] px-1 bg-blue-50" onClick={() => {
              form.setValue('signatoryName', form.getValues('declarantName') || '');
              form.setValue('signatoryPhone', form.getValues('declarantPhone') || '');
              const pinfl = form.getValues('principalTin') || form.getValues('declarantTin') || '';
              const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
              form.setValue('signatureNumber', `${pinfl}/${today}/`);
            }} title="Автозаполнить из Гр.14 и Гр.50">
              Авто
            </Button>
          </GraphHeader>
          <div className={cellContent}>
            {/* 1 — место заполнения */}
            <div className="flex gap-1 mb-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] w-3 cursor-help">1.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">Место заполнения ГТД</TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="declarationPlace" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5')} placeholder="г. Ташкент" {...field} value={field.value ?? ''} />
              )} />
            </div>
            {/* 2 — ФИО декларирующего лица, email */}
            <div className="flex gap-1 mb-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] w-3 cursor-help">2.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">ФИО декларирующего лица, email</TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="signatoryName" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5')} placeholder="Исмоилов О.М., email@domain.uz" {...field} value={field.value ?? ''} />
              )} />
            </div>
            {/* 3 — номер телефона */}
            <div className="flex gap-1 mb-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] w-3 cursor-help">3.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">Номер телефона</TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="signatoryPhone" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5')} placeholder="+998901234567" {...field} value={field.value ?? ''} />
              )} />
            </div>
            {/* 4 — номер и дата договора с брокером */}
            <div className="flex gap-1 mb-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] w-3 cursor-help">4.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">
                  <p>Договор с таможенным брокером</p>
                  <p className="text-gray-400">Если применимо: № и дата</p>
                </TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="declarationDate" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5')} placeholder="Договор № ___ от ___" {...field} value={field.value ?? ''} />
              )} />
            </div>
            {/* 5 — номер ГТД: ПИНФЛ/ДД.ММ.ГГГГ/НОМЕР */}
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] w-3 cursor-help">5.</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px] max-w-[200px]">
                  <p className="font-bold">Номер ГТД</p>
                  <p className="text-gray-400">Формат: ПИНФЛ/ДД.ММ.ГГГГ/НОМЕР</p>
                  <p className="text-gray-400">ПИНФЛ — 14 цифр</p>
                  <p className="text-gray-400">НОМЕР — порядковый в году</p>
                  <p className="text-red-400 mt-1">Не должен повторяться!</p>
                </TooltipContent>
              </Tooltip>
              <FormField control={form.control} name="signatureNumber" render={({ field }) => (
                <Input className={cn(inputBase, 'flex-1 h-5 font-mono text-[9px]')} placeholder="50411016180063/06.02.2026/000001" {...field} value={field.value ?? ''} />
              )} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
