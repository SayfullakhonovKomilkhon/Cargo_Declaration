'use client';

import * as React from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Regex для валидации номера контейнера: 4 буквы + 7 цифр
const CONTAINER_NUMBER_REGEX = /^[A-Z]{4}\d{7}$/;

interface ContainerInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
  maxContainers?: number;
  error?: string;
}

export function ContainerInput({
  value = [],
  onChange,
  disabled = false,
  className,
  maxContainers = 10,
  error,
}: ContainerInputProps) {
  const [localErrors, setLocalErrors] = React.useState<Record<number, string>>({});

  // Валидация номера контейнера
  const validateContainerNumber = (number: string): string | null => {
    if (!number) return null;

    const upperNumber = number.toUpperCase().trim();

    if (upperNumber.length !== 11) {
      return 'Должно быть 11 символов';
    }

    if (!CONTAINER_NUMBER_REGEX.test(upperNumber)) {
      return 'Формат: 4 буквы + 7 цифр (ABCD1234567)';
    }

    return null;
  };

  // Обработка изменения номера контейнера
  const handleContainerChange = (index: number, newValue: string) => {
    const upperValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    const newContainers = [...value];
    newContainers[index] = upperValue;
    onChange(newContainers);

    // Валидация при вводе
    const error = validateContainerNumber(upperValue);
    setLocalErrors((prev) => ({
      ...prev,
      [index]: error || '',
    }));
  };

  // Добавление нового контейнера
  const handleAddContainer = () => {
    if (value.length < maxContainers) {
      onChange([...value, '']);
    }
  };

  // Удаление контейнера
  const handleRemoveContainer = (index: number) => {
    const newContainers = value.filter((_, i) => i !== index);
    onChange(newContainers);

    // Удаляем ошибку для этого индекса
    const newErrors = { ...localErrors };
    delete newErrors[index];
    // Перенумеровываем ошибки
    const reindexedErrors: Record<number, string> = {};
    Object.entries(newErrors).forEach(([key, val]) => {
      const keyNum = parseInt(key);
      if (keyNum > index) {
        reindexedErrors[keyNum - 1] = val;
      } else {
        reindexedErrors[keyNum] = val;
      }
    });
    setLocalErrors(reindexedErrors);
  };

  // Проверка корректности номера
  const isValidContainer = (number: string): boolean => {
    return CONTAINER_NUMBER_REGEX.test(number.toUpperCase().trim());
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Список контейнеров */}
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((containerNumber, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input
                    value={containerNumber}
                    onChange={(e) => handleContainerChange(index, e.target.value)}
                    placeholder="ABCD1234567"
                    disabled={disabled}
                    maxLength={11}
                    className={cn(
                      'font-mono uppercase pr-10',
                      localErrors[index] && 'border-destructive focus-visible:ring-destructive',
                      isValidContainer(containerNumber) && 'border-green-500'
                    )}
                  />
                  {/* Индикатор валидности */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {containerNumber.length === 11 &&
                      (isValidContainer(containerNumber) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ))}
                  </div>
                </div>
                {localErrors[index] && (
                  <p className="text-xs text-destructive">{localErrors[index]}</p>
                )}
              </div>

              {/* Кнопка удаления */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveContainer(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Удалить контейнер</span>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Контейнеры не добавлены
        </p>
      )}

      {/* Кнопка добавления */}
      {value.length < maxContainers && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddContainer}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить контейнер
        </Button>
      )}

      {/* Подсказка по формату */}
      <p className="text-xs text-muted-foreground">
        Формат номера: 4 буквы владельца + 7 цифр (например: MSKU1234567)
      </p>

      {/* Общая ошибка от формы */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Информация о количестве */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {value.filter((c) => isValidContainer(c)).length} из {value.length} контейнеров
          корректны
          {maxContainers && ` (макс. ${maxContainers})`}
        </p>
      )}
    </div>
  );
}
