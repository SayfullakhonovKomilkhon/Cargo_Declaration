'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';

interface HSCodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
}

interface HSCodeAISuggesterProps {
  productDescription: string;
  onSelect: (code: string, description: string) => void;
  disabled?: boolean;
  className?: string;
}

export function HSCodeAISuggester({
  productDescription,
  onSelect,
  disabled,
  className,
}: HSCodeAISuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HSCodeSuggestion[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const handleRequestSuggestions = async () => {
    if (!productDescription || productDescription.length < 3) {
      toast.error('Введите описание товара (минимум 3 символа)');
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    setSuggestions([]);

    try {
      const response = await fetch('/api/ai/suggest-hs-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: productDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка получения рекомендаций');
      }

      setSuggestions(data.suggestedCodes || []);

      if (data.suggestedCodes?.length === 0) {
        toast.info('AI не смог определить код ТН ВЭД');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ошибка получения рекомендаций'
      );
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCode = (suggestion: HSCodeSuggestion) => {
    setSelectedCode(suggestion.code);
    onSelect(suggestion.code, suggestion.description);
    setIsOpen(false);
    toast.success(`Выбран код: ${suggestion.code}`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRequestSuggestions}
              disabled={disabled || !productDescription}
              className={cn('shrink-0', className)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI подсказка кода ТН ВЭД</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Рекомендации AI по коду ТН ВЭД
            </DialogTitle>
            <DialogDescription>
              На основе описания: &quot;{productDescription}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Анализируем описание товара...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>Не удалось определить код ТН ВЭД</p>
                <p className="text-sm">Попробуйте уточнить описание товара</p>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.code}
                  type="button"
                  onClick={() => handleSelectCode(suggestion)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all',
                    'hover:border-blue-300 hover:bg-blue-50',
                    selectedCode === suggestion.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg">
                          {suggestion.code}
                        </span>
                        <Badge className={getConfidenceColor(suggestion.confidence)}>
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary">Рекомендуется</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {suggestion.description}
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        {suggestion.reasoning}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {selectedCode === suggestion.code ? (
                        <Check className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-4">
              <Info className="h-4 w-4" />
              <p>
                Рекомендации AI носят информационный характер. Пожалуйста, 
                проверьте правильность кода перед использованием.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
