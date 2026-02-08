import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/features/auth/components';

export default function RegisterPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт для работы с системой ГТД</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="animate-pulse">Загрузка...</div>}>
          <RegisterForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
