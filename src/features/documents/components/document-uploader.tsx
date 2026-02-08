'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ModalSelect } from '@/shared/ui/modal-select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/shared/lib/utils';
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  formatFileSize,
} from '@/server/utils/file-validation';
import { DocumentType } from '@prisma/client';
import { DOCUMENT_TYPE_LABELS, type FilePreview } from '../types';
import { useUploadDocument } from '../hooks/use-documents';

interface DocumentUploaderProps {
  declarationId?: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  className?: string;
}

export function DocumentUploader({
  declarationId,
  onUploadComplete,
  maxFiles = 10,
  className,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});

  const uploadMutation = useUploadDocument();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }));

      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, maxFiles);
      });

      // Initialize status for new files
      newFiles.forEach((f) => {
        setUploadStatus((prev) => ({ ...prev, [f.id]: 'pending' }));
        setUploadProgress((prev) => ({ ...prev, [f.id]: 0 }));
      });
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    setUploadStatus((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => uploadStatus[f.id] === 'pending');

    for (const filePreview of pendingFiles) {
      setUploadStatus((prev) => ({ ...prev, [filePreview.id]: 'uploading' }));
      setUploadProgress((prev) => ({ ...prev, [filePreview.id]: 10 }));

      try {
        const formData = new FormData();
        formData.append('file', filePreview.file);
        formData.append('documentType', documentType);
        if (declarationId) {
          formData.append('declarationId', declarationId);
        }

        setUploadProgress((prev) => ({ ...prev, [filePreview.id]: 50 }));

        await uploadMutation.mutateAsync(formData);

        setUploadProgress((prev) => ({ ...prev, [filePreview.id]: 100 }));
        setUploadStatus((prev) => ({ ...prev, [filePreview.id]: 'success' }));
      } catch {
        setUploadStatus((prev) => ({ ...prev, [filePreview.id]: 'error' }));
      }
    }

    // Callback after all uploads complete
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const clearCompleted = () => {
    const completedIds = files
      .filter((f) => uploadStatus[f.id] === 'success')
      .map((f) => f.id);
    completedIds.forEach((id) => removeFile(id));
  };

  const hasFilesToUpload = files.some((f) => uploadStatus[f.id] === 'pending');
  const hasCompletedUploads = files.some((f) => uploadStatus[f.id] === 'success');
  const isUploading = files.some((f) => uploadStatus[f.id] === 'uploading');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Document Type Select */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Тип документа:</label>
        <ModalSelect
          value={documentType}
          onChange={(value) => setDocumentType(value as DocumentType)}
          options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          placeholder="Выберите тип"
          dialogTitle="Выберите тип документа"
          searchPlaceholder="Поиск..."
        />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Отпустите файлы здесь...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-1">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-sm text-gray-500">
              Поддерживаются PDF, JPEG, PNG. Максимум {MAX_FILE_SIZE_LABEL} на файл.
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Файлы для загрузки ({files.length}/{maxFiles})
            </h4>
            {hasCompletedUploads && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Очистить загруженные
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((filePreview) => (
              <div
                key={filePreview.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Icon */}
                {filePreview.file.type.startsWith('image/') ? (
                  filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-blue-500" />
                  )
                ) : (
                  <FileText className="h-10 w-10 text-red-500" />
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(filePreview.file.size)}
                  </p>
                  {uploadStatus[filePreview.id] === 'uploading' && (
                    <Progress
                      value={uploadProgress[filePreview.id]}
                      className="h-1 mt-1"
                    />
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {uploadStatus[filePreview.id] === 'pending' && (
                    <span className="text-xs text-gray-500">Ожидает</span>
                  )}
                  {uploadStatus[filePreview.id] === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {uploadStatus[filePreview.id] === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {uploadStatus[filePreview.id] === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}

                  {/* Remove Button */}
                  {uploadStatus[filePreview.id] !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(filePreview.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              files.forEach((f) => {
                if (f.preview) URL.revokeObjectURL(f.preview);
              });
              setFiles([]);
              setUploadStatus({});
              setUploadProgress({});
            }}
            disabled={isUploading}
          >
            Очистить все
          </Button>
          <Button onClick={uploadFiles} disabled={!hasFilesToUpload || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Загрузить ({files.filter((f) => uploadStatus[f.id] === 'pending').length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
