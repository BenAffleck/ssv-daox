import { describe, expect, it } from 'vitest';

import { getDateLabel, getShortDateLabel } from '../utils/date-utils';

/** Fixed reference so the suite never depends on the wall clock. */
const TODAY = new Date(2026, 7, 19); // Wed, Aug 19, 2026

describe('day labels', () => {
  it('spells out a day in full for wide screens', () => {
    expect(getDateLabel(new Date(2026, 10, 4), TODAY)).toBe('Wednesday, November 4, 2026');
  });

  it('abbreviates weekday and month so a day header fits a phone row', () => {
    expect(getShortDateLabel(new Date(2026, 10, 4), TODAY)).toBe('Wed, Nov 4, 2026');
  });

  it('names today and tomorrow relative to the given reference day', () => {
    const later = new Date(2026, 7, 19, 23, 30);
    const tomorrow = new Date(2026, 7, 20, 9, 0);

    expect(getDateLabel(later, TODAY)).toBe('Today');
    expect(getShortDateLabel(later, TODAY)).toBe('Today');
    expect(getDateLabel(tomorrow, TODAY)).toBe('Tomorrow');
    expect(getShortDateLabel(tomorrow, TODAY)).toBe('Tomorrow');
  });
});
