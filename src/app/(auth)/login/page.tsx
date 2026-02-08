import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components';

export default function LoginPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
        <CardDescription>Введите email и пароль для входа</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="animate-pulse">Загрузка...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
