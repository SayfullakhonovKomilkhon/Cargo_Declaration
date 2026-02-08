'use client';

import { useState } from 'react';

import { Sidebar, Header } from '@/features/layout';
import { cn } from '@/lib/utils';

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('sidebar-collapsed');
  return saved === 'true';
}

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  // Сохранение состояния в localStorage
  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - фиксированный */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content area - с отступом для сайдбара на десктопе */}
      <div className={cn(
        'flex flex-col transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Header */}
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content - обычный скролл страницы */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
