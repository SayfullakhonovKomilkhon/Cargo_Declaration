'use client';

import React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Building2, User, Users, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountrySelect, LocationSelect } from '@/shared/ui';
import { ModalSelect } from '@/shared/ui/modal-select';
import { DeclarationDraftFormData } from '../schemas/declaration-blocks-1-20.schema';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Константы для выбора
const SCENARIO_OPTIONS = [
  { value: 'same_person', label: 'Одно лицо', description: 'Экспортер и грузоотправитель — одно лицо', icon: User },
  { value: 'subdivision', label: 'Подразделение', description: 'Структурное подразделение юр. лица', icon: GitBranch },
  { value: 'different_persons', label: 'Разные лица', description: 'Экспортер и грузоотправитель — разные лица', icon: Users },
];

const PERSON_TYPE_OPTIONS = [
  { value: 'legal_entity', label: 'Юр. лицо', icon: Building2 },
  { value: 'individual', label: 'Физ. лицо', icon: User },
];

// Стили
const inputBase = 'h-6 text-[11px] px-1 py-0 border-gray-300';
const textareaBase = 'text-[10px] px-1 py-0.5 min-h-[30px] resize-none border-gray-300';
const labelClass = 'text-[9px] text-gray-500 font-medium';
const sectionClass = 'border border-gray-200 rounded p-1.5 bg-gray-50/50';

interface Graph2ExporterFormProps {
  form: UseFormReturn<DeclarationDraftFormData>;
  onCopyToGraph9?: () => void;
  onCopyToGraph14?: () => void;
  regimeHint?: string;
  className?: string;
  /** Если true — лицо иностранное (нет ОКПО/ИНН/Региона, есть Страна) */
  isForeign?: boolean;
}

/**
 * Компонент валидации ОКПО
 */
const OkpoValidationBadge = ({ okpo, personType }: { okpo: string; personType?: string }) => {
  if (!okpo) return null;
  
  const isIndividual = personType === 'individual';
  const isValidFormat = /^\d{8}$/.test(okpo);
  const isSpecialCode = okpo === '99999999' || okpo === '00000001';
  const isValid = isValidFormat || isSpecialCode;
  const isCorrectForType = isIndividual ? okpo === '00000001' : true;
  
  return (
    <span className={cn(
      'text-[7px] px-0.5 rounded',
      isValid && isCorrectForType ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    )}>
      {isValid && isCorrectForType ? '✓' : isIndividual ? '00000001' : '8 цифр'}
    </span>
  );
};

/**
 * Компонент валидации ИНН
 */
const TINValidationBadge = ({ tin }: { tin: string }) => {
  if (!tin) return null;
  
  const isINN = /^\d{9}$/.test(tin);
  const isPINFL = /^\d{14}$/.test(tin);
  const isNoINN = tin === '999999999';
  const isValid = isINN || isPINFL || isNoINN;
  
  return (
    <span className={cn(
      'text-[7px] px-0.5 rounded whitespace-nowrap',
      isValid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    )}>
      {isINN ? 'ИНН' : isPINFL ? 'ПИНФЛ' : isNoINN ? 'Без ИНН' : `${tin.length}/9`}
    </span>
  );
};

/**
 * Блок паспортных данных (для физ. лиц)
 */
const PassportDataBlock = ({ 
  form, 
  prefix 
}: { 
  form: UseFormReturn<DeclarationDraftFormData>;
  prefix: 'exporter' | 'sender';
}) => {
  const seriesField = `${prefix}PassportSeries` as keyof DeclarationDraftFormData;
  const numberField = `${prefix}PassportNumber` as keyof DeclarationDraftFormData;
  const dateField = `${prefix}PassportDate` as keyof DeclarationDraftFormData;
  const issuedByField = `${prefix}PassportIssuedBy` as keyof DeclarationDraftFormData;
  
  return (
    <div className="mt-1 p-1 bg-blue-50/50 border border-blue-100 rounded">
      <div className={cn(labelClass, 'text-blue-700 mb-0.5')}>Паспортные данные:</div>
      <div className="flex items-center gap-1">
        <FormField control={form.control} name={seriesField} render={({ field }) => (
          <Input 
            className={cn(inputBase, 'w-8 text-center font-mono')} 
            placeholder="AA"
            maxLength={2}
            {...field}
            value={(field.value as string) ?? ''}
            onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
          />
        )} />
        <FormField control={form.control} name={numberField} render={({ field }) => (
          <Input 
            className={cn(inputBase, 'w-20 font-mono')} 
            placeholder="1234567"
            maxLength={7}
            {...field}
            value={(field.value as string) ?? ''}
            onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
          />
        )} />
        <span className="text-[9px]">от</span>
        <FormField control={form.control} name={dateField} render={({ field }) => (
          <Input 
            type="date"
            className={cn(inputBase, 'w-28')} 
            {...field}
            value={(field.value as string) ?? ''}
          />
        )} />
      </div>
      <FormField control={form.control} name={issuedByField} render={({ field }) => (
        <Input 
          className={cn(inputBase, 'mt-0.5 w-full')} 
          placeholder="Кем выдан (ОВД г. Ташкента)"
          {...field}
          value={(field.value as string) ?? ''}
        />
      )} />
    </div>
  );
};

