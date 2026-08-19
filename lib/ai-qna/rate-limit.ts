/**
 * In-memory fixed-window rate limiting for the Q&A endpoint.
 *
 * Scope and honesty about it: buckets live in the process, so this resets on
 * redeploy and is not shared across serverless instances. It is a cost guard
 * rail against a stuck client or casual abuse — not a security boundary. A
 * durable limiter (e.g. Redis) would be the upgrade path if the endpoint ever
 * needs real protection.
 */

import { getRateLimitConfig } from './config';

interface Bucket {
  count: number;
  /** Epoch ms at which the current window expires. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Drop expired buckets so the map can't grow without bound.
 */
function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (0 when allowed). */
  retryAfterSeconds: number;
  /** Requests still available in the current window. */
  remaining: number;
}

/**
 * Record a request against `clientKey` and report whether it is allowed.
 */
export function checkRateLimit(clientKey: string): RateLimitResult {
  const { windowMs, maxRequests } = getRateLimitConfig();
  const now = Date.now();

  prune(now);

  const existing = buckets.get(clientKey);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  if (bucket.count >= maxRequests) {
    buckets.set(clientKey, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.count += 1;
  buckets.set(clientKey, bucket);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: maxRequests - bucket.count,
  };
}

/**
 * Derive a client key from request headers.
 *
 * Falls back to a shared bucket when no forwarding header is present (local
 * dev), which throttles conservatively rather than not at all.
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Left-most entry is the originating client.
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Clear all buckets. Test-only helper.
 */
export function resetRateLimits(): void {
  buckets.clear();
}
