'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Sparkles, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateDeclarationDialogProps {
  /** Кнопка-триггер (опционально, по умолчанию "Создать декларацию") */
  trigger?: React.ReactNode;
}

/**
 * Модальное окно выбора способа создания декларации
 * - Пустая форма — открыть чистую форму
 * - С помощью AI — загрузить документы для автозаполнения
 */
export function CreateDeclarationDialog({ trigger }: CreateDeclarationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelectOption = (option: 'blank' | 'ai') => {
    setOpen(false);
    if (option === 'blank') {
      router.push('/declarations/new?mode=blank');
    } else {
      router.push('/declarations/new?mode=ai');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Создать декларацию
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Создание декларации</DialogTitle>
          <DialogDescription>
            Выберите способ создания новой таможенной декларации
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Вариант 1: Пустая форма */}
          <button
            onClick={() => handleSelectOption('blank')}
            className="group flex items-start gap-4 rounded-lg border border-slate-200 p-4 text-left transition-all hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary dark:hover:bg-slate-800/50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-slate-800 dark:text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Пустая форма
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Заполните декларацию вручную с нуля
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>

          {/* Вариант 2: С помощью AI */}
          <button
            onClick={() => handleSelectOption('ai')}
            className="group flex items-start gap-4 rounded-lg border-2 border-primary/50 bg-primary/5 p-4 text-left transition-all hover:border-primary hover:bg-primary/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  С помощью AI
                </h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Рекомендуем
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Загрузите Invoice, CMR или контракт — AI автоматически извлечёт данные
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-medium">Совет:</span> Для лучшего результата загрузите минимум Invoice и CMR. 
            AI извлечёт данные о товарах, ценах, отправителе и получателе.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
