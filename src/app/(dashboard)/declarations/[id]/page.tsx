import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Edit, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DeclarationSummary, DeclarationExportActions } from '@/features/declarations';
import { Breadcrumbs } from '@/features/layout/components';
import { prisma } from '@/server/db/client';
import { auth } from '@/server/auth';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Просмотр декларации | GTD UZ',
  description: 'Просмотр таможенной декларации',
};

export default async function ViewDeclarationPage({ params }: PageProps) {
  const { id } = await params;

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  // Load declaration with items
  const declaration = await prisma.declaration.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { itemNumber: 'asc' },
      },
      organization: true,
    },
  });

  if (!declaration) {
    notFound();
  }

  // Check access rights
  const hasAccess =
    session.user.role === 'ADMIN' ||
    declaration.userId === session.user.id ||
    (session.user.organizationId &&
      declaration.organizationId === session.user.organizationId);

  if (!hasAccess) {
    notFound();
  }

  // Prepare items for summary
  const summaryItems = declaration.items.map((item) => ({
    itemNumber: item.itemNumber,
    description: item.goodsDescription || undefined,
    hsCode: item.hsCode || undefined,
    grossWeight: item.grossWeight ? Number(item.grossWeight) : undefined,
    netWeight: item.netWeight ? Number(item.netWeight) : undefined,
    customsValue: item.customsValue ? Number(item.customsValue) : undefined,
    dutyAmount: item.dutyAmount ? Number(item.dutyAmount) : undefined,
    vatAmount: item.vatAmount ? Number(item.vatAmount) : undefined,
    exciseAmount: item.exciseAmount ? Number(item.exciseAmount) : undefined,
    feeAmount: item.feeAmount ? Number(item.feeAmount) : undefined,
    totalPayment: item.totalPayment ? Number(item.totalPayment) : undefined,
  }));

  const isEditable = declaration.status === 'DRAFT' || declaration.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/declarations">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <DeclarationExportActions
            declarationId={declaration.id}
            declarationNumber={declaration.declarationNumber}
          />
          
          {isEditable && (
            <Link href={`/declarations/${declaration.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Declaration Summary */}
      <DeclarationSummary
        declarationNumber={declaration.declarationNumber || undefined}
        declarationType={declaration.type}
        status={declaration.status}
        currency={declaration.invoiceCurrencyCode || 'USD'}
        items={summaryItems}
        isEditable={isEditable}
        onEdit={undefined}
        onSubmit={undefined}
        onDownloadPdf={undefined}
      />
    </div>
  );
}
