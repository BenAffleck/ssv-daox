import { describe, it, expect } from 'vitest';
import { EventSource, SerializedEvent } from '../types';
import {
  BUCKET_COUNT,
  MAX_MONTH_TICKS,
  MIN_FUTURE_DAYS,
  MIN_PAST_DAYS,
  buildHistogram,
  buildMonthTicks,
  clampRange,
  computeDomain,
  filterByDayRange,
  formatRangeLabel,
  formatRelativeLabel,
  fromDayOffset,
  getDefaultRange,
  getPresets,
  isImminentOffset,
  isPastOffset,
  isPresetActive,
  peakCount,
  resolveInitialRange,
  toDayOffset,
  toFraction,
  toOffset,
} from '../logic/range-brush';

/** Fixed reference so the suite never depends on the wall clock. */
const TODAY = new Date(2026, 7, 19); // Aug 19, 2026

function makeEvent(dayOffset: number, id = `e${dayOffset}`): SerializedEvent {
  const date = fromDayOffset(dayOffset, TODAY);
  return {
    id,
    sourceId: 'main-calendar',
    title: `Event ${id}`,
    description: null,
    startDate: date.toISOString(),
    endDate: null,
    isAllDay: false,
    source: EventSource.ICS,
    sourceName: 'DAO Calendar',
    sourceUrl: null,
    location: null,
    isRecurring: false,
    recurrenceId: null,
    recurrence: null,
    metadata: {},
  };
}

