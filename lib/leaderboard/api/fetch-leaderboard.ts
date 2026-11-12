import type { PoolBasis } from '@/lib/delegation/logic/power-change';

import { DELEGATE_SCORE_CONFIG } from '../config';
import type { Leaderboard, ScoreRow, ScoreStatus } from '../types';

/** Tags every cached run read, so a new run can expire them together. */
export const SCORE_DATA_TAG = 'delegate-score-data';

interface LeaderboardPage {
  run_id: number;
  as_of: string;
  published_at: string;
  rows: ScoreRow[];
}

interface AllocationSummary {
  run_id: number;
  /** `null` when the run is uncapped. */
  cap: number | null;
  /** The pool power the run allocates: its pool, up to its cap. */
  effective: number;
}

/** The latest run's side of a `PoolBasis`; the live pool comes from Snapshot. */
export type RunBasis = Omit<PoolBasis, 'livePool'>;

async function getJson<T>(
  path: string,
  cache: RequestInit = {
    next: { revalidate: DELEGATE_SCORE_CONFIG.cacheSeconds, tags: [SCORE_DATA_TAG] },
  },
): Promise<T> {
  const response = await fetch(`${DELEGATE_SCORE_CONFIG.apiBaseUrl}${path}`, cache);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
    const detail = typeof body?.detail === 'string' ? body.detail : response.statusText;
    throw new Error(`Delegate Score API ${path} returned ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetches every leaderboard row of the latest run.
 *
 * Pages after the first are pinned to the first page's `as_of`. A re-run of
 * that day while paging would mix runs, so it fails instead.
 */
export async function fetchLeaderboard(): Promise<Leaderboard> {
  const { pageSize } = DELEGATE_SCORE_CONFIG;
  const first = await getJson<LeaderboardPage>(`/v1/leaderboard?limit=${pageSize}&offset=0`);
  const rows = [...first.rows];

  let last = first;
  while (last.rows.length === pageSize) {
    const params = `as_of=${first.as_of}&limit=${pageSize}&offset=${rows.length}`;
    last = await getJson<LeaderboardPage>(`/v1/leaderboard?${params}`);
    if (last.run_id !== first.run_id) {
      throw new Error(
        `Delegate Score run changed from ${first.run_id} to ${last.run_id} while paging`,
      );
    }
    rows.push(...last.rows);
  }

  return { runId: first.run_id, asOf: first.as_of, publishedAt: first.published_at, rows };
}

/** The latest, running, failed and next run. Cached for 30 seconds across visitors. */
export async function fetchScoreStatus(): Promise<ScoreStatus> {
  return getJson<ScoreStatus>('/v1/status', { next: { revalidate: 30 } });
}

/** The run the cached score data was read from. */
export async function fetchCachedRunId(): Promise<number> {
  const { run_id } = await getJson<AllocationSummary>('/v1/allocation');
  return run_id;
}

/** The latest run's cap (`null` when uncapped) and the pool power it allocated. */
export async function fetchAllocationBasis(): Promise<RunBasis> {
  const { cap, effective } = await getJson<AllocationSummary>('/v1/allocation');
  if (typeof cap !== 'number' && cap !== null) {
    throw new Error('Delegate Score API /v1/allocation returned no cap');
  }
  if (typeof effective !== 'number') {
    throw new Error('Delegate Score API /v1/allocation returned no effective pool');
  }
  return { cap, runEffective: effective };
}
