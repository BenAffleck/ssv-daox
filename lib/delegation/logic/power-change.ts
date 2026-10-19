export interface PowerChange {
  direction: 'up' | 'down';
  /** Whole SSV the next run allocates; 0 when the delegation ends. */
  next: number;
  /** Whole SSV the delegation grows or shrinks by, always positive. */
  delta: number;
}

/** Changes up to this many SSV are allocation rounding noise, not a change. */
const NOISE_SSV = 1;

/**
 * What the next score run changes about the DAO's delegation to an address. `null` when nothing
 * changes beyond rounding noise, or when the current amount is unknown.
 */
export function powerChangeOf(current: number | null, next: number | null): PowerChange | null {
  if (current === null) {
    return null;
  }
  const from = Math.round(current);
  const to = Math.round(next ?? 0);
  if (Math.abs(to - from) <= NOISE_SSV) {
    return null;
  }
  return { direction: to > from ? 'up' : 'down', next: to, delta: Math.abs(to - from) };
}
