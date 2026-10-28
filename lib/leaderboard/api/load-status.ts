import type { ScoreStatus } from '../types';

/** Client side: the score status via `/api/score-status`. `null` when it is unavailable. */
export async function loadScoreStatus(): Promise<ScoreStatus | null> {
  try {
    const response = await fetch('/api/score-status', { cache: 'no-store' });
    return response.ok ? ((await response.json()) as ScoreStatus) : null;
  } catch {
    return null;
  }
}
