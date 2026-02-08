import { ShieldX } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Доступ запрещен</CardTitle>
          <CardDescription className="text-base">
            У вас недостаточно прав для просмотра этой страницы.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Если вы считаете, что это ошибка, обратитесь к администратору системы для получения
            необходимых прав доступа.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button variant="default">Вернуться на главную</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Войти другим пользователем</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
