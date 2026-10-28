import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REFRESH_INTERVAL_MS, REFRESH_LIMIT_MS, useRefreshWhile } from '../useRefreshWhile';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('@/lib/delegation/api/refresh-pins', () => ({ refreshPins: refresh }));

const ADDRESS = '0x1111111111111111111111111111111111111111';

describe('useRefreshWhile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes the address's pins on an interval while active", () => {
    renderHook(() => useRefreshWhile(true, ADDRESS));

    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(refresh).toHaveBeenCalledTimes(3);
    expect(refresh).toHaveBeenCalledWith(ADDRESS);
  });

  it('never refreshes while inactive', () => {
    renderHook(() => useRefreshWhile(false, ADDRESS));

    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));

    expect(refresh).not.toHaveBeenCalled();
  });

  it('stops refreshing once inactive', () => {
    const { rerender } = renderHook(({ active }) => useRefreshWhile(active, ADDRESS), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS));

    rerender({ active: false });
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('gives up after the limit and says so', () => {
    const { result } = renderHook(() => useRefreshWhile(true, ADDRESS));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));
    const calls = refresh.mock.calls.length;
    act(() => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3));

    expect(result.current).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(calls);
  });

  it('starts over when it becomes active again', () => {
    const { result, rerender } = renderHook(({ active }) => useRefreshWhile(active, ADDRESS), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(REFRESH_LIMIT_MS));

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current).toBe(false);
  });
});
