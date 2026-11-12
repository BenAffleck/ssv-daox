import { NEXT_ROUND_MIN_CHANGE_SSV } from '../config';

export interface PowerChange {
  direction: 'up' | 'down';
  /** Whole SSV the next run allocates; 0 when the delegation ends. */
  next: number;
  /** Whole SSV the delegation grows or shrinks by, always positive. */
  delta: number;
}

export interface PoolBasis {
  /** The pool power the latest run allocated: its pool, up to its cap. */
  runEffective: number;
  /** The latest run's cap; `null` when uncapped. */
  cap: number | null;
  /** The pool's live Snapshot power. */
  livePool: number;
}

/**
 * The run's seat power at the live pool. The Safe delegates by ratio, so Snapshot splits
 * whatever the pool holds when it reads it; this matches the Score API's `safe-batch?pool=`.
 * Unscaled when the live pool is unknown (`basis` is `null`).
 */
export function nextRoundPower(runPower: number | null, basis: PoolBasis | null): number | null {
  if (runPower === null || basis === null || basis.runEffective === 0) {
    return runPower;
  }
  const live = basis.cap === null ? basis.livePool : Math.min(basis.livePool, basis.cap);
  return (runPower * live) / basis.runEffective;
}

/**
 * What the next score run changes about the DAO's delegation to an address. `null` when nothing
 * changes beyond `NEXT_ROUND_MIN_CHANGE_SSV`, or when the current amount is unknown. A delegation
 * that starts or ends is always a change.
 */
export function powerChangeOf(current: number | null, next: number | null): PowerChange | null {
  if (current === null) {
    return null;
  }
  const from = Math.round(current);
  const to = Math.round(next ?? 0);
  const startsOrEnds = (from === 0) !== (to === 0);
  if (!startsOrEnds && Math.abs(to - from) <= NEXT_ROUND_MIN_CHANGE_SSV) {
    return null;
  }
  return { direction: to > from ? 'up' : 'down', next: to, delta: Math.abs(to - from) };
}
