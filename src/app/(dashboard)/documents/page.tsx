'use client';

import { useState } from 'react';
import { Upload, FileText, Image, Files, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DocumentUploader, DocumentList } from '@/features/documents';
import { useDocuments } from '@/features/documents/hooks/use-documents';
import { DocumentProcessingStatus } from '@prisma/client';

export default function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Get document stats
  const { data: allDocs } = useDocuments({ limit: 1000 });

  // Calculate stats
  const stats = {
    total: allDocs?.pagination.total || 0,
    pending: allDocs?.documents.filter((d) => d.processingStatus === DocumentProcessingStatus.PENDING).length || 0,
    pdfs: allDocs?.documents.filter((d) => d.fileType === 'application/pdf').length || 0,
    images: allDocs?.documents.filter((d) => d.fileType.startsWith('image/')).length || 0,
  };

  const handleUploadComplete = () => {
    setIsUploadOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Документы</h1>
          <p className="mt-1 text-slate-600">
            Управление документами для деклараций
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить документы
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Загрузка документов</DialogTitle>
              <DialogDescription>
                Загрузите документы (инвойсы, контракты, сертификаты) для
                обработки AI-агентом
              </DialogDescription>
            </DialogHeader>
            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего документов</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              загружено в систему
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают обработки</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              документов в очереди
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDF файлы</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pdfs}</div>
            <p className="text-xs text-muted-foreground">
              документов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Изображения</CardTitle>
            <Image className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.images}</div>
            <p className="text-xs text-muted-foreground">
              файлов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle>Загруженные документы</CardTitle>
          <CardDescription>
            Инвойсы, контракты, сертификаты и другие документы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList />
        </CardContent>
      </Card>
    </div>
  );
}
