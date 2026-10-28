import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScoreStatus } from '@/lib/leaderboard/types';

import ScoreFreshness from '../ScoreFreshness';

const refresh = vi.fn();
const router = { refresh };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const RUN = { runId: 42, asOf: '2026-10-27', publishedAt: '2026-10-28T00:41:12+00:00' };

function status(runId: number): ScoreStatus {
  return {
    latest: {
      run_id: runId,
      as_of: '2026-10-27',
      started_at: '2026-10-28T00:30:02+00:00',
      finished_at: '2026-10-28T00:41:12+00:00',
    },
    running: null,
    last_failure: null,
    next: {
      as_of: '2026-10-28',
      starts_at: '2026-10-29T00:30:00+00:00',
      eta: '2026-10-29T00:41:00+00:00',
    },
  };
}

function respondWith(body: ScoreStatus) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => body });
}

describe('ScoreFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T03:41:00Z'));
    refresh.mockReset();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the publish age from the data until the status loads, then the next update', async () => {
    let resolve: (value: unknown) => void = () => {};
    mockFetch.mockReturnValueOnce(new Promise((r) => (resolve = r)));

    render(<ScoreFreshness run={RUN} />);

    expect(
      screen.getByText('Data for Oct 27, 2026 (UTC), updated 3 hours ago.'),
    ).toBeInTheDocument();

    await act(async () => resolve({ ok: true, json: async () => status(42) }));

    expect(screen.getByText(/Next update expected around/)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes the page once a new run publishes', async () => {
    respondWith(status(42));
    respondWith(status(43));

    render(<ScoreFreshness run={RUN} />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(refresh).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