/**
 * Блок данных лица (экспортер / грузоотправитель / головная организация)
 */
const PersonDataBlock = ({ 
  form, 
  prefix,
  title,
  showOkpo = true,
  showPersonType = false,
  showPassport = false,
  isExporter = false,
  isForeign = false,
}: { 
  form: UseFormReturn<DeclarationDraftFormData>;
  prefix: 'exporter' | 'sender' | 'parentOrg';
  title: string;
  showOkpo?: boolean;
  showPersonType?: boolean;
  showPassport?: boolean;
  isExporter?: boolean;
  /** Лицо иностранное — скрыть ОКПО/ИНН/Регион */
  isForeign?: boolean;
}) => {
  const nameField = `${prefix}Name` as keyof DeclarationDraftFormData;
  const addressField = `${prefix}Address` as keyof DeclarationDraftFormData;
  const phoneField = `${prefix}Phone` as keyof DeclarationDraftFormData;
  const emailField = `${prefix}Email` as keyof DeclarationDraftFormData;
  const okpoField = prefix !== 'parentOrg' ? `${prefix}Okpo` as keyof DeclarationDraftFormData : null;
  const tinField = prefix !== 'parentOrg' ? `${prefix}Tin` as keyof DeclarationDraftFormData : null;
  const regionCodeField = prefix !== 'parentOrg' ? `${prefix}RegionCode` as keyof DeclarationDraftFormData : null;
  const personTypeField = prefix !== 'parentOrg' ? `${prefix}PersonType` as keyof DeclarationDraftFormData : null;
  
  const personType = useWatch({ control: form.control, name: personTypeField || 'exporterPersonType' });
  const isIndividual = personType === 'individual';
  
  return (
    <div className={sectionClass}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn(labelClass, 'text-gray-700')}>{title}</span>
        {showPersonType && personTypeField && (
          <FormField control={form.control} name={personTypeField} render={({ field }) => (
            <div className="flex gap-0.5">
              {PERSON_TYPE_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={field.value === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-5 px-1.5 text-[8px]',
                    field.value === opt.value && 'bg-primary text-white'
                  )}
                  onClick={() => {
                    field.onChange(opt.value);
                    // Автоматически установить ОКПО для физ. лиц
                    if (opt.value === 'individual' && okpoField) {
                      form.setValue(okpoField as any, '00000001');
                    }
                  }}
                >
                  <opt.icon className="h-2.5 w-2.5 mr-0.5" />
                  {opt.label}
                </Button>
              ))}
            </div>
          )} />
        )}
      </div>
      
      {/* Наименование */}
      <FormField control={form.control} name={nameField} render={({ field }) => (
        <Input 
          className={cn(inputBase, 'w-full mb-0.5')} 
          placeholder={isForeign 
            ? (isIndividual ? 'ФИО иностранного лица' : 'Наименование иностранной компании') 
            : (isIndividual ? 'ФИО (Иванов Иван Иванович)' : 'Наименование (ООО «Компания»)')
          }
          {...field}
          value={(field.value as string) ?? ''}
        />
      )} />
      
      {/* Адрес */}
      <FormField control={form.control} name={addressField} render={({ field }) => (
        <Textarea 
          className={cn(textareaBase, 'w-full mb-0.5')} 
          placeholder={isForeign
            ? 'Страна, город, адрес'
            : (isIndividual ? 'Адрес места жительства' : 'Юридический адрес')
          }
          {...field}
          value={(field.value as string) ?? ''}
        />
      )} />
      
      {/* Телефон + Email */}
      <div className="flex gap-1 mb-0.5">
        <FormField control={form.control} name={phoneField} render={({ field }) => (
          <Input 
            className={cn(inputBase, 'flex-1')} 
            placeholder={isForeign ? 'Телефон (международный)' : '+998 XX XXX XX XX'}
            {...field}
            value={(field.value as string) ?? ''}
          />
        )} />
        <FormField control={form.control} name={emailField} render={({ field }) => (
          <Input 
            type="email"
            className={cn(inputBase, 'flex-1')} 
            placeholder={isForeign ? 'email (при наличии)' : 'email@domain.uz'}
            {...field}
            value={(field.value as string) ?? ''}
          />
        )} />
      </div>
      
      {/* Страна — для иностранного лица (вместо ОКПО/ИНН) */}
      {isForeign && prefix !== 'parentOrg' && (
        <div className="flex items-center gap-1 pt-1 border-t border-gray-200">
          <span className="text-[8px] text-gray-500">Страна:</span>
          <FormField control={form.control} name="exporterCountry" render={({ field }) => (
            <CountrySelect 
              value={(field.value as string) || ''} 
              onChange={field.onChange} 
              placeholder="Выберите страну" 
              showFullName 
              className="flex-1 h-6 text-[10px]" 
            />
          )} />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[7px] text-gray-400 cursor-help">№</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>ИНН грузоотправителя (опционально)</p>
              <p className="text-gray-400">Для упрощённого коридора или УЭО</p>
            </TooltipContent>
          </Tooltip>
          <FormField control={form.control} name={tinField || 'exporterTin'} render={({ field }) => (
            <Input 
              className={cn(inputBase, 'w-28 font-mono text-[9px]')} 
              placeholder="ИНН (опционально)"
              {...field}
              value={(field.value as string) ?? ''}
            />
          )} />
        </div>
      )}
      
      {/* ОКПО + ИНН + Код региона (только для резидента — экспортера/отправителя) */}
      {!isForeign && showOkpo && okpoField && tinField && regionCodeField && (
        <div className="flex items-center gap-1 pt-1 border-t border-gray-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[8px] text-gray-500 cursor-help">ОКПО:</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>Код ОКПО (8 цифр)</p>
              <p>• Физ. лицо: 00000001</p>
              <p>• Без ОКПО: 99999999</p>
            </TooltipContent>
          </Tooltip>
          <FormField control={form.control} name={okpoField} render={({ field }) => (
            <div className="flex items-center">
              <Input 
                className={cn(inputBase, 'w-20 font-mono text-center')} 
                placeholder="12345678"
                maxLength={8}
                {...field}
                value={(field.value as string) ?? ''}
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
              />
              <OkpoValidationBadge okpo={(field.value as string) || ''} personType={personType as string} />
            </div>
          )} />
          
          <span className="text-[10px]">/</span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[8px] text-gray-500 cursor-help">ИНН:</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>ИНН (9 цифр) или ПИНФЛ (14 цифр)</p>
              <p>• Без ИНН: 999999999</p>
            </TooltipContent>
          </Tooltip>
          <FormField control={form.control} name={tinField} render={({ field }) => (
            <div className="flex items-center">
              <Input 
                className={cn(inputBase, 'w-28 font-mono')} 
                placeholder="123456789"
                maxLength={14}
                {...field}
                value={(field.value as string) ?? ''}
                onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 14))}
              />
              <TINValidationBadge tin={(field.value as string) || ''} />
            </div>
          )} />
          
          <span className="text-[10px]">/</span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[8px] text-gray-500 cursor-help">Рег.:</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>Код региона по Классификатору</p>
              <p>(Приложение 15)</p>
            </TooltipContent>
          </Tooltip>
          <FormField control={form.control} name={regionCodeField} render={({ field }) => (
            <LocationSelect 
              value={(field.value as string) || ''} 
              onChange={field.onChange} 
              placeholder="Регион" 
              showCode
              className="w-28 h-6 text-[10px]" 
            />
          )} />
        </div>
      )}
      
      {/* Паспортные данные (для физ. лиц) */}
      {showPassport && isIndividual && prefix !== 'parentOrg' && (
        <PassportDataBlock form={form} prefix={prefix as 'exporter' | 'sender'} />
      )}
    </div>
  );
};

