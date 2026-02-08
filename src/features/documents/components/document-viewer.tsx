'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { formatFileSize } from '@/server/utils/file-validation';
import {
  DOCUMENT_TYPE_LABELS,
  PROCESSING_STATUS_LABELS,
  PROCESSING_STATUS_COLORS,
  type DocumentWithRelations,
} from '../types';
import { useDocument } from '../hooks/use-documents';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  document: DocumentWithRelations;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document: initialDoc, open, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Fetch fresh document with signed URL
  const { data, isLoading, error } = useDocument(open ? initialDoc.id : null);
  const doc = data?.document || initialDoc;

  const isPdf = doc.fileType === 'application/pdf';
  const isImage = doc.fileType.startsWith('image/');

  // Reset state when document changes
  useEffect(() => {
    setPageNumber(1);
    setScale(1);
    setRotation(0);
    setIsImageLoading(true);
  }, [doc.id]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handlePrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages || 1));

  const handleDownload = () => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0 pr-4">
              <DialogTitle className="truncate">{doc.fileName}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="outline">
                  {DOCUMENT_TYPE_LABELS[doc.documentType]}
                </Badge>
                <Badge
                  className={cn(
                    'font-normal',
                    PROCESSING_STATUS_COLORS[doc.processingStatus]
                  )}
                >
                  {PROCESSING_STATUS_LABELS[doc.processingStatus]}
                </Badge>
                <span>•</span>
                <span>{formatFileSize(doc.fileSize)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenInNewTab}
                title="Открыть в новой вкладке"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Скачать"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Уменьшить">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Увеличить">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRotate} title="Повернуть">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale(1)}
              title="Сбросить масштаб"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* PDF Page Navigation */}
          {isPdf && numPages && numPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {pageNumber} / {numPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Ошибка загрузки документа</p>
            </div>
          ) : !doc.url ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">URL документа недоступен</p>
            </div>
          ) : isPdf ? (
            <div className="flex justify-center">
              <Document
                file={doc.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                }
                error={
                  <div className="text-center text-red-500">
                    <p>Ошибка загрузки PDF</p>
                    <Button
                      variant="link"
                      onClick={handleOpenInNewTab}
                      className="mt-2"
                    >
                      Открыть в новой вкладке
                    </Button>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className="shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          ) : isImage ? (
            <div className="flex justify-center">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              <img
                src={doc.url}
                alt={doc.fileName}
                onLoad={() => setIsImageLoading(false)}
                className="max-w-full shadow-lg transition-transform"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4">
                Предпросмотр недоступен для этого типа файла
              </p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Скачать файл
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
