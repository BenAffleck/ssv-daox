/**
 * Unit tests for the Q&A rate limiter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, getClientKey, resetRateLimits } from '../rate-limit';
import { getRateLimitConfig } from '../config';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.AI_QNA_RATE_LIMIT_PER_WINDOW;
  });

  it('allows requests up to the configured cap', () => {
    const { maxRequests } = getRateLimitConfig();

    for (let i = 0; i < maxRequests; i++) {
      expect(checkRateLimit('client-a').allowed).toBe(true);
    }
  });

  it('blocks the request past the cap and reports a retry delay', () => {
    const { maxRequests } = getRateLimitConfig();
    for (let i = 0; i < maxRequests; i++) checkRateLimit('client-a');

    const result = checkRateLimit('client-a');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('counts down the remaining allowance', () => {
    const { maxRequests } = getRateLimitConfig();

    expect(checkRateLimit('client-a').remaining).toBe(maxRequests - 1);
    expect(checkRateLimit('client-a').remaining).toBe(maxRequests - 2);
  });

  it('tracks clients independently', () => {
    const { maxRequests } = getRateLimitConfig();
    for (let i = 0; i < maxRequests; i++) checkRateLimit('client-a');

    expect(checkRateLimit('client-a').allowed).toBe(false);
    expect(checkRateLimit('client-b').allowed).toBe(true);
  });

  it('resets once the window has elapsed', () => {
    const { maxRequests, windowMs } = getRateLimitConfig();
    for (let i = 0; i < maxRequests; i++) checkRateLimit('client-a');
    expect(checkRateLimit('client-a').allowed).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    expect(checkRateLimit('client-a').allowed).toBe(true);
  });

  it('honours an env-configured cap', () => {
    process.env.AI_QNA_RATE_LIMIT_PER_WINDOW = '2';

    expect(checkRateLimit('client-c').allowed).toBe(true);
    expect(checkRateLimit('client-c').allowed).toBe(true);
    expect(checkRateLimit('client-c').allowed).toBe(false);
  });

  it('falls back to the default cap for an invalid env value', () => {
    process.env.AI_QNA_RATE_LIMIT_PER_WINDOW = 'not-a-number';

    expect(getRateLimitConfig().maxRequests).toBe(10);
  });
});

describe('getClientKey', () => {
  it('uses the left-most x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' });
    expect(getClientKey(headers)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    expect(getClientKey(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('falls back to a shared bucket when no client header is present', () => {
    expect(getClientKey(new Headers())).toBe('unknown');
  });
});