/**
 * Основной компонент Графы 2 — Экспортер/Грузоотправитель
 */
export function Graph2ExporterForm({
  form,
  onCopyToGraph9,
  onCopyToGraph14,
  regimeHint,
  className,
  isForeign = false,
}: Graph2ExporterFormProps) {
  const scenario = useWatch({ control: form.control, name: 'graph2Scenario' });
  const exporterPersonType = useWatch({ control: form.control, name: 'exporterPersonType' });
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Заголовок с выбором сценария и кнопками копирования */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-gray-200">
        {/* Выбор сценария */}
        <FormField control={form.control} name="graph2Scenario" render={({ field }) => (
          <div className="flex gap-0.5">
            {SCENARIO_OPTIONS.map(opt => (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={field.value === opt.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-5 px-1.5 text-[8px]',
                      field.value === opt.value && 'bg-primary text-white'
                    )}
                    onClick={() => field.onChange(opt.value)}
                  >
                    <opt.icon className="h-2.5 w-2.5 mr-0.5" />
                    {opt.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">
                  {opt.description}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )} />
        
        {/* Кнопки копирования */}
        <div className="flex gap-0.5">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-5 text-[7px] px-1"
            onClick={onCopyToGraph9}
            title="Копировать в гр.9"
          >
            <Copy className="h-2.5 w-2.5 mr-0.5" />→9
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-5 text-[7px] px-1"
            onClick={onCopyToGraph14}
            title="Копировать в гр.14"
          >
            <Copy className="h-2.5 w-2.5 mr-0.5" />→14
          </Button>
        </div>
      </div>
      
      {/* Подсказка по режиму */}
      {regimeHint && (
        <div className="text-[8px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
          {regimeHint}
        </div>
      )}
      
      {/* Сценарий: same_person — Экспортер и отправитель одно лицо */}
      {scenario === 'same_person' && (
        <PersonDataBlock 
          form={form} 
          prefix="exporter" 
          title={isForeign ? "Экспортер / Грузоотправитель (иностранное лицо)" : "Экспортер / Грузоотправитель"}
          showPersonType
          showPassport={!isForeign}
          isExporter
          isForeign={isForeign}
        />
      )}
      
      {/* Сценарий: subdivision — Структурное подразделение */}
      {scenario === 'subdivision' && (
        <>
          <PersonDataBlock 
            form={form} 
            prefix="exporter" 
            title={isForeign ? "Структурное подразделение (иностранное)" : "Структурное подразделение"}
            showPersonType={false}
            showOkpo={!isForeign}
            isForeign={isForeign}
          />
          <div className="text-[8px] text-gray-500 text-center py-0.5">▼ филиал</div>
          <PersonDataBlock 
            form={form} 
            prefix="parentOrg" 
            title="Головная организация"
            showOkpo={false}
            isForeign={isForeign}
          />
        </>
      )}
      
      {/* Сценарий: different_persons — Разные лица */}
      {scenario === 'different_persons' && (
        <>
          {/* По поручению экспортера */}
          <div className="text-[9px] text-gray-600 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-200">
            по поручению:
          </div>
          <FormField control={form.control} name="exporterName" render={({ field }) => (
            <Input 
              className={cn(inputBase, 'w-full bg-yellow-50/50')} 
              placeholder="Наименование экспортера (по чьему поручению)"
              {...field}
              value={(field.value as string) ?? ''}
            />
          )} />
          
          {/* Грузоотправитель */}
          <PersonDataBlock 
            form={form} 
            prefix="sender" 
            title={isForeign ? "Грузоотправитель (иностранное лицо)" : "Грузоотправитель"}
            showPersonType
            showPassport={!isForeign}
            isForeign={isForeign}
          />
        </>
      )}
      
      {/* Правый верхний угол: ОКПО (только для резидентов, для same_person и different_persons) */}
      {!isForeign && scenario !== 'subdivision' && (
        <div className="flex items-center justify-end gap-1 pt-1 border-t border-dashed border-gray-300">
          <span className="text-[8px] text-gray-500">№</span>
          <FormField control={form.control} name="exporterOkpo" render={({ field }) => (
            <Input 
              className={cn(inputBase, 'w-20 font-mono text-center text-[10px]')} 
              placeholder="ОКПО"
              readOnly
              {...field}
              value={(field.value as string) ?? ''}
            />
          )} />
          {scenario === 'different_persons' && (
            <>
              <span className="text-[10px]">/</span>
              <FormField control={form.control} name="senderOkpo" render={({ field }) => (
                <Input 
                  className={cn(inputBase, 'w-20 font-mono text-center text-[10px]')} 
                  placeholder="ОКПО"
                  readOnly
                  {...field}
                  value={(field.value as string) ?? ''}
                />
              )} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Graph2ExporterForm;
