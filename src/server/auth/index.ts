import NextAuth from 'next-auth';

// Use full config with providers (Node.js runtime)
import { fullAuthConfig } from './config';

/**
 * NextAuth instance with all exports
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(fullAuthConfig);

/**
 * Get the current session on the server
 * Use this in Server Components and Server Actions
 */
export { auth as getServerSession };

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

/**
 * Require specific role
 * Throws error if user doesn't have the required role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
