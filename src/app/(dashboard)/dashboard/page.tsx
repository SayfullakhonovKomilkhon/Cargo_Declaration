/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import {
  FileText,
  FilePenLine,
  Send,
  CheckCircle2,
  Plus,
  Upload,
  BarChart3,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsCard } from '@/shared/ui';
import { DeclarationStatus, DeclarationType } from '@prisma/client';

// Status configuration
const statusConfig: Record<
  DeclarationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: 'Черновик', variant: 'secondary' },
  IN_PROGRESS: { label: 'В работе', variant: 'outline' },
  PENDING_VALIDATION: { label: 'На проверке', variant: 'outline' },
  VALIDATED: { label: 'Проверена', variant: 'default' },
  SUBMITTED: { label: 'Подана', variant: 'default' },
  ACCEPTED: { label: 'Принята', variant: 'default' },
  REJECTED: { label: 'Отклонена', variant: 'destructive' },
  ARCHIVED: { label: 'В архиве', variant: 'secondary' },
};

const typeLabels: Record<DeclarationType, string> = {
  IMPORT: 'Импорт',
  EXPORT: 'Экспорт',
  TRANSIT: 'Транзит',
};

async function getDashboardStats(userId: string) {
  const [total, drafts, submitted, accepted, recent] = await Promise.all([
    prisma.declaration.count({
      where: { userId },
    }),
    prisma.declaration.count({
      where: { userId, status: DeclarationStatus.DRAFT },
    }),
    prisma.declaration.count({
      where: { userId, status: DeclarationStatus.SUBMITTED },
    }),
    prisma.declaration.count({
      where: { userId, status: DeclarationStatus.ACCEPTED },
    }),
    prisma.declaration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        declarationNumber: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    total,
    drafts,
    submitted,
    accepted,
    recent,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const stats = await getDashboardStats(userId);
  const userName = session?.user?.name?.split(' ')[0] || 'Пользователь';

  // Get current time greeting
  const hour = new Date().getHours();
  let greeting = 'Добрый день';
  if (hour < 12) greeting = 'Доброе утро';
  else if (hour >= 18) greeting = 'Добрый вечер';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting}, {userName}!
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {new Date().toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Всего деклараций"
          value={stats.total}
          icon={FileText}
          description="за все время"
        />
        <StatsCard
          title="Черновики"
          value={stats.drafts}
          icon={FilePenLine}
          description="требуют доработки"
          iconClassName="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatsCard
          title="Поданные"
          value={stats.submitted}
          icon={Send}
          description="на рассмотрении"
          iconClassName="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard
          title="Принятые"
          value={stats.accepted}
          icon={CheckCircle2}
          description="успешно оформлены"
          iconClassName="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent declarations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Недавние декларации</CardTitle>
              <CardDescription>
                Последние созданные или измененные декларации
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/declarations">
                Все декларации
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Нет деклараций
                </h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Создайте первую декларацию, чтобы начать работу
                </p>
                <Button asChild className="mt-6">
                  <Link href={'/declarations/new' as any}>
                    Создать декларацию
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№ Декларации</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent.map((declaration) => (
                    <TableRow key={declaration.id}>
                      <TableCell className="font-medium">
                        {declaration.declarationNumber || 'Не присвоен'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[declaration.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[declaration.status].variant}>
                          {statusConfig[declaration.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(declaration.createdAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/declarations/${declaration.id}` as any}>
                            Открыть
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Частые операции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href={'/declarations/new' as any}>
                <Plus className="mr-2 h-4 w-4" />
                Создать декларацию
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/documents">
                <Upload className="mr-2 h-4 w-4" />
                Загрузить документы
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Посмотреть отчеты
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
