'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

// Route name mappings
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  declarations: 'Декларации',
  documents: 'Документы',
  references: 'Справочники',
  analytics: 'Аналитика',
  settings: 'Настройки',
  new: 'Создать',
  edit: 'Редактировать',
  profile: 'Профиль',
  organization: 'Организация',
  security: 'Безопасность',
  notifications: 'Уведомления',
};

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { name: string; href: string; current: boolean }[] = [];

    let currentPath = '';

    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;

      // Skip dynamic segments like [id]
      if (path.startsWith('[') && path.endsWith(']')) {
        return;
      }

      // Check if it looks like an ID (cuid or uuid)
      if (path.length > 20 || /^[a-z0-9]{24,}$/i.test(path)) {
        breadcrumbs.push({
          name: 'Детали',
          href: currentPath,
          current: isLast,
        });
        return;
      }

      const name = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({
        name,
        href: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/dashboard"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((breadcrumb) => (
          <li key={breadcrumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            {breadcrumb.current ? (
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={breadcrumb.href as any}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
