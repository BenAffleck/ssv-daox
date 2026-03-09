import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTimeRemaining } from '../utils/time-remaining';

describe('formatTimeRemaining', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return "Ended" for past timestamps', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
    expect(formatTimeRemaining(pastTimestamp)).toBe('Ended');
  });

  it('should return days and hours for multi-day remaining', () => {
    const now = Math.floor(Date.now() / 1000);
    // 2 days and 5 hours from now
    const future = now + 2 * 86400 + 5 * 3600;
    expect(formatTimeRemaining(future)).toBe('2d 5h left');
  });

  it('should return hours only when less than a day', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 12 * 3600;
    expect(formatTimeRemaining(future)).toBe('12h left');
  });

  it('should return "< 1h left" when less than an hour remains', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 1800; // 30 minutes
    expect(formatTimeRemaining(future)).toBe('< 1h left');
  });

  it('should return "1d 0h left" for exactly 1 day', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 86400;
    expect(formatTimeRemaining(future)).toBe('1d 0h left');
  });

  it('should return "Ended" for current timestamp', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeRemaining(now)).toBe('Ended');
  });
});
