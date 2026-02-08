import { NextResponse } from 'next/server';

import { prisma } from '@/server/db/client';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  database: 'connected' | 'disconnected' | 'error';
  storage: 'connected' | 'disconnected' | 'error';
  ai: 'connected' | 'unconfigured' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    duration?: number;
  }[];
}

const startTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const checks: HealthStatus['checks'] = [];
  let overallStatus: HealthStatus['status'] = 'ok';

  // Check database connection
  let dbStatus: HealthStatus['database'] = 'disconnected';
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    checks.push({
      name: 'database',
      status: 'pass',
      duration: Date.now() - dbStart,
    });
  } catch (error) {
    dbStatus = 'error';
    overallStatus = 'error';
    checks.push({
      name: 'database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - dbStart,
    });
  }

  // Check storage (Supabase)
  let storageStatus: HealthStatus['storage'] = 'disconnected';
  const storageStart = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      storageStatus = 'connected';
      checks.push({
        name: 'storage',
        status: 'pass',
        duration: Date.now() - storageStart,
      });
    } else {
      storageStatus = 'disconnected';
      overallStatus = overallStatus === 'ok' ? 'degraded' : overallStatus;
      checks.push({
        name: 'storage',
        status: 'fail',
        message: 'Storage not configured',
        duration: Date.now() - storageStart,
      });
    }
  } catch (error) {
    storageStatus = 'error';
    overallStatus = 'error';
    checks.push({
      name: 'storage',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - storageStart,
    });
  }

  // Check AI (Anthropic)
  let aiStatus: HealthStatus['ai'] = 'unconfigured';
  const aiStart = Date.now();
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (anthropicKey) {
      aiStatus = 'connected';
      checks.push({
        name: 'ai',
        status: 'pass',
        duration: Date.now() - aiStart,
      });
    } else {
      aiStatus = 'unconfigured';
      // AI is optional, don't degrade status
      checks.push({
        name: 'ai',
        status: 'fail',
        message: 'AI not configured (optional)',
        duration: Date.now() - aiStart,
      });
    }
  } catch (error) {
    aiStatus = 'error';
    checks.push({
      name: 'ai',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - aiStart,
    });
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
  
  if (missingEnvVars.length > 0) {
    overallStatus = overallStatus === 'ok' ? 'degraded' : overallStatus;
    checks.push({
      name: 'environment',
      status: 'fail',
      message: `Missing: ${missingEnvVars.join(', ')}`,
    });
  } else {
    checks.push({
      name: 'environment',
      status: 'pass',
    });
  }

  const response: HealthStatus = {
    status: overallStatus,
    database: dbStatus,
    storage: storageStatus,
    ai: aiStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  const httpStatus = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}

/**
 * HEAD /api/health
 * Simple health check (just returns 200 if alive)
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
