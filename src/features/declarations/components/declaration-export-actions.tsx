'use client';

import { useState } from 'react';
import { Download, FileText, FileCode, Loader2, Printer, ExternalLink, FileOutput } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeclarationExportActionsProps {
  declarationId: string;
  declarationNumber?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DeclarationExportActions({
  declarationId,
  declarationNumber,
  variant = 'outline',
  size = 'default',
}: DeclarationExportActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'pdf' | 'pdf-official' | 'xml' | 'preview' | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Download PDF using new template-based method (pixel-perfect)
  const handleDownloadOfficialPDF = async (debug = false) => {
    setIsLoading(true);
    setLoadingType('pdf-official');

    try {
      const url = `/api/declarations/${declarationId}/pdf?method=template${debug ? '&debug=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации PDF');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `GTD-${declarationNumber || 'DRAFT'}_official.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Официальный PDF скачан');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка скачивания PDF');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // Preview PDF in dialog
  const handlePreviewOfficialPDF = async () => {
    setIsLoading(true);
    setLoadingType('pdf-official');

    try {
      const url = `/api/declarations/${declarationId}/pdf?method=template`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации PDF');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(blobUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации превью');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    setLoadingType('pdf');

    try {
      const response = await fetch(`/api/declarations/${declarationId}/pdf?method=html`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации PDF');
      }

      const contentType = response.headers.get('Content-Type');

      if (contentType?.includes('text/html')) {
        // Fallback: open HTML in new window for printing
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.info('PDF генератор не установлен. Открыт HTML для печати.');
      } else {
        // Download PDF
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GTD-${declarationNumber || 'DRAFT'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF скачан');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка скачивания PDF');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleDownloadXML = async () => {
    setIsLoading(true);
    setLoadingType('xml');

    try {
      const response = await fetch(`/api/declarations/${declarationId}/xml`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка экспорта XML');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GTD-${declarationNumber || 'DRAFT'}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('XML скачан');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка экспорта XML');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setLoadingType('preview');

    try {
      const response = await fetch(`/api/declarations/${declarationId}/pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации превью');
      }

      const data = await response.json();
      setPreviewHtml(data.html);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации превью');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handlePrint = () => {
    if (previewHtml) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(previewHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Экспорт
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePreviewOfficialPDF} disabled={loadingType === 'pdf-official'}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Предпросмотр (официальный)
            {loadingType === 'pdf-official' && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownloadOfficialPDF()} disabled={loadingType === 'pdf-official'}>
            <FileOutput className="h-4 w-4 mr-2" />
            PDF (официальный бланк)
            {loadingType === 'pdf-official' && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileText className="h-4 w-4 mr-2" />
              Другие форматы PDF
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleDownloadPDF} disabled={loadingType === 'pdf'}>
                <FileText className="h-4 w-4 mr-2" />
                PDF (упрощённый)
                {loadingType === 'pdf' && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadOfficialPDF(true)} disabled={loadingType === 'pdf-official'}>
                <FileText className="h-4 w-4 mr-2" />
                PDF с сеткой (отладка)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                const url = `/api/declarations/${declarationId}/pdf?method=template&background=true`;
                window.open(url, '_blank');
              }}>
                <FileOutput className="h-4 w-4 mr-2" />
                PDF с фоном бланка
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                const url = `/api/declarations/${declarationId}/pdf?method=template&borders=true`;
                window.open(url, '_blank');
              }}>
                <FileText className="h-4 w-4 mr-2" />
                PDF с рамками полей
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePreview} disabled={loadingType === 'preview'}>
                <ExternalLink className="h-4 w-4 mr-2" />
                HTML превью
                {loadingType === 'preview' && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadXML} disabled={loadingType === 'xml'}>
            <FileCode className="h-4 w-4 mr-2" />
            Скачать XML
            {loadingType === 'xml' && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* HTML Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Предпросмотр ГТД (HTML)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Печать
                </Button>
                <Button size="sm" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-white">
            {previewHtml && (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[600px]"
                title="GTD Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewPdfUrl} onOpenChange={() => {
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
        }
        setPreviewPdfUrl(null);
      }}>
        <DialogContent className="max-w-5xl h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Предпросмотр ГТД (официальный бланк)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (previewPdfUrl) {
                    const printWindow = window.open(previewPdfUrl, '_blank');
                    if (printWindow) {
                      printWindow.focus();
                      printWindow.print();
                    }
                  }
                }}>
                  <Printer className="h-4 w-4 mr-2" />
                  Печать
                </Button>
                <Button size="sm" onClick={() => handleDownloadOfficialPDF()}>
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-gray-100">
            {previewPdfUrl && (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full min-h-[700px]"
                title="GTD PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Simple PDF download button
 */
export function PDFDownloadButton({
  declarationId,
  declarationNumber,
  variant = 'outline',
  size = 'sm',
}: DeclarationExportActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/declarations/${declarationId}/pdf`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка генерации PDF');
      }

      const contentType = response.headers.get('Content-Type');

      if (contentType?.includes('text/html')) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GTD-${declarationNumber || 'DRAFT'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </Button>
  );
}
