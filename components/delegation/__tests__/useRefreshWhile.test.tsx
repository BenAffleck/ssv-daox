import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REFRESH_INTERVAL_MS, REFRESH_LIMIT_MS, useRefreshWhile } from '../useRefreshWhile';

const refresh = vi.fn();
// The app router is the same object on every render.
const router = { refresh };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

describe('useRefreshWhile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the page on an interval while active', () => {
    renderHook(() => useRefreshWhile(true));

    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it('never refreshes while inactive', () => {
    renderHook(() => useRefreshWhile(false));

    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));

    expect(refresh).not.toHaveBeenCalled();
  });

  it('stops refreshing once inactive', () => {
    const { rerender } = renderHook(({ active }) => useRefreshWhile(active), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS));

    rerender({ active: false });
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('gives up after the limit and says so', () => {
    const { result } = renderHook(() => useRefreshWhile(true));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));
    const calls = refresh.mock.calls.length;
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(result.current).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(calls);
  });

  it('starts over when it becomes active again', () => {
    const { result, rerender } = renderHook(({ active }) => useRefreshWhile(active), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current).toBe(false);
  });
});
