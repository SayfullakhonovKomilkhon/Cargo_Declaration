/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis-based solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  /**
   * Number of requests allowed in the window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  /**
   * Whether the request should be allowed
   */
  allowed: boolean;

  /**
   * Current count of requests in the window
   */
  current: number;

  /**
   * Maximum requests allowed
   */
  limit: number;

  /**
   * Seconds until the rate limit resets
   */
  remaining: number;

  /**
   * When the rate limit resets (Unix timestamp)
   */
  resetAt: number;
}

/**
 * Check rate limit for a key
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = store.get(key);

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, entry);

    return {
      allowed: true,
      current: 1,
      limit: config.limit,
      remaining: Math.ceil((entry.resetAt - now) / 1000),
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= config.limit;

  return {
    allowed,
    current: entry.count,
    limit: config.limit,
    remaining: Math.ceil((entry.resetAt - now) / 1000),
    resetAt: entry.resetAt,
  };
}

/**
 * Generate rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.limit - result.current).toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}

/**
 * Pre-configured rate limit configurations
 */
export const RATE_LIMITS = {
  /**
   * Auth endpoints: 5 requests per minute
   */
  auth: {
    limit: 5,
    windowSeconds: 60,
  },

  /**
   * Document upload: 10 files per hour
   */
  upload: {
    limit: 10,
    windowSeconds: 3600,
  },

  /**
   * AI endpoints: 20 requests per hour
   */
  ai: {
    limit: 20,
    windowSeconds: 3600,
  },

  /**
   * PDF generation: 30 requests per hour
   */
  pdf: {
    limit: 30,
    windowSeconds: 3600,
  },

  /**
   * General API: 100 requests per minute
   */
  api: {
    limit: 100,
    windowSeconds: 60,
  },
} as const;

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}
