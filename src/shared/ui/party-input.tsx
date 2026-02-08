'use client';

import * as React from 'react';
import { Copy, User, Building2, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CountrySelect } from './country-select';
import { ModalSelect } from './modal-select';

// Типы лиц
const PERSON_TYPES = [
  { code: 'legal', name: 'Юридическое лицо', icon: Building2 },
  { code: 'individual', name: 'Физическое лицо', icon: User },
  { code: 'ip', name: 'Индивидуальный предприниматель', icon: User },
] as const;

// Коды резидентства
const RESIDENCY_CODES = [
  { code: 'R', name: 'Резидент РУз' },
  { code: 'N', name: 'Нерезидент' },
] as const;

export interface PartyData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  tin: string;
  okpo: string;
  phone: string;
  countryCode: string;
  personType: string;
  residency: string;
}

interface PartyInputProps {
  value: PartyData;
  onChange: (data: PartyData) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  compact?: boolean;
  showCopyButtons?: boolean;
  copyFromLabel?: string;
  onCopyFrom?: () => void;
  copyFrom2Label?: string;
  onCopyFrom2?: () => void;
}

// Валидация ИНН Узбекистана
function validateTIN(tin: string): { valid: boolean; message: string } {
  if (!tin) return { valid: true, message: '' };
  
  // Убираем пробелы
  const cleanTin = tin.replace(/\s/g, '');
  
  // Проверка формата: 9 цифр для юрлиц, 14 для физлиц (ПИНФЛ)
  if (!/^\d+$/.test(cleanTin)) {
    return { valid: false, message: 'ИНН должен содержать только цифры' };
  }
  
  if (cleanTin.length === 9) {
    // ИНН юридического лица (9 цифр)
    return { valid: true, message: 'ИНН юрлица' };
  } else if (cleanTin.length === 14) {
    // ПИНФЛ физического лица (14 цифр)
    return { valid: true, message: 'ПИНФЛ физлица' };
  } else if (cleanTin.length < 9) {
    return { valid: false, message: `Введено ${cleanTin.length} из 9 цифр` };
  } else {
    return { valid: false, message: 'ИНН: 9 цифр (юрлицо) или 14 цифр (физлицо)' };
  }
}

