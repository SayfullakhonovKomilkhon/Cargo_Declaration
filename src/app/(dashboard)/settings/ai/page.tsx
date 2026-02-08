'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ModalSelect } from '@/shared/ui/modal-select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AISettings {
  autoProcessDocuments: boolean;
  minConfidenceForAutofill: number;
  allowedAutofillFields: string[] | null;
  documentLanguage: string;
  showAISuggestions: boolean;
  showConfidenceIndicators: boolean;
}

const AUTOFILL_FIELDS = [
  { name: 'exporterName', label: 'Наименование экспортера' },
  { name: 'exporterAddress', label: 'Адрес экспортера' },
  { name: 'exporterCountry', label: 'Страна экспортера' },
  { name: 'consigneeName', label: 'Наименование грузополучателя' },
  { name: 'consigneeAddress', label: 'Адрес грузополучателя' },
  { name: 'consigneeTin', label: 'ИНН грузополучателя' },
  { name: 'consigneeCountry', label: 'Страна грузополучателя' },
  { name: 'totalCustomsValue', label: 'Таможенная стоимость' },
  { name: 'currency', label: 'Валюта' },
  { name: 'incoterms', label: 'Условия поставки' },
  { name: 'originCountry', label: 'Страна происхождения' },
  { name: 'dispatchCountry', label: 'Страна отправления' },
  { name: 'containerNumbers', label: 'Номера контейнеров' },
  { name: 'referenceNumber', label: 'Справочный номер' },
];

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    autoProcessDocuments: false,
    minConfidenceForAutofill: 0.7,
    allowedAutofillFields: null,
    documentLanguage: 'ru',
    showAISuggestions: true,
    showConfidenceIndicators: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/user/ai-settings');
        const data = await response.json();

        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.allowedAutofillFields) {
            setSelectedFields(new Set(data.settings.allowedAutofillFields));
          } else {
            // All fields allowed by default
            setSelectedFields(new Set(AUTOFILL_FIELDS.map((f) => f.name)));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Ошибка загрузки настроек');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          allowedAutofillFields:
            selectedFields.size === AUTOFILL_FIELDS.length
              ? null // All fields = null (no restrictions)
              : Array.from(selectedFields),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ошибка сохранения настроек'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle field selection
  const toggleField = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  // Select/deselect all fields
  const toggleAllFields = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedFields(new Set(AUTOFILL_FIELDS.map((f) => f.name)));
    } else {
      setSelectedFields(new Set());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Настройки AI</h1>
            <p className="text-gray-500">
              Управление автоматической обработкой документов
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Общие настройки</CardTitle>
            <CardDescription>
              Основные параметры работы AI ассистента
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto process */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоматическая обработка</Label>
                <p className="text-sm text-gray-500">
                  Обрабатывать документы сразу после загрузки
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoProcessDocuments}
                onChange={(e) =>
                  setSettings({ ...settings, autoProcessDocuments: e.target.checked })
                }
                className="h-5 w-5 rounded"
              />
            </div>

            {/* Document language */}
            <div className="space-y-2">
              <Label>Язык документов</Label>
              <ModalSelect
                value={settings.documentLanguage}
                onChange={(value) =>
                  setSettings({ ...settings, documentLanguage: value })
                }
                options={[
                  { value: 'ru', label: 'Русский' },
                  { value: 'en', label: 'English' },
                  { value: 'uz', label: "O'zbek" },
                ]}
                placeholder="Выберите язык"
                dialogTitle="Выберите язык документов"
              />
              <p className="text-sm text-gray-500">
                Основной язык загружаемых документов
              </p>
            </div>

            {/* Show AI suggestions */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Показывать AI подсказки</Label>
                <p className="text-sm text-gray-500">
                  Кнопки AI подсказок в полях формы
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showAISuggestions}
                onChange={(e) =>
                  setSettings({ ...settings, showAISuggestions: e.target.checked })
                }
                className="h-5 w-5 rounded"
              />
            </div>

            {/* Show confidence indicators */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Индикаторы уверенности</Label>
                <p className="text-sm text-gray-500">
                  Показывать процент уверенности AI
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showConfidenceIndicators}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    showConfidenceIndicators: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Confidence Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Настройки уверенности</CardTitle>
            <CardDescription>
              Минимальный порог для автозаполнения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Минимальная уверенность</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Поля с уверенностью ниже порога</p>
                      <p>не будут автоматически заполняться</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.minConfidenceForAutofill * 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minConfidenceForAutofill: Number(e.target.value) / 100,
                    })
                  }
                  className="flex-1"
                />
                <span className="w-16 text-right font-mono">
                  {Math.round(settings.minConfidenceForAutofill * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0% - Принимать все</span>
                <span>100% - Только точные</span>
              </div>
            </div>

            {/* Confidence levels explanation */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Уровни уверенности:</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>90%+ - Высокая уверенность</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>70-90% - Средняя уверенность</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>&lt;70% - Низкая уверенность</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowed Fields */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Поля для автозаполнения</CardTitle>
                <CardDescription>
                  Выберите какие поля AI может заполнять автоматически
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllFields(true)}
                >
                  Выбрать все
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllFields(false)}
                >
                  Снять все
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {AUTOFILL_FIELDS.map((field) => (
                <label
                  key={field.name}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFields.has(field.name)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.name)}
                    onChange={() => toggleField(field.name)}
                    className="rounded"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Выбрано {selectedFields.size} из {AUTOFILL_FIELDS.length} полей
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
