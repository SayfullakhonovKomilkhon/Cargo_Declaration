'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { hasPermission, type PermissionType } from '../utils/permissions';

/**
 * Hook for accessing auth state in client components
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  return {
    user,
    isLoading,
    isAuthenticated,
    status,
  };
}

/**
 * Hook that redirects to login if not authenticated
 * Use this in client components that require authentication
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(redirectTo as any);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}

/**
 * Hook that checks if user has a specific permission
 */
export function usePermission(permission: PermissionType) {
  const { user, isLoading } = useAuth();

  const hasAccess = user ? hasPermission(user.role, permission) : false;

  return {
    hasAccess,
    isLoading,
  };
}

/**
 * Hook that checks if user has any of the specified permissions
 */
export function useAnyPermission(permissions: PermissionType[]) {
  const { user, isLoading } = useAuth();

  const hasAccess = user ? permissions.some((p) => hasPermission(user.role, p)) : false;

  return {
    hasAccess,
    isLoading,
  };
}

/**
 * Hook that checks if user has a specific role
 */
export function useRole(allowedRoles: string[]) {
  const { user, isLoading } = useAuth();

  const hasRole = user ? allowedRoles.includes(user.role) : false;

  return {
    hasRole,
    isLoading,
    userRole: user?.role,
  };
}
