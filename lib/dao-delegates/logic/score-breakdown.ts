import { PILLAR_LABELS } from '../config';
import type { PillarKey, ScoreRow } from '../types';

const PILLAR_KEYS: PillarKey[] = ['community', 'holdings', 'votes'];

export interface PillarBreakdown {
  key: PillarKey;
  label: string;
  /** 0 to 100, unrounded. */
  score: number;
  /** The pillar had no data for this delegate; shown as "n/a". */
  missing: boolean;
  /** What the pillar counted, when the run says. */
  note: string | null;
}

export interface ScoreBreakdown {
  /** `null` when no pillar is live. */
  score: number | null;
  rank: number | null;
  pillars: PillarBreakdown[];
}

function noteOf(key: PillarKey, row: ScoreRow): string | null {
  if (key === 'votes' && row.voted_count !== null && row.proposal_count !== null) {
    return `${row.voted_count} of ${row.proposal_count} proposals`;
  }
  return null;
}

/**
 * The address's score split into the run's live pillars. A pillar is live when any row
 * has a value for it, as on the leaderboard. `null` when the address has no row.
 */
export function scoreBreakdownOf(
  row: ScoreRow | undefined,
  rows: ScoreRow[],
): ScoreBreakdown | null {
  if (!row) {
    return null;
  }
  const pillars = PILLAR_KEYS.flatMap((key) => {
    const score = row[key];
    const live = rows.some((r) => r[key] !== null);
    if (!live || score === null) {
      return [];
    }
    return [
      {
        key,
        label: PILLAR_LABELS[key],
        score,
        missing: row[`missing_${key}`],
        note: noteOf(key, row),
      },
    ];
  });
  return { score: row.score, rank: row.rank, pillars };
}
