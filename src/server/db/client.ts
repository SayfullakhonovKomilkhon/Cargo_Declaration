import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton for database operations
 * Uses global variable in development to prevent multiple instances during hot reload
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance
 * - In development: reuses existing instance to avoid connection issues during hot reload
 * - In production: creates new instance
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Prevent creating new instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Alias for prisma client (for convenience)
 */
export const db = prisma;

/**
 * Disconnect from database (useful for testing and graceful shutdown)
 */
export async function disconnect() {
  await prisma.$disconnect();
}
