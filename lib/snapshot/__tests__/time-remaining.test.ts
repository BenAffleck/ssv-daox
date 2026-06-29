import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTimeRemaining, formatTimeUntilStart, formatTimeAgo } from '../utils/time-remaining';

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

describe('formatTimeUntilStart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return "Starting soon" for past timestamps', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
    expect(formatTimeUntilStart(pastTimestamp)).toBe('Starting soon');
  });

  it('should return days and hours for multi-day until start', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 2 * 86400 + 5 * 3600;
    expect(formatTimeUntilStart(future)).toBe('Starts in 2d 5h');
  });

  it('should return hours only when less than a day', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 12 * 3600;
    expect(formatTimeUntilStart(future)).toBe('Starts in 12h');
  });

  it('should return "Starts in < 1h" when less than an hour remains', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 1800;
    expect(formatTimeUntilStart(future)).toBe('Starts in < 1h');
  });

  it('should return "Starts in 1d 0h" for exactly 1 day', () => {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 86400;
    expect(formatTimeUntilStart(future)).toBe('Starts in 1d 0h');
  });

  it('should return "Starting soon" for current timestamp', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeUntilStart(now)).toBe('Starting soon');
  });
});

describe('formatTimeAgo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return days ago for multi-day-old timestamps', () => {
    const now = Math.floor(Date.now() / 1000);
    const past = now - (2 * 86400 + 5 * 3600);
    expect(formatTimeAgo(past)).toBe('Ended 2d ago');
  });

  it('should return hours ago when less than a day old', () => {
    const now = Math.floor(Date.now() / 1000);
    const past = now - 12 * 3600;
    expect(formatTimeAgo(past)).toBe('Ended 12h ago');
  });

  it('should return "Ended just now" when less than an hour old', () => {
    const now = Math.floor(Date.now() / 1000);
    const past = now - 600; // 10 minutes
    expect(formatTimeAgo(past)).toBe('Ended just now');
  });

  it('should return "Ended just now" for future timestamps', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now + 3600)).toBe('Ended just now');
  });
});
