import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { prisma } from '@/server/db/client';

import { authConfig } from './auth.config';

import type { NextAuthConfig } from 'next-auth';

/**
 * Login credentials schema
 */
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
});

/**
 * Full NextAuth configuration with providers (for API routes, NOT Edge)
 * This config includes Prisma and bcrypt which require Node.js runtime
 */
export const fullAuthConfig: NextAuthConfig = {
  ...authConfig,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { organization: true },
        });

        if (!user) {
          // Don't reveal that user doesn't exist
          return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        // Return user data for JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],

  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut() {
      console.log('User signed out');
    },
  },
};

// Re-export base config for middleware
export { authConfig } from './auth.config';
