'use client';

import { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import {
  DOCUMENT_TYPE_LABELS,
  PROCESSING_STATUS_LABELS,
  PROCESSING_STATUS_COLORS,
  type DocumentWithRelations,
} from '@/features/documents/types';
import {
  mapAIDataToFormFields,
  groupFieldsBySource,
  type AutofillField,
  type AnyAIExtractedData,
} from '../utils/autofill-from-ai';
import type { AIExtractedData } from '@/server/services/anthropic.service';
import type { DeclarationDraftFormData } from '../schemas/declaration-blocks-1-20.schema';

// Хелпер для получения количества товаров
function getItemsCount(data: AnyAIExtractedData | null | undefined): number {
  return data?.items?.length || 0;
}

interface ProcessingResult {
  documentId: string;
  success: boolean;
  data?: AnyAIExtractedData;
  error?: string;
  confidence?: {
    value: number;
    level: 'high' | 'medium' | 'low';
    color: string;
    description: string;
  };
}

interface AIDocumentProcessorProps {
  documents: DocumentWithRelations[];
  currentFormData: Partial<DeclarationDraftFormData>;
  onApplyData: (data: Partial<DeclarationDraftFormData>) => void;
  onProcessingComplete?: () => void;
  className?: string;
}

export function AIDocumentProcessor({
  documents,
  currentFormData,
  onApplyData,
  onProcessingComplete,
  className,
}: AIDocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, ProcessingResult>>(new Map());
  const [previewData, setPreviewData] = useState<{
    documentId: string;
    fields: AutofillField[];
    extractedData: AnyAIExtractedData;
  } | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Обработка одного документа
  const processDocument = async (documentId: string): Promise<ProcessingResult> => {
    try {
      const response = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          documentId,
          success: false,
          error: data.error || 'Ошибка обработки',
        };
      }

      return {
        documentId,
        success: true,
        data: data.extractedData,
        confidence: data.confidence,
      };
    } catch (error) {
      return {
        documentId,
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  };

  // Обработка выбранного документа
  const handleProcessDocument = async (documentId: string) => {
    setProcessingDocId(documentId);
    setIsProcessing(true);

    const result = await processDocument(documentId);

    setResults((prev) => new Map(prev).set(documentId, result));
    setIsProcessing(false);
    setProcessingDocId(null);

    if (result.success) {
      toast.success('Документ обработан');
    } else {
      toast.error(result.error || 'Ошибка обработки документа');
    }
  };

  // Пакетная обработка всех документов
  const handleBatchProcess = async () => {
    const pendingDocs = documents.filter(
      (doc) => doc.processingStatus !== 'COMPLETED' && doc.processingStatus !== 'PROCESSING'
    );

    if (pendingDocs.length === 0) {
      toast.info('Все документы уже обработаны');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const response = await fetch('/api/documents/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: pendingDocs.map((d) => d.id) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка пакетной обработки');
      }

      // Обновляем результаты
      if (data.results?.details) {
        const newResults = new Map(results);
        for (const result of data.results.details) {
          newResults.set(result.documentId, result);
        }
        setResults(newResults);
      }

      toast.success(
        `Обработано ${data.results.successful} из ${data.results.total} документов`
      );

      onProcessingComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обработки');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  // Показать preview данных
  const handleShowPreview = (documentId: string) => {
    const result = results.get(documentId);
    const document = documents.find((d) => d.id === documentId);

    if (!result?.data || !document) return;

    const autofillResult = mapAIDataToFormFields(result.data, currentFormData);

    setPreviewData({
      documentId,
      fields: autofillResult.fields,
      extractedData: result.data,
    });

    // По умолчанию выбираем все поля
    setSelectedFields(new Set(autofillResult.fields.map((f) => f.fieldName)));
  };

  // Применить выбранные данные
  const handleApplySelected = () => {
    if (!previewData) return;

    const result = results.get(previewData.documentId);
    if (!result?.data) return;

    const autofillResult = mapAIDataToFormFields(result.data, currentFormData, {
      overwriteExisting: true, // Перезаписываем чтобы применить все выбранные
    });

    // Фильтруем только выбранные поля
    const selectedData: Partial<DeclarationDraftFormData> = {};
    for (const field of autofillResult.fields) {
      if (selectedFields.has(field.fieldName)) {
        // @ts-expect-error - dynamic assignment
        selectedData[field.fieldName] = field.value;
      }
    }

    // Добавляем товары если есть
    if (autofillResult.itemsData && autofillResult.itemsData.length > 0) {
      // @ts-expect-error - items will be handled by parent
      selectedData._itemsToAdd = autofillResult.itemsData;
    }

    // Добавляем расширенные данные товаров если есть
    if (autofillResult.unmappedData?.extendedItems) {
      // @ts-expect-error - extended items
      selectedData._extendedItems = autofillResult.unmappedData.extendedItems;
    }

    onApplyData(selectedData);
    setPreviewData(null);
    
    const itemsCount = getItemsCount(result.data);
    if (itemsCount > 0) {
      toast.success(`Применено ${selectedFields.size} полей и ${itemsCount} товаров`);
    } else {
      toast.success(`Применено ${selectedFields.size} полей`);
    }
  };

  // Получить confidence badge
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {Math.round(confidence * 100)}%
        </Badge>
      );
    }
    if (confidence >= 0.7) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {Math.round(confidence * 100)}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  const pendingCount = documents.filter((d) => d.processingStatus === 'PENDING').length;
  const completedCount = documents.filter((d) => d.processingStatus === 'COMPLETED').length;

  return (
    <Card className={cn('border-blue-200 bg-blue-50/30', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Ассистент</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>
            Автоматическое заполнение из документов
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Документов: <strong>{documents.length}</strong>
              </span>
              <span className="text-yellow-600">
                Ожидают: <strong>{pendingCount}</strong>
              </span>
              <span className="text-green-600">
                Обработано: <strong>{completedCount}</strong>
              </span>
            </div>

            {/* Batch process button */}
            {pendingCount > 0 && (
              <Button
                onClick={handleBatchProcess}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Обработать все документы ({pendingCount})
                  </>
                )}
              </Button>
            )}

            {/* Progress bar */}
            {isProcessing && processingProgress > 0 && (
              <Progress value={processingProgress} className="w-full" />
            )}

            {/* Document list */}
            <div className="space-y-2">
              {documents.map((doc) => {
                const result = results.get(doc.id);
                const isCurrentlyProcessing = processingDocId === doc.id;
                const hasData =
                  doc.processingStatus === 'COMPLETED' ||
                  (result?.success && result.data);

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status badge */}
                      <Badge
                        className={cn(
                          'text-xs',
                          result?.success
                            ? PROCESSING_STATUS_COLORS['COMPLETED']
                            : result?.error
                              ? PROCESSING_STATUS_COLORS['FAILED']
                              : PROCESSING_STATUS_COLORS[doc.processingStatus]
                        )}
                      >
                        {result?.success
                          ? 'Обработан'
                          : result?.error
                            ? 'Ошибка'
                            : PROCESSING_STATUS_LABELS[doc.processingStatus]}
                      </Badge>

                      {/* Confidence badge */}
                      {result?.confidence && getConfidenceBadge(result.confidence.value)}

                      {/* Actions */}
                      {doc.processingStatus === 'PENDING' && !result?.success && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessDocument(doc.id)}
                          disabled={isProcessing}
                        >
                          {isCurrentlyProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Обработать'
                          )}
                        </Button>
                      )}

                      {hasData && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleShowPreview(doc.id)}
                        >
                          Применить данные
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>Загрузите документы для AI обработки</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Preview Dialog - показывает ВСЕ извлечённые данные */}
      <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Все данные извлечённые ИИ из документа
            </DialogTitle>
            <DialogDescription>
              Выберите поля которые хотите применить к форме ГТД. Зелёным отмечены поля с высокой уверенностью.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              {/* Confidence indicator */}
              {previewData.extractedData.confidence && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Info className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Общая уверенность ИИ: <strong>{Math.round(previewData.extractedData.confidence * 100)}%</strong>
                  </span>
                  <span className="text-xs text-green-600 ml-2">
                    (Найдено {previewData.fields.length} полей)
                  </span>
                </div>
              )}

              {/* Все поля сгруппированные по графам */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previewData.fields.map((field) => (
                  <label
                    key={field.fieldName}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all',
                      selectedFields.has(field.fieldName)
                        ? 'bg-green-50 border-green-300 ring-1 ring-green-400'
                        : 'bg-white border-gray-200 hover:border-blue-300',
                      field.source.includes('не применено') && 'opacity-60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field.fieldName)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedFields);
                        if (e.target.checked) {
                          newSelected.add(field.fieldName);
                        } else {
                          newSelected.delete(field.fieldName);
                        }
                        setSelectedFields(newSelected);
                      }}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{field.label}</p>
                        {getConfidenceBadge(field.confidence)}
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words whitespace-pre-wrap">
                        {typeof field.value === 'object' 
                          ? JSON.stringify(field.value, null, 2)
                          : String(field.value)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Источник: {field.source}
                      </p>
                      {field.source.includes('не применено') && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠ Поле уже заполнено - будет перезаписано
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Items preview - подробно */}
              {getItemsCount(previewData.extractedData) > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      📦 Товарные позиции ({getItemsCount(previewData.extractedData)})
                    </h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      Будут добавлены автоматически
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {previewData.extractedData.items?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="font-medium text-sm">Товар #{idx + 1}</div>
                          {item.hsCode && (
                            <Badge variant="outline" className="text-xs">
                              ТН ВЭД: {item.hsCode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {item.description || 'Описание не указано'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                          {item.quantity && (
                            <span>Кол-во: {item.quantity}</span>
                          )}
                          {(item.price || ('itemPrice' in item && item.itemPrice)) && (
                            <span>Цена: {item.price || ('itemPrice' in item ? item.itemPrice : '')}</span>
                          )}
                          {(item.weight || ('grossWeight' in item && item.grossWeight)) && (
                            <span>Вес: {item.weight || ('grossWeight' in item ? item.grossWeight : '')} кг</span>
                          )}
                          {(item.origin || ('originCountryCode' in item && item.originCountryCode)) && (
                            <span>Происх.: {item.origin || ('originCountryCode' in item ? item.originCountryCode : '')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Итоговая статистика */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">
                    Выбрано полей: <strong>{selectedFields.size}</strong> из {previewData.fields.length}
                  </span>
                  {getItemsCount(previewData.extractedData) > 0 && (
                    <span className="text-blue-800">
                      + {getItemsCount(previewData.extractedData)} товаров
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setPreviewData(null)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (previewData) {
                  // Снять все
                  setSelectedFields(new Set());
                }
              }}
              variant="outline"
              size="sm"
            >
              Снять все
            </Button>
            <Button
              onClick={() => {
                if (previewData) {
                  // Выбрать все
                  setSelectedFields(
                    new Set(previewData.fields.map((f) => f.fieldName))
                  );
                }
              }}
              variant="outline"
            >
              Выбрать все
            </Button>
            <Button 
              onClick={handleApplySelected} 
              disabled={selectedFields.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Применить выбранное ({selectedFields.size} полей)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
