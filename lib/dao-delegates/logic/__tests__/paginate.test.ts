import { describe, expect, it } from 'vitest';

import { paginate } from '../paginate';

const items = Array.from({ length: 5 }, (_, i) => i + 1);

describe('paginate', () => {
  it('returns the requested slice and page count', () => {
    expect(paginate(items, 2, 2)).toEqual({ items: [3, 4], page: 2, totalPages: 3 });
  });

  it('clamps an out-of-range page', () => {
    expect(paginate(items, 99, 2).items).toEqual([5]);
    expect(paginate(items, 0, 2).page).toBe(1);
  });

  it('reports one page for an empty list', () => {
    expect(paginate([], 1, 2)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
