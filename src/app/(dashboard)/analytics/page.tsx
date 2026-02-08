import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/shared/ui';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Аналитика
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Статистика и отчеты по декларациям
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Декларации за месяц
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% к прошлому месяцу
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Средний срок оформления
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">— дн.</div>
            <p className="text-xs text-muted-foreground">
              Нет данных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Процент принятых
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—%</div>
            <p className="text-xs text-muted-foreground">
              Нет данных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Документов обработано
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              AI обработка документов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Декларации по типам</CardTitle>
            <CardDescription>
              Распределение деклараций по типам за последний месяц
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PieChart}
              title="Нет данных для отображения"
              description="Создайте декларации, чтобы увидеть статистику"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Динамика оформления</CardTitle>
            <CardDescription>
              Количество деклараций по дням
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="Нет данных для отображения"
              description="Создайте декларации, чтобы увидеть статистику"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
