/**
 * Simple in-memory rate limiter using globalThis for Vercel serverless persistence.
 *
 * Tracks request counts per key (e.g., IP address) within a sliding window.
 * globalThis persists across warm invocations of the same serverless function.
 * In production, replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const g = globalThis as typeof globalThis & { __voxcloneRateLimit?: Map<string, RateLimitEntry> };
if (!g.__voxcloneRateLimit) g.__voxcloneRateLimit = new Map();
const store = g.__voxcloneRateLimit;

const CLEANUP_INTERVAL = 60_000;

const gCleanup = globalThis as typeof globalThis & { __voxcloneRateLimitLastCleanup?: number };
if (!gCleanup.__voxcloneRateLimitLastCleanup) gCleanup.__voxcloneRateLimitLastCleanup = 0;

function cleanup() {
  const now = Date.now();
  if (now - gCleanup.__voxcloneRateLimitLastCleanup! < CLEANUP_INTERVAL) return;
  gCleanup.__voxcloneRateLimitLastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
