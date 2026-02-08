import { Loader2 } from 'lucide-react';

export default function DashboardRootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Загрузка...
        </p>
      </div>
    </div>
  );
}