// Форматирование ИНН для отображения
function formatTIN(tin: string): string {
  const clean = tin.replace(/\s/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  // ПИНФЛ: XX XXXXXXX XXXXX
  return `${clean.slice(0, 2)} ${clean.slice(2, 9)} ${clean.slice(9)}`;
}

export function PartyInput({
  value,
  onChange,
  label,
  placeholder = 'Введите данные',
  disabled = false,
  className,
  error,
  compact = true,
  showCopyButtons = false,
  copyFromLabel,
  onCopyFrom,
  copyFrom2Label,
  onCopyFrom2,
}: PartyInputProps) {
  const [expanded, setExpanded] = React.useState(!compact);
  const tinValidation = validateTIN(value.tin);
  
  const updateField = (field: keyof PartyData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };
  
  // Определяем иконку типа лица
  const PersonIcon = PERSON_TYPES.find(p => p.code === value.personType)?.icon || Building2;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Заголовок с кнопками */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <PersonIcon className="h-3 w-3 text-gray-500" />
          <span className="text-[10px] font-medium text-gray-700">{label}</span>
          {value.residency && (
            <span className={cn(
              'text-[8px] px-1 rounded',
              value.residency === 'R' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            )}>
              {value.residency === 'R' ? 'Резидент' : 'Нерезидент'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {showCopyButtons && onCopyFrom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 text-[7px] px-1"
              onClick={onCopyFrom}
              disabled={disabled}
            >
              <Copy className="h-2 w-2 mr-0.5" />
              {copyFromLabel || 'Копировать'}
            </Button>
          )}
          {showCopyButtons && onCopyFrom2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 text-[7px] px-1"
              onClick={onCopyFrom2}
              disabled={disabled}
            >
              <Copy className="h-2 w-2 mr-0.5" />
              {copyFrom2Label || 'Копировать 2'}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Основные поля (всегда видны) */}
      <div className="space-y-1">
        {/* Наименование */}
        <Input
          className={cn(
            'h-6 text-[10px] px-1',
            error && 'border-red-500'
          )}
          placeholder="Наименование организации / ФИО"
          value={value.name}
          onChange={(e) => updateField('name', e.target.value)}
          disabled={disabled}
        />
        
        {/* ИНН и Страна - компактный ряд */}
        <div className="flex items-center gap-1">
          <div className="flex-1 relative">
            <Input
              className={cn(
                'h-5 text-[10px] px-1 pr-16 font-mono',
                !tinValidation.valid && value.tin && 'border-orange-400 bg-orange-50'
              )}
              placeholder="ИНН / ПИНФЛ"
              value={value.tin}
              onChange={(e) => updateField('tin', e.target.value.replace(/[^\d]/g, '').slice(0, 14))}
              disabled={disabled}
            />
            {value.tin && (
              <span className={cn(
                'absolute right-1 top-1/2 -translate-y-1/2 text-[7px]',
                tinValidation.valid ? 'text-green-600' : 'text-orange-600'
              )}>
                {tinValidation.message}
              </span>
            )}
          </div>
          <div className="w-12">
            <CountrySelect
              value={value.countryCode}
              onChange={(code) => updateField('countryCode', code)}
              placeholder="..."
              compact
              className="h-5 text-[10px]"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Расширенные поля */}
      {expanded && (
        <div className="space-y-1 pt-1 border-t border-gray-200">
          {/* Тип лица и резидентство */}
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <ModalSelect
                value={value.personType}
                onChange={(val) => updateField('personType', val)}
                options={PERSON_TYPES.map(p => ({ value: p.code, label: p.name }))}
                placeholder="Тип лица"
                dialogTitle="Выберите тип лица"
                className="text-[9px]"
                disabled={disabled}
              />
            </div>
            <div className="w-24">
              <ModalSelect
                value={value.residency}
                onChange={(val) => updateField('residency', val)}
                options={RESIDENCY_CODES.map(r => ({ value: r.code, label: r.name }))}
                placeholder="Резидентство"
                dialogTitle="Резидентство"
                className="text-[9px]"
                disabled={disabled}
              />
            </div>
          </div>
          
          {/* Адрес */}
          <Input
            className="h-5 text-[10px] px-1"
            placeholder="Адрес (улица, дом, офис)"
            value={value.address}
            onChange={(e) => updateField('address', e.target.value)}
            disabled={disabled}
          />
          
          {/* Город и индекс */}
          <div className="flex items-center gap-1">
            <Input
              className="flex-1 h-5 text-[10px] px-1"
              placeholder="Город"
              value={value.city}
              onChange={(e) => updateField('city', e.target.value)}
              disabled={disabled}
            />
            <Input
              className="w-16 h-5 text-[10px] px-1"
              placeholder="Индекс"
              value={value.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              disabled={disabled}
            />
          </div>
          
          {/* ОКПО и телефон */}
          <div className="flex items-center gap-1">
            <Input
              className="w-20 h-5 text-[10px] px-1 font-mono"
              placeholder="ОКПО"
              value={value.okpo}
              onChange={(e) => updateField('okpo', e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
              disabled={disabled}
            />
            <Input
              className="flex-1 h-5 text-[10px] px-1"
              placeholder="Телефон"
              value={value.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Хелпер для создания пустого объекта PartyData
export function createEmptyPartyData(): PartyData {
  return {
    name: '',
    address: '',
    city: '',
    postalCode: '',
    tin: '',
    okpo: '',
    phone: '',
    countryCode: '',
    personType: 'legal',
    residency: 'R',
  };
}

// Хелпер для копирования данных контрагента
export function copyPartyData(source: PartyData): PartyData {
  return { ...source };
}

// Хелпер для конвертации в строку (для совместимости с существующими полями)
export function partyDataToString(data: PartyData): string {
  const parts = [data.name];
  if (data.address) parts.push(data.address);
  if (data.city) parts.push(data.city);
  if (data.postalCode) parts.push(data.postalCode);
  if (data.countryCode) parts.push(data.countryCode);
  return parts.filter(Boolean).join(', ');
}

// Хелпер для парсинга строки в PartyData (для миграции существующих данных)
export function stringToPartyData(str: string, tin?: string, countryCode?: string): PartyData {
  const data = createEmptyPartyData();
  if (str) {
    // Пытаемся распарсить строку
    const parts = str.split(',').map(s => s.trim());
    data.name = parts[0] || '';
    if (parts.length > 1) data.address = parts.slice(1).join(', ');
  }
  if (tin) data.tin = tin;
  if (countryCode) data.countryCode = countryCode;
  return data;
}
