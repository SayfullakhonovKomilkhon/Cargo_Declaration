import type { Document, DocumentType, DocumentProcessingStatus } from '@prisma/client';

/**
 * Document with related data
 */
export interface DocumentWithRelations extends Document {
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  declaration?: {
    id: string;
    declarationNumber: string | null;
  } | null;
  url?: string;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  success: boolean;
  document: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    documentType: DocumentType;
    processingStatus: DocumentProcessingStatus;
    createdAt: Date;
    url: string;
  };
}

/**
 * Documents list response
 */
export interface DocumentsListResponse {
  documents: DocumentWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Document filters
 */
export interface DocumentFilters {
  declarationId?: string;
  documentType?: DocumentType;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * File preview before upload
 */
export interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

/**
 * Document type labels in Russian
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  COMMERCIAL_INVOICE: 'Коммерческий инвойс',
  PACKING_LIST: 'Упаковочный лист',
  BILL_OF_LADING: 'Коносамент',
  AIR_WAYBILL: 'Авиа накладная',
  CMR: 'CMR',
  CERTIFICATE_OF_ORIGIN: 'Сертификат происхождения',
  CONTRACT: 'Контракт',
  QUALITY_CERTIFICATE: 'Сертификат качества',
  LICENSE: 'Лицензия',
  PHYTOSANITARY_CERTIFICATE: 'Фитосанитарный сертификат',
  VETERINARY_CERTIFICATE: 'Ветеринарный сертификат',
  OTHER: 'Прочее',
};

/**
 * Processing status labels in Russian
 */
export const PROCESSING_STATUS_LABELS: Record<DocumentProcessingStatus, string> = {
  PENDING: 'Ожидает обработки',
  PROCESSING: 'Обрабатывается',
  COMPLETED: 'Обработан',
  FAILED: 'Ошибка',
};

/**
 * Processing status colors
 */
export const PROCESSING_STATUS_COLORS: Record<DocumentProcessingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

// Re-export Prisma types
export { DocumentType, DocumentProcessingStatus };
