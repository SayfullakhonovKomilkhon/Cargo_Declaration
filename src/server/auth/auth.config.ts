import type { NextAuthConfig } from 'next-auth';

/**
 * Base NextAuth configuration for Edge Runtime (middleware)
 * This config does NOT include Prisma or any Node.js-only modules
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Providers will be added in the full config
  providers: [],

  callbacks: {
    async jwt({ token, user }) {
      // First time JWT is created (on sign in)
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role as string;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },

    async session({ session, token }) {
      // Pass token data to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },

    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
      const isOnDeclarations = request.nextUrl.pathname.startsWith('/declarations');
      const isOnDocuments = request.nextUrl.pathname.startsWith('/documents');
      const isOnReferences = request.nextUrl.pathname.startsWith('/references');

      const isProtectedRoute =
        isOnDashboard || isOnDeclarations || isOnDocuments || isOnReferences;

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      // Redirect logged in users from auth pages
      const isOnAuthPage =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register');

      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      }

      return true;
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
