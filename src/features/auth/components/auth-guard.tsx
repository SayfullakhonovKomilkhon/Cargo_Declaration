import { redirect } from 'next/navigation';

import { auth } from '@/server/auth';

import type { ReactNode } from 'react';


interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * Server component that protects routes
 * Redirects to login if not authenticated
 * Redirects to unauthorized if role doesn't match
 */
export async function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const session = await auth();

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect('/login');
  }

  // Check role if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      redirect('/unauthorized');
    }
  }

  return <>{children}</>;
}

/**
 * HOC for requiring specific roles
 */
export function withRole(Component: React.ComponentType, allowedRoles: string[]) {
  return async function ProtectedComponent(props: Record<string, unknown>) {
    const session = await auth();

    if (!session?.user) {
      redirect('/login');
    }

    if (!allowedRoles.includes(session.user.role)) {
      redirect('/unauthorized');
    }

    return <Component {...props} />;
  };
}
