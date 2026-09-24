import { DELEGATE_SCORE_CONFIG } from '../config';
import type { Leaderboard, ScoreHealth, ScoreRow } from '../types';

interface LeaderboardPage {
  run_id: number;
  as_of: string;
  rows: ScoreRow[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DELEGATE_SCORE_CONFIG.apiBaseUrl}${path}`, {
    next: { revalidate: DELEGATE_SCORE_CONFIG.cacheSeconds },
  });

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

  return { runId: first.run_id, asOf: first.as_of, rows };
}

/**
 * Fetches data freshness. `/health` answers 503 with the same body when the
 * data is stale or absent. Returns `null` when the API is unreachable.
 */
export async function fetchScoreHealth(): Promise<ScoreHealth | null> {
  try {
    const response = await fetch(`${DELEGATE_SCORE_CONFIG.apiBaseUrl}/health`, {
      next: { revalidate: DELEGATE_SCORE_CONFIG.cacheSeconds },
    });
    if (!response.ok && response.status !== 503) {
      return null;
    }
    return (await response.json()) as ScoreHealth;
  } catch (error) {
    console.error('[Delegate Score API] Health check failed:', error);
    return null;
  }
}
