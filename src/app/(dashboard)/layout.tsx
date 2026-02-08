import { redirect } from 'next/navigation';

import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/server/auth';

import { DashboardShell } from './components/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = {
    name: session.user.name || 'User',
    email: session.user.email || '',
    role: session.user.role || 'DECLARANT',
  };

  return (
    <>
      <DashboardShell user={user}>{children}</DashboardShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
