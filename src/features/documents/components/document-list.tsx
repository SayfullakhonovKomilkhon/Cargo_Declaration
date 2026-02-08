'use client';

import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalSelect } from '@/shared/ui/modal-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { formatFileSize } from '@/server/utils/file-validation';
import {
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  PROCESSING_STATUS_LABELS,
  PROCESSING_STATUS_COLORS,
  type DocumentWithRelations,
} from '../types';
import { useDocuments, useDeleteDocument } from '../hooks/use-documents';
import dynamic from 'next/dynamic';

const DocumentViewer = dynamic(() => import('./document-viewer').then(mod => mod.DocumentViewer), {
  ssr: false,
  loading: () => null,
});

interface DocumentListProps {
  declarationId?: string;
  className?: string;
}

export function DocumentList({ declarationId, className }: DocumentListProps) {
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithRelations | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithRelations | null>(null);

  const { data, isLoading, error } = useDocuments({
    declarationId,
    documentType: documentType === 'ALL' ? undefined : documentType,
    search: search || undefined,
    page,
    limit: 20,
  });

  const deleteMutation = useDeleteDocument();

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync(documentToDelete.id);
      setDocumentToDelete(null);
    } catch {
      // Error handled in mutation
    }
  };

  const handleView = (doc: DocumentWithRelations) => {
    setSelectedDocument(doc);
  };

  const handleDownload = (doc: DocumentWithRelations) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileQuestion className="h-5 w-5 text-gray-500" />;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка загрузки документов</p>
        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <ModalSelect
            value={documentType}
            onChange={(value) => {
              setDocumentType(value as DocumentType | 'ALL');
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Все типы' },
              ...Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
            placeholder="Тип документа"
            dialogTitle="Выберите тип документа"
            searchPlaceholder="Поиск..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Размер</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата загрузки</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.documents.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <FileQuestion className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Документы не найдены</p>
                  <p className="text-sm text-gray-400">
                    Загрузите документы, чтобы они появились здесь
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              // Document rows
              data?.documents.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>{getFileIcon(doc.fileType)}</TableCell>
                  <TableCell
                    className="font-medium max-w-[200px] truncate"
                    title={doc.fileName}
                    onClick={() => handleView(doc)}
                  >
                    {doc.fileName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatFileSize(doc.fileSize)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'font-normal',
                        PROCESSING_STATUS_COLORS[doc.processingStatus]
                      )}
                    >
                      {PROCESSING_STATUS_LABELS[doc.processingStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDistanceToNow(new Date(doc.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(doc)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          Скачать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDocumentToDelete(doc)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Показано {data.documents.length} из {data.pagination.total} документов
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Назад
            </Button>
            <span className="text-sm">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={() => setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить документ &quot;{documentToDelete?.fileName}&quot;?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
