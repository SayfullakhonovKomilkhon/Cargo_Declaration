'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModalSelect } from '@/shared/ui/modal-select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  formatFileSize,
} from '@/server/utils/file-validation';
import { DocumentType } from '@prisma/client';
import { DOCUMENT_TYPE_LABELS } from '@/features/documents/types';
import type { AIExtractedData } from '@/server/services/anthropic.service';
import type { GTDExtractedData } from '@/server/services/ai-document-analyzer';
import { mapAIDataToFormFields, normalizeItemData, type AnyAIExtractedData } from '../utils/autofill-from-ai';
import {
  defaultDeclarationFormValues,
  defaultBlocks21To30Values,
  defaultBlocks48To53Values,
  defaultCommodityItemValues,
} from '../schemas';

interface FileToUpload {
  file: File;
  preview: string;
  id: string;
  documentType: DocumentType;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error';
  progress: number;
  uploadedDocId?: string;
  extractedData?: AnyAIExtractedData;
  error?: string;
}

// Хелпер для получения имени из разных форматов данных
function getExporterName(data: AnyAIExtractedData | null): string | null {
  if (!data?.exporter) return null;
  // Новый формат GTDExtractedData
  if ('nameAndAddress' in data.exporter) {
    const nameAndAddress = data.exporter.nameAndAddress;
    // Берём первую часть до запятой как имя
    return nameAndAddress?.split(',')[0]?.trim() || nameAndAddress || null;
  }
  // Старый формат AIExtractedData
  return (data.exporter as { name?: string }).name || null;
}

function getExporterAddress(data: AnyAIExtractedData | null): string | null {
  if (!data?.exporter) return null;
  if ('nameAndAddress' in data.exporter) {
    const nameAndAddress = data.exporter.nameAndAddress;
    const parts = nameAndAddress?.split(',') || [];
    return parts.slice(1).join(',').trim() || null;
  }
  return (data.exporter as { address?: string }).address || null;
}

function getExporterCountry(data: AnyAIExtractedData | null): string | null {
  if (!data?.exporter) return null;
  return data.exporter.countryCode || (data.exporter as { country?: string }).country || null;
}

function getConsigneeName(data: AnyAIExtractedData | null): string | null {
  if (!data?.consignee) return null;
  if ('nameAndAddress' in data.consignee) {
    const nameAndAddress = data.consignee.nameAndAddress;
    return nameAndAddress?.split(',')[0]?.trim() || nameAndAddress || null;
  }
  return (data.consignee as { name?: string }).name || null;
}

function getConsigneeAddress(data: AnyAIExtractedData | null): string | null {
  if (!data?.consignee) return null;
  if ('nameAndAddress' in data.consignee) {
    const nameAndAddress = data.consignee.nameAndAddress;
    const parts = nameAndAddress?.split(',') || [];
    return parts.slice(1).join(',').trim() || null;
  }
  return (data.consignee as { address?: string }).address || null;
}

function getConsigneeTin(data: AnyAIExtractedData | null): string | null {
  if (!data?.consignee) return null;
  return data.consignee.tin || null;
}

function getFinancialAmount(data: AnyAIExtractedData | null): number | null {
  if (!data) return null;
  // Новый формат
  if ('totalInvoiceAmount' in data) {
    return data.totalInvoiceAmount || null;
  }
  // Старый формат
  if ('financial' in data && data.financial) {
    return (data.financial as { totalAmount?: number }).totalAmount || null;
  }
  return null;
}

function getFinancialCurrency(data: AnyAIExtractedData | null): string | null {
  if (!data) return null;
  // Новый формат
  if ('invoiceCurrency' in data) {
    return data.invoiceCurrency || null;
  }
  // Старый формат
  if ('financial' in data && data.financial) {
    return (data.financial as { currency?: string }).currency || null;
  }
  return null;
}

function getIncoterms(data: AnyAIExtractedData | null): string | null {
  if (!data) return null;
  // Новый формат
  if ('delivery' in data && data.delivery) {
    return data.delivery.incotermsCode || null;
  }
  // Старый формат
  if ('financial' in data && data.financial) {
    return (data.financial as { incoterms?: string }).incoterms || null;
  }
  return null;
}

function getItemDescription(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): string | null {
  return item.description || null;
}

function getItemPrice(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): number | null {
  return item.price || null;
}

