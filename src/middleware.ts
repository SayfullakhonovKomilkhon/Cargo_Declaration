import NextAuth from 'next-auth';

// Import base config (Edge-compatible, no Prisma)
import { authConfig } from '@/server/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except static files and api routes that don't need auth
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
