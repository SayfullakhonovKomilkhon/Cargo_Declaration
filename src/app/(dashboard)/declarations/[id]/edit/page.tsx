import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GTDFullForm } from '@/features/declarations';
import { Breadcrumbs } from '@/features/layout/components';
import { prisma } from '@/server/db/client';
import { auth } from '@/server/auth';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Редактирование декларации | GTD UZ',
  description: 'Редактирование таможенной декларации',
};

export default async function EditDeclarationPage({ params }: PageProps) {
  const { id } = await params;

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  // Check if declaration exists and user has access
  const declaration = await prisma.declaration.findUnique({
    where: { id },
    select: {
      id: true,
      declarationNumber: true,
      userId: true,
      organizationId: true,
      status: true,
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

  return (
    <div className="w-full">
      {/* Header с breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {declaration.declarationNumber
              ? `Декларация ${declaration.declarationNumber}`
              : 'Редактирование декларации'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Проверьте и отредактируйте данные декларации
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div>
        <GTDFullForm declarationId={id} />
      </div>
    </div>
  );
}
