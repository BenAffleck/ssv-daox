/**
 * In-memory fixed-window limits. Buckets live in the process, so they reset on
 * redeploy and are not shared across serverless instances: a cost guard rail,
 * not a security boundary.
 */

export interface Limit {
  windowMs: number;
  max: number;
}

/**
 * `global` caps spend when `perClient` is evaded: client keys come from
 * request headers, which some hosts let clients set.
 */
export interface Limits {
  perClient: Limit;
  global: Limit;
}

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(now: () => number) {
  const buckets = new Map<string, Bucket>();

  function bucketFor(key: string, limit: Limit, at: number): Bucket {
    const existing = buckets.get(key);
    if (existing && existing.resetAt > at) {
      return existing;
    }
    const fresh = { count: 0, resetAt: at + limit.windowMs };
    buckets.set(key, fresh);
    return fresh;
  }

  /** Takes one request from both of `scope`'s buckets, or from neither. */
  function take(scope: string, clientKey: string, limits: Limits): RateLimitDecision {
    const at = now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= at) {
        buckets.delete(key);
      }
    }

    const checks = [
      {
        bucket: bucketFor(`${scope}:client:${clientKey}`, limits.perClient, at),
        limit: limits.perClient,
      },
      { bucket: bucketFor(`${scope}:global`, limits.global, at), limit: limits.global },
    ];
    const exhausted = checks.filter(({ bucket, limit }) => bucket.count >= limit.max);
    if (exhausted.length > 0) {
      const resetAt = Math.max(...exhausted.map(({ bucket }) => bucket.resetAt));
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - at) / 1000)) };
    }

    for (const { bucket } of checks) {
      bucket.count += 1;
    }
    return { allowed: true };
  }

  return { take };
}
