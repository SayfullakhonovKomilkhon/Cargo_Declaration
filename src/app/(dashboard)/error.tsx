'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Произошла ошибка</CardTitle>
          <CardDescription>
            Что-то пошло не так при загрузке страницы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono break-all">
              {error.message || 'Неизвестная ошибка'}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Код ошибки: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Попробовать снова
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              На главную
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
