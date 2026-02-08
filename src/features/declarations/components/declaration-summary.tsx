'use client';

import * as React from 'react';
import { Package, FileText, Calculator, Download, Send, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CommodityItemSummary {
  itemNumber: number;
  description?: string;
  hsCode?: string;
  grossWeight?: number;
  netWeight?: number;
  customsValue?: number;
  dutyAmount?: number;
  vatAmount?: number;
  exciseAmount?: number;
  feeAmount?: number;
  totalPayment?: number;
}

interface DeclarationSummaryProps {
  declarationNumber?: string;
  declarationType?: string;
  status?: string;
  currency?: string;
  items?: CommodityItemSummary[];
  onEdit?: () => void;
  onSubmit?: () => void;
  onDownloadPdf?: () => void;
  isEditable?: boolean;
}

// Форматирование числа как валюты
function formatCurrency(value: number | undefined, currency: string = 'UZS'): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ' + currency;
}

// Расчет итогов
function calculateTotals(items: CommodityItemSummary[]) {
  return items.reduce(
    (acc, item) => ({
      totalCustomsValue: acc.totalCustomsValue + (item.customsValue || 0),
      totalDuty: acc.totalDuty + (item.dutyAmount || 0),
      totalVat: acc.totalVat + (item.vatAmount || 0),
      totalExcise: acc.totalExcise + (item.exciseAmount || 0),
      totalFee: acc.totalFee + (item.feeAmount || 0),
      grandTotal: acc.grandTotal + (item.totalPayment || 0),
    }),
    {
      totalCustomsValue: 0,
      totalDuty: 0,
      totalVat: 0,
      totalExcise: 0,
      totalFee: 0,
      grandTotal: 0,
    }
  );
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Черновик', variant: 'secondary' },
  SUBMITTED: { label: 'Подана', variant: 'default' },
  ACCEPTED: { label: 'Принята', variant: 'default' },
  REJECTED: { label: 'Отклонена', variant: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  IMPORT: 'Импорт',
  EXPORT: 'Экспорт',
  TRANSIT: 'Транзит',
};

export function DeclarationSummary({
  declarationNumber,
  declarationType,
  status = 'DRAFT',
  currency = 'USD',
  items = [],
  onEdit,
  onSubmit,
  onDownloadPdf,
  isEditable = true,
}: DeclarationSummaryProps) {
  const totals = React.useMemo(() => calculateTotals(items), [items]);
  const statusConfig = STATUS_CONFIG[status] ?? { label: 'Черновик', variant: 'secondary' as const };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">
              {declarationNumber || 'Новая декларация'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{TYPE_LABELS[declarationType || 'IMPORT']}</span>
              <span>•</span>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditable && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
          {onDownloadPdf && (
            <Button variant="outline" onClick={onDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              Скачать PDF
            </Button>
          )}
          {status === 'DRAFT' && onSubmit && (
            <Button onClick={onSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Подать декларацию
            </Button>
          )}
        </div>
      </div>

      {/* Товарные позиции */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Товарные позиции ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет товарных позиций
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>HS код</TableHead>
                  <TableHead className="text-right">Вес нетто</TableHead>
                  <TableHead className="text-right">Там. стоимость</TableHead>
                  <TableHead className="text-right">Платежи</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.itemNumber}>
                    <TableCell className="font-medium">{item.itemNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.hsCode || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.netWeight ? `${item.netWeight.toFixed(3)} кг` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.customsValue, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalPayment, 'UZS')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Финансовые итоги */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Финансовые итоги
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Общая таможенная стоимость</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(totals.totalCustomsValue, currency)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Таможенные пошлины</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.totalDuty, 'UZS')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>НДС</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.totalVat, 'UZS')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Акцизы</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.totalExcise, 'UZS')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Таможенные сборы</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.totalFee, 'UZS')}
                </TableCell>
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-bold text-lg">ИТОГО К УПЛАТЕ</TableCell>
                <TableCell className="text-right font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(totals.grandTotal, 'UZS')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
