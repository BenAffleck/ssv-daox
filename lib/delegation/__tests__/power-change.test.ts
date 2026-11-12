import { describe, expect, it } from 'vitest';

import { nextRoundPower, powerChangeOf } from '../logic/power-change';

describe('nextRoundPower', () => {
  it("scales the run's seat to a pool that grew since the run", () => {
    // Run 64 froze 299,294.73 SSV; the live pool grew to 415,595.14. ssv-score's
    // allocate() at the live pool gives each SSV Community seat 6,679.2077 SSV.
    const basis = { runEffective: 299294.7272851637, cap: 500000, livePool: 415595.1434023633 };
    expect(nextRoundPower(4810.093831368702, basis)).toBeCloseTo(6679.2077, 3);
  });

  it('allocates no more than the cap once the live pool exceeds it', () => {
    const basis = { runEffective: 250000, cap: 500000, livePool: 600000 };
    expect(nextRoundPower(10000, basis)).toBe(20000);
  });

  it("shrinks the run's seat when the pool shrank since the run", () => {
    const basis = { runEffective: 400000, cap: 500000, livePool: 300000 };
    expect(nextRoundPower(8000, basis)).toBe(6000);
  });

  it('follows the whole live pool when the run is uncapped', () => {
    const basis = { runEffective: 250000, cap: null, livePool: 600000 };
    expect(nextRoundPower(10000, basis)).toBe(24000);
  });

  it("keeps the run's seat when the live pool is unknown", () => {
    expect(nextRoundPower(4810.09, null)).toBe(4810.09);
    expect(nextRoundPower(null, null)).toBeNull();
  });

  it('allocates nothing from a run that allocated nothing', () => {
    expect(nextRoundPower(0, { runEffective: 0, cap: 500000, livePool: 415595 })).toBe(0);
  });
});

describe('powerChangeOf', () => {
  it('ignores a change of up to 50 SSV as noise', () => {
    expect(powerChangeOf(6679, 6729)).toBeNull();
    expect(powerChangeOf(6679.4, 6629.6)).toBeNull();
  });

  it('reports the delta once it exceeds the noise', () => {
    expect(powerChangeOf(6679, 6731)).toEqual({ direction: 'up', next: 6731, delta: 52 });
    expect(powerChangeOf(500, null)).toEqual({ direction: 'down', next: 0, delta: 500 });
  });

  it('reports a delegation that starts or ends, however small', () => {
    expect(powerChangeOf(30, 0)).toEqual({ direction: 'down', next: 0, delta: 30 });
    expect(powerChangeOf(0, 30)).toEqual({ direction: 'up', next: 30, delta: 30 });
  });

  it('reports nothing when the current amount is unknown', () => {
    expect(powerChangeOf(null, 500)).toBeNull();
  });
});