function getItemCurrency(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): string | null {
  if ('currencyCode' in item) return item.currencyCode || null;
  if ('currency' in item) return item.currency || null;
  return null;
}

function getItemHsCode(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): string | null {
  return item.hsCode || null;
}

function getItemQuantity(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): number | null {
  return item.quantity || null;
}

function getItemWeight(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): number | null {
  if ('grossWeight' in item) return item.grossWeight || null;
  if ('weight' in item) return item.weight || null;
  return null;
}

function getItemOrigin(item: AIExtractedData['items'][number] | GTDExtractedData['items'][number]): string | null {
  if ('originCountryCode' in item) return item.originCountryCode || null;
  if ('origin' in item) return item.origin || null;
  return null;
}

interface DeclarationWizardProps {
  onComplete?: (declarationId: string) => void;
}

const STEPS = [
  { id: 1, title: 'Загрузка документов', description: 'Загрузите инвойс, контракт и другие документы' },
  { id: 2, title: 'AI обработка', description: 'Автоматическое извлечение данных' },
  { id: 3, title: 'Проверка и сохранение', description: 'Проверьте данные и сохраните декларацию' },
];

export function DeclarationWizard({ onComplete }: DeclarationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<FileToUpload[]>([]);
  // selectedDocType больше не нужен - теперь тип выбирается в диалоге после загрузки файла
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnyAIExtractedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Состояние для диалога выбора типа документа
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedTypeForFile, setSelectedTypeForFile] = useState<DocumentType>(DocumentType.COMMERCIAL_INVOICE);

  // Drop zone - теперь открывает диалог для выбора типа
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setPendingFiles(acceptedFiles);
        setCurrentFileIndex(0);
        // Автоопределение типа документа по имени файла
        const firstName = acceptedFiles[0].name.toLowerCase();
        if (firstName.includes('invoice') || firstName.includes('инвойс') || firstName.includes('счет')) {
          setSelectedTypeForFile(DocumentType.COMMERCIAL_INVOICE);
        } else if (firstName.includes('cmr') || firstName.includes('накладная') || firstName.includes('ttн')) {
          setSelectedTypeForFile(DocumentType.CMR);
        } else if (firstName.includes('contract') || firstName.includes('контракт') || firstName.includes('договор')) {
          setSelectedTypeForFile(DocumentType.CONTRACT);
        } else if (firstName.includes('packing') || firstName.includes('упаков')) {
          setSelectedTypeForFile(DocumentType.PACKING_LIST);
        } else if (firstName.includes('cert') || firstName.includes('сертификат')) {
          setSelectedTypeForFile(DocumentType.CERTIFICATE_OF_ORIGIN);
        } else {
          setSelectedTypeForFile(DocumentType.COMMERCIAL_INVOICE);
        }
        setShowDocTypeDialog(true);
      }
    },
    []
  );

  // Подтверждение типа документа для текущего файла
  const handleConfirmDocType = useCallback(() => {
    const currentFile = pendingFiles[currentFileIndex];
    if (!currentFile) return;

    const newFile: FileToUpload = {
      file: currentFile,
      preview: currentFile.type.startsWith('image/') ? URL.createObjectURL(currentFile) : '',
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      documentType: selectedTypeForFile,
      status: 'pending',
      progress: 0,
    };

    setFiles((prev) => [...prev, newFile]);

    // Переходим к следующему файлу или закрываем диалог
    if (currentFileIndex < pendingFiles.length - 1) {
      const nextIndex = currentFileIndex + 1;
      setCurrentFileIndex(nextIndex);
      // Автоопределение типа для следующего файла
      const nextFileName = pendingFiles[nextIndex].name.toLowerCase();
      if (nextFileName.includes('invoice') || nextFileName.includes('инвойс')) {
        setSelectedTypeForFile(DocumentType.COMMERCIAL_INVOICE);
      } else if (nextFileName.includes('cmr') || nextFileName.includes('накладная')) {
        setSelectedTypeForFile(DocumentType.CMR);
      } else if (nextFileName.includes('contract') || nextFileName.includes('контракт')) {
        setSelectedTypeForFile(DocumentType.CONTRACT);
      } else if (nextFileName.includes('packing') || nextFileName.includes('упаков')) {
        setSelectedTypeForFile(DocumentType.PACKING_LIST);
      } else {
        setSelectedTypeForFile(DocumentType.COMMERCIAL_INVOICE);
      }
    } else {
      setShowDocTypeDialog(false);
      setPendingFiles([]);
      setCurrentFileIndex(0);
    }
  }, [pendingFiles, currentFileIndex, selectedTypeForFile]);

  // Пропустить файл
  const handleSkipFile = useCallback(() => {
    if (currentFileIndex < pendingFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      setShowDocTypeDialog(false);
      setPendingFiles([]);
      setCurrentFileIndex(0);
    }
  }, [currentFileIndex, pendingFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateFileDocType = (id: string, docType: DocumentType) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, documentType: docType } : f))
    );
  };

  // Step 1 → Step 2: Upload and process documents
  const handleUploadAndProcess = async () => {
    if (files.length === 0) {
      toast.error('Загрузите хотя бы один документ');
      return;
    }

    setCurrentStep(2);
    setIsProcessing(true);

    const allExtractedData: AnyAIExtractedData[] = [];

    // Upload each file and process with AI
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'uploading', progress: 20 } : f
          )
        );

        // Upload file
        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('documentType', fileItem.documentType);

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Ошибка загрузки файла');
        }

        const uploadData = await uploadResponse.json();
        const documentId = uploadData.document.id;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: 'uploaded', progress: 50, uploadedDocId: documentId }
              : f
          )
        );

        // Process with AI
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'processing', progress: 70 } : f
          )
        );

        const processResponse = await fetch(`/api/documents/${documentId}/process`, {
          method: 'POST',
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.details || errorData.error || 'Ошибка обработки AI');
        }

        const processData = await processResponse.json();

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'processed',
                  progress: 100,
                  extractedData: processData.extractedData,
                }
              : f
          )
        );

        if (processData.extractedData) {
          allExtractedData.push(processData.extractedData);
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Ошибка',
                }
              : f
          )
        );
      }
    }

    // Merge all extracted data
    if (allExtractedData.length > 0) {
      const merged = mergeExtractedData(allExtractedData);
      setExtractedData(merged);
    }

    setIsProcessing(false);
  };

  // Merge extracted data from multiple documents (supports both formats)
  const mergeExtractedData = (dataArray: AnyAIExtractedData[]): AnyAIExtractedData => {
    if (dataArray.length === 1) return dataArray[0];

    // Возвращаем первый документ с наибольшей уверенностью как основу
    const sorted = [...dataArray].sort((a, b) => b.confidence - a.confidence);
    const best = JSON.parse(JSON.stringify(sorted[0])) as AnyAIExtractedData;
    
    // Объединяем данные из всех документов
    for (const data of dataArray) {
      if (data === sorted[0]) continue; // Пропускаем лучший, он уже в best
      
      // Объединяем exporter: берём отсутствующие поля
      if (data.exporter && best.exporter) {
        if (!best.exporter.tin && data.exporter.tin) {
          best.exporter.tin = data.exporter.tin;
        }
        if ('nameAndAddress' in best.exporter && 'nameAndAddress' in data.exporter) {
          if (!best.exporter.nameAndAddress && data.exporter.nameAndAddress) {
            best.exporter.nameAndAddress = data.exporter.nameAndAddress;
          }
        }
      } else if (data.exporter && !best.exporter) {
        best.exporter = data.exporter;
      }
      
      // Объединяем consignee: берём отсутствующие поля (ВАЖНО для ИНН!)
      if (data.consignee && best.consignee) {
        if (!best.consignee.tin && data.consignee.tin) {
          best.consignee.tin = data.consignee.tin;
        }
        if ('nameAndAddress' in best.consignee && 'nameAndAddress' in data.consignee) {
          if (!best.consignee.nameAndAddress && data.consignee.nameAndAddress) {
            best.consignee.nameAndAddress = data.consignee.nameAndAddress;
          }
        }
        if ('name' in best.consignee && 'name' in data.consignee) {
          const bc = best.consignee as { name?: string; address?: string };
          const dc = data.consignee as { name?: string; address?: string };
          if (!bc.name && dc.name) bc.name = dc.name;
          if (!bc.address && dc.address) bc.address = dc.address;
        }
      } else if (data.consignee && !best.consignee) {
        best.consignee = data.consignee;
      }
      
      // Объединяем financialResponsible
      if ('financialResponsible' in data && 'financialResponsible' in best) {
        const bf = best.financialResponsible;
        const df = data.financialResponsible;
        if (df && bf) {
          if (!bf.tin && df.tin) bf.tin = df.tin;
        } else if (df && !bf) {
          (best as { financialResponsible: typeof df }).financialResponsible = df;
        }
      }
      
      // Объединяем delivery/incoterms
      if ('delivery' in data && 'delivery' in best) {
        const bd = best.delivery;
        const dd = data.delivery;
        if (dd && bd) {
          if (!bd.incotermsCode && dd.incotermsCode) bd.incotermsCode = dd.incotermsCode;
          if (!bd.place && dd.place) bd.place = dd.place;
        } else if (dd && !bd) {
          (best as { delivery: typeof dd }).delivery = dd;
        }
      }
      
      // Объединяем transport
      if ('transportDeparture' in data && 'transportDeparture' in best) {
        const bt = best.transportDeparture;
        const dt = data.transportDeparture;
        if (dt && !bt) {
          (best as { transportDeparture: typeof dt }).transportDeparture = dt;
        }
      }
      
      // Объединяем invoiceCurrency и totalInvoiceAmount
      if ('invoiceCurrency' in data && 'invoiceCurrency' in best) {
        if (!best.invoiceCurrency && data.invoiceCurrency) {
          (best as { invoiceCurrency: string | null }).invoiceCurrency = data.invoiceCurrency;
        }
      }
      if ('totalInvoiceAmount' in data && 'totalInvoiceAmount' in best) {
        if (!best.totalInvoiceAmount && data.totalInvoiceAmount) {
          (best as { totalInvoiceAmount: number | null }).totalInvoiceAmount = data.totalInvoiceAmount;
        }
      }
    }
    
    // Объединяем товары из всех документов
    const allItems: AnyAIExtractedData['items'] = [];
    for (const data of dataArray) {
      if (data.items) {
        for (const item of data.items) {
          // Проверяем дубликаты по VIN или описанию+цене
          const itemVin = 'vinNumber' in item ? item.vinNumber : null;
          const isDuplicate = allItems.some((existing) => {
            const existingVin = 'vinNumber' in existing ? existing.vinNumber : null;
            if (itemVin && existingVin) {
              return itemVin === existingVin;
            }
            return getItemDescription(existing) === getItemDescription(item) && 
              getItemPrice(existing) === getItemPrice(item);
          });
          if (!isDuplicate) {
            allItems.push(item);
          }
        }
      }
    }
    best.items = allItems;

    // Усредняем confidence
    best.confidence = dataArray.reduce((sum, d) => sum + d.confidence, 0) / dataArray.length;

    return best;
  };

  // Step 2 → Step 3: Go to form
  const handleGoToForm = () => {
    setCurrentStep(3);
  };

  // Step 3: Save declaration with AI data and redirect to edit
  const handleCreateDeclaration = async () => {
    setIsSaving(true);

    try {
      // Prepare initial data from AI
      const initialData: Record<string, unknown> = {
        ...defaultDeclarationFormValues,
        ...defaultBlocks21To30Values,
        ...defaultBlocks48To53Values,
      };

      if (extractedData) {
        console.log('=== Declaration Wizard DEBUG ===');
        console.log('extractedData:', JSON.stringify(extractedData, null, 2));
        
        const autofillResult = mapAIDataToFormFields(extractedData, {});
        console.log('autofillResult.fields count:', autofillResult.fields.length);
        console.log('autofillResult.formData:', JSON.stringify(autofillResult.formData, null, 2));
        console.log('=================================');
        
        Object.assign(initialData, autofillResult.formData);

        // Получаем строку документов для блока 44
        const documentsString = autofillResult.unmappedData?.documentsString as string || '';
        console.log('documentsString for Block 44:', documentsString);

        // Map items with normalization
        if (extractedData.items && extractedData.items.length > 0) {
          initialData.items = extractedData.items.map((item, index) => ({
            ...defaultCommodityItemValues,
            ...normalizeItemData(item, index, documentsString),
          }));
          console.log('Mapped items:', JSON.stringify(initialData.items, null, 2));
        } else {
          initialData.items = [{ ...defaultCommodityItemValues, itemNumber: 1 }];
        }
      } else {
        console.log('No extractedData available');
        initialData.items = [{ ...defaultCommodityItemValues, itemNumber: 1 }];
      }

      // Save declaration
      const { saveFullDeclaration } = await import('../actions');
      const result = await saveFullDeclaration(null, initialData);

      if (result.success && result.data?.id) {
        // Link uploaded documents to declaration
        const uploadedDocIds = files
          .filter((f) => f.uploadedDocId)
          .map((f) => f.uploadedDocId!);

        for (const docId of uploadedDocIds) {
          await fetch(`/api/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ declarationId: result.data.id }),
          });
        }

        toast.success('Декларация создана! Проверьте и отредактируйте данные.');

        if (onComplete) {
          onComplete(result.data.id);
        } else {
          router.push(`/declarations/${result.data.id}/edit`);
        }
      } else {
        toast.error(result.error || 'Ошибка создания декларации');
      }
    } catch (error) {
      console.error('Create declaration error:', error);
      toast.error('Ошибка создания декларации');
    } finally {
      setIsSaving(false);
    }
  };

  // Get processed count
  const processedCount = files.filter((f) => f.status === 'processed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Steps Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-4',
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload Documents */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Загрузите документы для декларации
            </CardTitle>
            <CardDescription>
              Загрузите коммерческий инвойс (Invoice), CMR, контракт и другие документы.
              После выбора файла укажите его тип для более точной обработки ИИ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Подсказка о типах документов */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Совет:</strong> Для лучшего результата загрузите минимум Invoice и CMR.
                ИИ извлечёт данные о товарах, ценах, отправителе и получателе.
              </p>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">Отпустите файлы здесь...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-1">
                    Перетащите файлы сюда или нажмите для выбора
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, JPEG, PNG. Максимум {MAX_FILE_SIZE_LABEL} на файл.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    После выбора файла появится окно для указания типа документа
                  </p>
                </>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Документы готовы к обработке ({files.length})</h4>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Типы указаны
                  </Badge>
                </div>
                <div className="space-y-2">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      {fileItem.file.type.startsWith('image/') ? (
                        <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="h-8 w-8 text-red-500 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                      </div>

                      <Badge className="bg-blue-100 text-blue-800 shrink-0">
                        {DOCUMENT_TYPE_LABELS[fileItem.documentType]}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Открыть диалог для изменения типа
                          setPendingFiles([fileItem.file]);
                          setCurrentFileIndex(0);
                          setSelectedTypeForFile(fileItem.documentType);
                          setShowDocTypeDialog(true);
                          // Удалить текущий файл (будет добавлен заново с новым типом)
                          removeFile(fileItem.id);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Изменить тип
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUploadAndProcess}
                disabled={files.length === 0}
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Загрузить и обработать AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Processing */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI обрабатывает документы
            </CardTitle>
            <CardDescription>
              Пожалуйста, подождите. AI анализирует документы и извлекает данные.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Processing Status */}
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {fileItem.file.type.startsWith('image/') ? (
                    <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-500 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <Badge
                        variant={
                          fileItem.status === 'processed'
                            ? 'default'
                            : fileItem.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {fileItem.status === 'pending' && 'Ожидает'}
                        {fileItem.status === 'uploading' && 'Загрузка...'}
                        {fileItem.status === 'uploaded' && 'Загружен'}
                        {fileItem.status === 'processing' && 'AI обработка...'}
                        {fileItem.status === 'processed' && 'Готово'}
                        {fileItem.status === 'error' && 'Ошибка'}
                      </Badge>
                    </div>
                    {(fileItem.status === 'uploading' ||
                      fileItem.status === 'processing') && (
                      <Progress value={fileItem.progress} className="h-2" />
                    )}
                    {fileItem.status === 'error' && (
                      <p className="text-xs text-red-500">{fileItem.error}</p>
                    )}
                  </div>

                  {fileItem.status === 'processing' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  {fileItem.status === 'processed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {fileItem.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            {!isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Результат обработки</span>
                </div>
                <p className="text-sm text-gray-600">
                  Обработано: {processedCount} из {files.length} документов
                  {errorCount > 0 && (
                    <span className="text-red-500"> ({errorCount} с ошибками)</span>
                  )}
                </p>
                {extractedData && (
                  <div className="mt-2 text-sm space-y-1">
                    {getExporterName(extractedData) && (
                      <p>
                        <span className="text-gray-500">Экспортер:</span>{' '}
                        {getExporterName(extractedData)}
                      </p>
                    )}
                    {getConsigneeName(extractedData) && (
                      <p>
                        <span className="text-gray-500">Получатель:</span>{' '}
                        {getConsigneeName(extractedData)}
                      </p>
                    )}
                    {getFinancialAmount(extractedData) && (
                      <p>
                        <span className="text-gray-500">Сумма:</span>{' '}
                        {getFinancialAmount(extractedData)}{' '}
                        {getFinancialCurrency(extractedData)}
                      </p>
                    )}
                    {extractedData.items?.length > 0 && (
                      <p>
                        <span className="text-gray-500">Товаров:</span>{' '}
                        {extractedData.items.length}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={isProcessing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <Button
                onClick={handleGoToForm}
                disabled={isProcessing || processedCount === 0}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview and Create - показывает ВСЕ извлечённые данные */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Все данные извлечённые ИИ из документов
            </CardTitle>
            <CardDescription>
              Зелёным отмечены поля которые будут автоматически заполнены в ГТД. Нажмите «Создать» для перехода к редактированию.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Extracted Data Summary - ВСЕ данные по секциям ГТД */}
            {extractedData && (
              <div className="space-y-4">
                {/* Статистика */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      ИИ успешно извлёк данные
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Уверенность: {Math.round((extractedData.confidence || 0.8) * 100)}%
                  </Badge>
                </div>

                {/* Блоки 1-7: Общие сведения */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 font-medium text-blue-900">
                    📋 Блоки 1-7: Общие сведения о декларации
                  </div>
                  <div className="p-4 grid gap-3 md:grid-cols-2">
                    {('declarationType' in extractedData && extractedData.declarationType) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.1 Тип декларации:</span>
                        <p className="font-medium">{extractedData.declarationType} {extractedData.declarationTypeCode && `(${extractedData.declarationTypeCode})`}</p>
                      </div>
                    )}
                    {extractedData.items && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.5 Всего товаров:</span>
                        <p className="font-medium">{extractedData.items.length}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блоки 2, 8, 9, 14: Участники */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-4 py-2 font-medium text-purple-900">
                    👥 Блоки 2, 8, 9, 14: Участники ВЭД
                  </div>
                  <div className="p-4 grid gap-3 md:grid-cols-2">
                    {/* Экспортер */}
                    {extractedData.exporter && (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <span className="text-xs text-gray-500 font-medium">Гр.2 Экспортер/Отправитель:</span>
                        <p className="font-medium mt-1">{getExporterName(extractedData) || '—'}</p>
                        {getExporterAddress(extractedData) && (
                          <p className="text-sm text-gray-600">{getExporterAddress(extractedData)}</p>
                        )}
                        {getExporterCountry(extractedData) && (
                          <p className="text-sm text-gray-500">Страна: {getExporterCountry(extractedData)}</p>
                        )}
                        {extractedData.exporter.tin && (
                          <p className="text-sm text-gray-500">ИНН: {extractedData.exporter.tin}</p>
                        )}
                      </div>
                    )}

                    {/* Получатель */}
                    {extractedData.consignee && (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <span className="text-xs text-gray-500 font-medium">Гр.8 Получатель:</span>
                        <p className="font-medium mt-1">{getConsigneeName(extractedData) || '—'}</p>
                        {getConsigneeAddress(extractedData) && (
                          <p className="text-sm text-gray-600">{getConsigneeAddress(extractedData)}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">ИНН:</span>
                          {getConsigneeTin(extractedData) ? (
                            <span className="font-medium text-sm">{getConsigneeTin(extractedData)}</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Введите ИНН"
                                maxLength={9}
                                className="w-28 px-2 py-0.5 text-xs border border-orange-300 rounded"
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').substring(0, 9);
                                  e.target.value = value;
                                  if (value.length === 9 && extractedData?.consignee) {
                                    setExtractedData(prev => {
                                      if (!prev) return prev;
                                      return { ...prev, consignee: { ...prev.consignee!, tin: value } };
                                    });
                                  }
                                }}
                              />
                              <span className="text-orange-500 text-xs">⚠️</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Финансово ответственный */}
                    {('financialResponsible' in extractedData && extractedData.financialResponsible) && (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <span className="text-xs text-gray-500 font-medium">Гр.9 Фин. ответственный:</span>
                        <p className="font-medium mt-1">{extractedData.financialResponsible.nameAndAddress || '—'}</p>
                        {extractedData.financialResponsible.tin && (
                          <p className="text-sm text-gray-500">ИНН: {extractedData.financialResponsible.tin}</p>
                        )}
                      </div>
                    )}

                    {/* Декларант */}
                    {('declarant' in extractedData && extractedData.declarant) && (
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <span className="text-xs text-gray-500 font-medium">Гр.14 Декларант:</span>
                        <p className="font-medium mt-1">{extractedData.declarant.nameAndAddress || '—'}</p>
                        {extractedData.declarant.tin && (
                          <p className="text-sm text-gray-500">ИНН: {extractedData.declarant.tin}</p>
                        )}
                        {extractedData.declarant.isBroker && (
                          <Badge className="mt-1 text-xs">Брокер</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Блоки 15-17: Страны */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 font-medium text-orange-900">
                    🌍 Блоки 10-17: Страны
                  </div>
                  <div className="p-4 grid gap-3 md:grid-cols-3">
                    {('tradingCountryCode' in extractedData && extractedData.tradingCountryCode) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.11 Торговая страна:</span>
                        <p className="font-medium">{extractedData.tradingCountryCode}</p>
                      </div>
                    )}
                    {('dispatchCountryCode' in extractedData && extractedData.dispatchCountryCode) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.15 Страна отправления:</span>
                        <p className="font-medium">{extractedData.dispatchCountryCode}</p>
                      </div>
                    )}
                    {('originCountryCode' in extractedData && extractedData.originCountryCode) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.16 Страна происхождения:</span>
                        <p className="font-medium">{extractedData.originCountryCode}</p>
                      </div>
                    )}
                    {('destinationCountryCode' in extractedData && extractedData.destinationCountryCode) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.17 Страна назначения:</span>
                        <p className="font-medium">{extractedData.destinationCountryCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блоки 18-21: Транспорт */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-cyan-50 px-4 py-2 font-medium text-cyan-900">
                    🚛 Блоки 18-21, 25-27: Транспорт
                  </div>
                  <div className="p-4 grid gap-3 md:grid-cols-2">
                    {('transportDeparture' in extractedData && extractedData.transportDeparture) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.18 Транспорт при отправлении:</span>
                        <p className="font-medium">{extractedData.transportDeparture.type || 'Авто'}</p>
                        {extractedData.transportDeparture.vehicles?.map((v, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {v.plateNumber} {v.trailerNumber && `/ ${v.trailerNumber}`}
                          </p>
                        ))}
                      </div>
                    )}
                    {('containerIndicator' in extractedData && extractedData.containerIndicator) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.19 Контейнер:</span>
                        <p className="font-medium">{extractedData.containerIndicator === '1' ? 'Да' : 'Нет'}</p>
                      </div>
                    )}
                    {('loadingPlace' in extractedData && extractedData.loadingPlace) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.27 Место погрузки:</span>
                        <p className="font-medium">{extractedData.loadingPlace}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блоки 20, 22-24: Финансы и условия */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-yellow-50 px-4 py-2 font-medium text-yellow-900">
                    💰 Блоки 20, 22-24: Финансовые условия
                  </div>
                  <div className="p-4 grid gap-3 md:grid-cols-2">
                    {('delivery' in extractedData && extractedData.delivery) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.20 Условия поставки:</span>
                        <p className="font-medium">{extractedData.delivery.incotermsCode || getIncoterms(extractedData) || '—'}</p>
                        {extractedData.delivery.place && (
                          <p className="text-sm text-gray-600">{extractedData.delivery.place}</p>
                        )}
                      </div>
                    )}
                    {(getFinancialAmount(extractedData) || ('totalInvoiceAmount' in extractedData && extractedData.totalInvoiceAmount)) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.22 Валюта и сумма счёта:</span>
                        <p className="font-medium">
                          {getFinancialAmount(extractedData) || extractedData.totalInvoiceAmount || 0}{' '}
                          {getFinancialCurrency(extractedData) || ('invoiceCurrency' in extractedData ? extractedData.invoiceCurrency : 'USD')}
                        </p>
                      </div>
                    )}
                    {('transactionNatureCode' in extractedData && extractedData.transactionNatureCode) && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs text-gray-500">Гр.24 Характер сделки:</span>
                        <p className="font-medium">{extractedData.transactionNatureCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Товары - подробно */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2 font-medium text-emerald-900">
                    📦 Блоки 31-47: Товары ({extractedData.items?.length || 0} позиций)
                  </div>
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {extractedData.items && extractedData.items.length > 0 ? (
                      extractedData.items.map((item, i) => (
                        <div key={i} className="bg-green-50 p-3 rounded border border-green-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="text-xs text-gray-500 font-medium">Товар #{i + 1}</span>
                              <p className="font-medium">{getItemDescription(item) || 'Описание не указано'}</p>
                            </div>
                            {getItemHsCode(item) && (
                              <Badge variant="outline" className="shrink-0">
                                ТН ВЭД: {getItemHsCode(item)}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                            {getItemQuantity(item) && (
                              <div>
                                <span className="text-gray-500">Кол-во:</span> {getItemQuantity(item)}
                              </div>
                            )}
                            {getItemPrice(item) && (
                              <div>
                                <span className="text-gray-500">Цена:</span> {getItemPrice(item)} {getItemCurrency(item) || 'USD'}
                              </div>
                            )}
                            {getItemWeight(item) && (
                              <div>
                                <span className="text-gray-500">Вес:</span> {getItemWeight(item)} кг
                              </div>
                            )}
                            {getItemOrigin(item) && (
                              <div>
                                <span className="text-gray-500">Происх.:</span> {getItemOrigin(item)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4">Товары не найдены в документах</p>
                    )}
                  </div>
                </div>

                {/* Документы */}
                {('documents' in extractedData && extractedData.documents && extractedData.documents.length > 0) && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 font-medium text-slate-900">
                      📄 Гр.44: Документы ({extractedData.documents.length})
                    </div>
                    <div className="p-4 grid gap-2 md:grid-cols-2">
                      {extractedData.documents.map((doc, i) => (
                        <div key={i} className="bg-green-50 p-2 rounded border border-green-200 text-sm">
                          <span className="font-medium">{doc.code}</span> {doc.shortName} № {doc.number || 'Б/Н'} от {doc.date || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!extractedData && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>AI не смог извлечь данные из документов.</p>
                <p className="text-sm">
                  Вы можете создать пустую декларацию и заполнить вручную.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 sticky bottom-0 bg-white border-t mt-4 -mx-6 px-6 py-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <Button onClick={handleCreateDeclaration} disabled={isSaving} size="lg" className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Создать декларацию с этими данными
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог выбора типа документа */}
      <Dialog open={showDocTypeDialog} onOpenChange={setShowDocTypeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Выберите тип документа
            </DialogTitle>
            <DialogDescription>
              Укажите тип документа для правильной обработки ИИ
              {pendingFiles.length > 1 && (
                <span className="block mt-1 text-blue-600">
                  Файл {currentFileIndex + 1} из {pendingFiles.length}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {pendingFiles[currentFileIndex] && (
            <div className="space-y-4">
              {/* Превью файла */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                {pendingFiles[currentFileIndex].type.startsWith('image/') ? (
                  <ImageIcon className="h-10 w-10 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-10 w-10 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pendingFiles[currentFileIndex].name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(pendingFiles[currentFileIndex].size)}
                  </p>
                </div>
              </div>

              {/* Выбор типа документа - крупные кнопки */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedTypeForFile(value as DocumentType)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      selectedTypeForFile === value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {value === 'COMMERCIAL_INVOICE' && 'Счёт-фактура продавца'}
                      {value === 'CMR' && 'Товарно-транспортная накладная'}
                      {value === 'CONTRACT' && 'Договор купли-продажи'}
                      {value === 'PACKING_LIST' && 'Список упаковки товаров'}
                      {value === 'CERTIFICATE_OF_ORIGIN' && 'Сертификат страны происхождения'}
                      {value === 'BILL_OF_LADING' && 'Морской коносамент'}
                      {value === 'AIR_WAYBILL' && 'Авианакладная'}
                      {value === 'OTHER' && 'Прочие документы'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {pendingFiles.length > 1 && (
              <Button variant="ghost" onClick={handleSkipFile} className="mr-auto">
                Пропустить
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              setShowDocTypeDialog(false);
              setPendingFiles([]);
            }}>
              Отмена
            </Button>
            <Button onClick={handleConfirmDocType} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pendingFiles.length > 1 && currentFileIndex < pendingFiles.length - 1
                ? 'Добавить и продолжить'
                : 'Добавить документ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}