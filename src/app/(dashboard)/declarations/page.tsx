import Link from 'next/link';
import { FileText, Filter, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { CreateDeclarationDialog } from '@/features/declarations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { prisma } from '@/server/db/client';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

// Статусы декларации
const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Черновик', variant: 'secondary' },
  IN_PROGRESS: { label: 'В работе', variant: 'default' },
  PENDING_VALIDATION: { label: 'На проверке', variant: 'outline' },
  VALIDATED: { label: 'Проверено', variant: 'default' },
  SUBMITTED: { label: 'Подано', variant: 'default' },
  ACCEPTED: { label: 'Принято', variant: 'default' },
  REJECTED: { label: 'Отклонено', variant: 'destructive' },
  ARCHIVED: { label: 'В архиве', variant: 'secondary' },
};

// Типы декларации
const TYPE_LABELS: Record<string, string> = {
  IMPORT: 'Импорт',
  EXPORT: 'Экспорт',
  TRANSIT: 'Транзит',
};

export default async function DeclarationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Загружаем декларации пользователя
  const declarations = await prisma.declaration.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { organizationId: session.user.organizationId || undefined },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Декларации
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Управление таможенными декларациями
          </p>
        </div>
        <CreateDeclarationDialog />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Поиск по номеру декларации..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Declarations list */}
      <Card>
        <CardHeader>
          <CardTitle>Список деклараций ({declarations.length})</CardTitle>
          <CardDescription>
            Все ваши таможенные декларации
          </CardDescription>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Нет деклараций
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Создайте первую декларацию для начала работы с системой
              </p>
              <div className="mt-6">
                <CreateDeclarationDialog />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Экспортер</TableHead>
                  <TableHead>Товаров</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((declaration) => {
                  const statusInfo = STATUS_LABELS[declaration.status] || { label: declaration.status, variant: 'secondary' as const };
                  const typeLabel = TYPE_LABELS[declaration.type] || declaration.type;
                  const isEditable = ['DRAFT', 'IN_PROGRESS'].includes(declaration.status);
                  
                  return (
                    <TableRow key={declaration.id}>
                      <TableCell className="font-medium">
                        {declaration.declarationNumber || (
                          <span className="text-muted-foreground">#{declaration.id.slice(-6)}</span>
                        )}
                      </TableCell>
                      <TableCell>{typeLabel}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {declaration.exporterName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{declaration._count.items}</TableCell>
                      <TableCell>
                        {format(declaration.createdAt, 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/declarations/${declaration.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isEditable && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/declarations/${declaration.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
