'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  DocumentFilters,
  DocumentsListResponse,
  DocumentUploadResponse,
  DocumentWithRelations,
} from '../types';

/**
 * Query keys for documents
 */
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

/**
 * Fetch documents list
 */
async function fetchDocuments(filters: DocumentFilters): Promise<DocumentsListResponse> {
  const params = new URLSearchParams();

  if (filters.declarationId) params.set('declarationId', filters.declarationId);
  if (filters.documentType) params.set('documentType', filters.documentType);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/documents/upload?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки документов');
  }

  return response.json();
}

/**
 * Fetch single document
 */
async function fetchDocument(id: string): Promise<{ document: DocumentWithRelations }> {
  const response = await fetch(`/api/documents/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки документа');
  }

  return response.json();
}

/**
 * Upload document
 */
async function uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки документа');
  }

  return response.json();
}

/**
 * Delete document
 */
async function deleteDocument(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка удаления документа');
  }

  return response.json();
}

/**
 * Hook for fetching documents list
 */
export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => fetchDocuments(filters),
  });
}

/**
 * Hook for fetching single document
 */
export function useDocument(id: string | null) {
  return useQuery({
    queryKey: documentKeys.detail(id || ''),
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
  });
}

/**
 * Hook for uploading document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data) => {
      toast.success(`Файл "${data.document.fileName}" загружен`);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for deleting document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Документ удален');
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for refreshing signed URL
 */
export function useRefreshDocumentUrl(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchDocument(id),
    onSuccess: (data) => {
      queryClient.setQueryData(documentKeys.detail(id), data);
    },
  });
}