describe('range-brush', () => {
  describe('toDayOffset', () => {
    it('returns 0 for any time on the same day', () => {
      expect(toDayOffset(new Date(2026, 7, 19, 23, 59), TODAY)).toBe(0);
      expect(toDayOffset(new Date(2026, 7, 19, 0, 1), TODAY)).toBe(0);
    });

    it('counts whole days forward and back', () => {
      expect(toDayOffset(new Date(2026, 7, 20), TODAY)).toBe(1);
      expect(toDayOffset(new Date(2026, 7, 18), TODAY)).toBe(-1);
      expect(toDayOffset(new Date(2026, 8, 18), TODAY)).toBe(30);
    });

    it('survives a daylight-saving boundary', () => {
      // US DST ends Nov 1, 2026; the raw quotient is fractional across it.
      expect(toDayOffset(new Date(2026, 10, 15), TODAY)).toBe(88);
    });

    it('round-trips through fromDayOffset', () => {
      for (const offset of [-49, -1, 0, 1, 63, 134]) {
        expect(toDayOffset(fromDayOffset(offset, TODAY), TODAY)).toBe(offset);
      }
    });
  });

  describe('computeDomain', () => {
    it('falls back to the minimum window with no events', () => {
      const domain = computeDomain([], TODAY);
      expect(domain.min).toBeLessThanOrEqual(-MIN_PAST_DAYS);
      expect(domain.max).toBeGreaterThanOrEqual(MIN_FUTURE_DAYS);
    });

    it('snaps to whole months', () => {
      const domain = computeDomain([], TODAY);
      expect(fromDayOffset(domain.min, TODAY).getDate()).toBe(1);
      const last = fromDayOffset(domain.max, TODAY);
      const dayAfter = fromDayOffset(domain.max + 1, TODAY);
      expect(dayAfter.getMonth()).not.toBe(last.getMonth());
    });

    it('stretches to cover events beyond the minimum window', () => {
      const domain = computeDomain([makeEvent(-200), makeEvent(400)], TODAY);
      expect(domain.min).toBeLessThanOrEqual(-200);
      expect(domain.max).toBeGreaterThanOrEqual(400);
    });

    it('is not narrowed by events inside the minimum window', () => {
      const wide = computeDomain([], TODAY);
      const narrow = computeDomain([makeEvent(0), makeEvent(3)], TODAY);
      expect(narrow).toEqual(wide);
    });
  });

  describe('clampRange', () => {
    const domain = { min: -49, max: 134 };

    it('pulls both edges inside the domain', () => {
      expect(clampRange({ from: -500, to: 500 }, domain)).toEqual({
        from: -49,
        to: 134,
      });
    });

    it('keeps the range at least one day wide', () => {
      const range = clampRange({ from: 10, to: 10 }, domain);
      expect(range.to).toBeGreaterThan(range.from);
    });

    it('leaves a valid range untouched', () => {
      expect(clampRange({ from: -14, to: 30 }, domain)).toEqual({
        from: -14,
        to: 30,
      });
    });

    it('clamps the default range into a narrow domain', () => {
      const narrow = { min: -2, max: 5 };
      const range = clampRange(getDefaultRange(), narrow);
      expect(range.from).toBeGreaterThanOrEqual(narrow.min);
      expect(range.to).toBeLessThanOrEqual(narrow.max);
      expect(range.to).toBeGreaterThan(range.from);
    });
  });

  describe('toFraction / toOffset', () => {
    const domain = { min: -50, max: 150 };

    it('maps the domain edges to 0 and 1', () => {
      expect(toFraction(-50, domain)).toBe(0);
      expect(toFraction(150, domain)).toBe(1);
    });

    it('clamps out-of-domain offsets', () => {
      expect(toFraction(-999, domain)).toBe(0);
      expect(toFraction(999, domain)).toBe(1);
    });

    it('round-trips', () => {
      for (const offset of [-50, -13, 0, 42, 150]) {
        expect(toOffset(toFraction(offset, domain), domain)).toBe(offset);
      }
    });

    it('is safe on a degenerate domain', () => {
      expect(toFraction(5, { min: 3, max: 3 })).toBe(0);
    });
  });

  describe('buildHistogram', () => {
    const domain = { min: -49, max: 134 };

    it('produces the requested bucket count', () => {
      expect(buildHistogram([], domain, TODAY)).toHaveLength(BUCKET_COUNT);
    });

    it('counts every event inside the domain', () => {
      const events = [makeEvent(-12), makeEvent(0), makeEvent(1), makeEvent(96)];
      const total = buildHistogram(events, domain, TODAY).reduce(
        (sum, bucket) => sum + bucket.count,
        0
      );
      expect(total).toBe(events.length);
    });

    it('drops events outside the domain', () => {
      const total = buildHistogram([makeEvent(500)], domain, TODAY).reduce(
        (sum, bucket) => sum + bucket.count,
        0
      );
      expect(total).toBe(0);
    });

    it('puts same-day events in the same bucket', () => {
      const buckets = buildHistogram(
        [makeEvent(4, 'a'), makeEvent(4, 'b')],
        domain,
        TODAY
      );
      const filled = buckets.filter((bucket) => bucket.count > 0);
      expect(filled).toHaveLength(1);
      expect(filled[0].count).toBe(2);
    });

    it('spreads events across buckets in date order', () => {
      const buckets = buildHistogram(
        [makeEvent(-40), makeEvent(0), makeEvent(120)],
        domain,
        TODAY
      );
      const filled = buckets
        .map((bucket, index) => ({ index, count: bucket.count }))
        .filter((bucket) => bucket.count > 0)
        .map((bucket) => bucket.index);
      expect(filled).toHaveLength(3);
      expect([...filled].sort((a, b) => a - b)).toEqual(filled);
    });

    it('returns nothing for a degenerate domain', () => {
      expect(buildHistogram([], { min: 5, max: 5 }, TODAY)).toEqual([]);
    });

    it('reports a peak of at least 1', () => {
      expect(peakCount([])).toBe(1);
      expect(peakCount(buildHistogram([makeEvent(0)], domain, TODAY))).toBe(1);
    });
  });

  describe('buildMonthTicks', () => {
    it('emits one tick per month inside the domain', () => {
      const ticks = buildMonthTicks({ min: -49, max: 134 }, TODAY);
      expect(ticks.map((tick) => tick.label)).toEqual([
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]);
    });

    it('keeps every tick inside the domain', () => {
      const domain = { min: -49, max: 134 };
      for (const tick of buildMonthTicks(domain, TODAY)) {
        expect(tick.offset).toBeGreaterThanOrEqual(domain.min);
        expect(tick.offset).toBeLessThanOrEqual(domain.max);
      }
    });

    it('disambiguates January with the year', () => {
      const ticks = buildMonthTicks({ min: -49, max: 200 }, TODAY);
      expect(ticks.some((tick) => tick.label === "Jan '27")).toBe(true);
    });

    it('thins the ticks rather than colliding them on a long domain', () => {
      // The real DAO calendar spans ~2.4 years of history.
      const ticks = buildMonthTicks({ min: -900, max: 120 }, TODAY);
      expect(ticks.length).toBeLessThanOrEqual(MAX_MONTH_TICKS);
      expect(ticks.length).toBeGreaterThan(2);
    });

    it('falls back to bare years on a multi-year domain', () => {
      const ticks = buildMonthTicks({ min: -3650, max: 365 }, TODAY);
      expect(ticks.length).toBeLessThanOrEqual(MAX_MONTH_TICKS);
      expect(ticks.every((tick) => /^\d{4}$/.test(tick.label))).toBe(true);
    });

    it('keeps ticks ordered and inside a long domain', () => {
      const domain = { min: -900, max: 120 };
      const ticks = buildMonthTicks(domain, TODAY);
      const offsets = ticks.map((tick) => tick.offset);
      expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
      expect(Math.min(...offsets)).toBeGreaterThanOrEqual(domain.min);
      expect(Math.max(...offsets)).toBeLessThanOrEqual(domain.max);
    });

    it('returns nothing for a degenerate domain', () => {
      expect(buildMonthTicks({ min: 4, max: 4 }, TODAY)).toEqual([]);
    });
  });

  describe('resolveInitialRange', () => {
    const domain = { min: -49, max: 134 };

    it('opens on the near-term window when it holds events', () => {
      const range = resolveInitialRange(domain, [makeEvent(3)], TODAY);
      expect(range).toEqual({ from: -14, to: 30 });
    });

    it('opens on the whole domain when the near-term window is empty', () => {
      // Mirrors the live calendar: every event is months in the past.
      const range = resolveInitialRange(domain, [makeEvent(-40)], TODAY);
      expect(range).toEqual({ from: domain.min, to: domain.max });
    });

    it('opens on the whole domain when there are no events at all', () => {
      expect(resolveInitialRange(domain, [], TODAY)).toEqual({
        from: domain.min,
        to: domain.max,
      });
    });

    it('always returns a range inside the domain', () => {
      const narrow = { min: -3, max: 4 };
      const range = resolveInitialRange(narrow, [makeEvent(-40)], TODAY);
      expect(range.from).toBeGreaterThanOrEqual(narrow.min);
      expect(range.to).toBeLessThanOrEqual(narrow.max);
    });
  });

  describe('filterByDayRange', () => {
    const events = [makeEvent(-12), makeEvent(-1), makeEvent(0), makeEvent(30)];

    it('keeps events on both boundaries', () => {
      const kept = filterByDayRange(events, { from: -12, to: 30 }, TODAY);
      expect(kept).toHaveLength(4);
    });

    it('excludes events outside the range', () => {
      const kept = filterByDayRange(events, { from: 0, to: 7 }, TODAY);
      expect(kept.map((event) => event.id)).toEqual(['e0']);
    });
  });

  describe('labels', () => {
    it('names the days around today', () => {
      expect(formatRelativeLabel(0)).toBe('today');
      expect(formatRelativeLabel(1)).toBe('tomorrow');
      expect(formatRelativeLabel(-1)).toBe('yesterday');
      expect(formatRelativeLabel(9)).toBe('in 9 days');
      expect(formatRelativeLabel(-12)).toBe('12 days ago');
    });

    it('formats a range', () => {
      expect(formatRangeLabel({ from: 0, to: 30 }, TODAY)).toBe('Aug 19 – Sep 18');
    });
  });

  describe('offset predicates', () => {
    it('separates past from upcoming', () => {
      expect(isPastOffset(-1)).toBe(true);
      expect(isPastOffset(0)).toBe(false);
    });

    it('treats today and tomorrow as imminent', () => {
      expect(isImminentOffset(0)).toBe(true);
      expect(isImminentOffset(1)).toBe(true);
      expect(isImminentOffset(2)).toBe(false);
      expect(isImminentOffset(-1)).toBe(false);
    });
  });

  describe('presets', () => {
    const domain = { min: -49, max: 134 };

    it('spans the whole domain for "All"', () => {
      const all = getPresets(domain).find((preset) => preset.id === 'all');
      expect(all).toMatchObject({ from: domain.min, to: domain.max });
    });

    it('detects the active preset', () => {
      const [past90] = getPresets(domain);
      expect(isPresetActive(past90, { from: past90.from, to: past90.to })).toBe(true);
      expect(isPresetActive(past90, { from: 0, to: 30 })).toBe(false);
    });

    it('offers the near, half-year and year windows', () => {
      const wide = { min: -120, max: 400 };
      expect(
        getPresets(wide).map((preset) => [preset.label, preset.from, preset.to])
      ).toEqual([
        ['Past 90d', -90, 0],
        ['Next 30d', 0, 30],
        ['Next 180d', 0, 180],
        ['Next 12 months', 0, 365],
        ['All', wide.min, wide.max],
      ]);
    });

    it('clamps presets that overshoot a short axis', () => {
      const short = { min: -49, max: 103 };
      for (const preset of getPresets(short)) {
        expect(preset.from).toBeGreaterThanOrEqual(short.min);
        expect(preset.to).toBeLessThanOrEqual(short.max);
      }
    });

    it('keeps a clamped preset matchable, so it can read as active', () => {
      const short = { min: -49, max: 103 };
      const yearly = getPresets(short).find(
        (preset) => preset.id === 'next-12-months'
      )!;
      expect(yearly.to).toBe(short.max);
      expect(
        isPresetActive(yearly, clampRange({ from: 0, to: 365 }, short))
      ).toBe(true);
    });
  });
});
