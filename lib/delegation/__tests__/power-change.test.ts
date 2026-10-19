import { describe, expect, it } from 'vitest';

import { powerChangeOf } from '../logic/power-change';

describe('powerChangeOf', () => {
  it('ignores a 1 SSV gap as rounding noise', () => {
    expect(powerChangeOf(500, 501)).toBeNull();
    expect(powerChangeOf(500.4, 499.4)).toBeNull();
  });

  it('reports the delta once it exceeds the noise', () => {
    expect(powerChangeOf(500, 502)).toEqual({ direction: 'up', next: 502, delta: 2 });
    expect(powerChangeOf(500, null)).toEqual({ direction: 'down', next: 0, delta: 500 });
  });

  it('reports nothing when the current amount is unknown', () => {
    expect(powerChangeOf(null, 500)).toBeNull();
  });
});
