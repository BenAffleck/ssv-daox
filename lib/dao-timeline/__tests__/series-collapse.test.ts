import { describe, expect, it } from 'vitest';

import { buildSeriesInfo } from '../logic/recurrence-expander';
import {
  collapseSeriesAroundToday,
  collapseSeriesInRange,
  resolveAnchor,
} from '../logic/series-collapse';
import { EventSource, SerializedEvent } from '../types';
import { formatYMD, startOfDay } from '../utils/date-utils';

const TODAY = startOfDay(new Date(2026, 2, 18)); // Wed 18 Mar 2026

function event(overrides: Partial<SerializedEvent> = {}): SerializedEvent {
  return {
    id: 'main-calendar-evt',
    sourceId: 'main-calendar',
    title: 'Community Call',
    description: null,
    startDate: new Date(2026, 0, 7, 15, 0).toISOString(), // Wed 7 Jan, 15:00
    endDate: new Date(2026, 0, 7, 16, 0).toISOString(),
    isAllDay: false,
    source: EventSource.ICS,
    sourceName: 'DAO Calendar',
    sourceUrl: null,
    location: null,
    isRecurring: false,
    recurrenceId: null,
    recurrence: null,
    metadata: {},
    ...overrides,
  };
}

/** A weekly Wednesday series seeded well before TODAY. */
function weekly(overrides: Partial<SerializedEvent> = {}): SerializedEvent {
  return event({
    isRecurring: true,
    recurrenceId: 'evt',
    recurrence: buildSeriesInfo('FREQ=WEEKLY;BYDAY=WE'),
    ...overrides,
  });
}

const days = (events: SerializedEvent[]) => events.map((e) => formatYMD(new Date(e.startDate)));

describe('resolveAnchor', () => {
  it('anchors at today when the range spans it', () => {
    expect(resolveAnchor({ from: -14, to: 30 }, TODAY)).toEqual(TODAY);
  });

  it('anchors at the range start for a window entirely in the future', () => {
    expect(resolveAnchor({ from: 60, to: 90 }, TODAY)).toEqual(new Date(2026, 4, 17));
  });

  it('anchors at the range end for a window entirely in the past', () => {
    expect(resolveAnchor({ from: -90, to: -30 }, TODAY)).toEqual(new Date(2026, 1, 16));
  });
});

describe('collapseSeriesInRange', () => {
  it('reduces a weekly series to its most recent and next occurrence', () => {
    const result = collapseSeriesInRange([weekly()], { from: -14, to: 30 }, TODAY);

    // Ten weeks of the series fall in this window; only two may show.
    expect(days(result)).toEqual(['2026-03-18', '2026-03-25']);
  });

  it('marks each occurrence with its role and its sibling', () => {
    const [previous, next] = collapseSeriesInRange([weekly()], { from: -14, to: 30 }, TODAY);

    expect(previous.occurrence).toEqual({
      role: 'previous',
      siblingDate: next.startDate,
    });
    expect(next.occurrence).toEqual({
      role: 'next',
      siblingDate: previous.startDate,
    });
  });

  it('gives each occurrence a stable id derived from its day', () => {
    const result = collapseSeriesInRange([weekly()], { from: -14, to: 30 }, TODAY);

    expect(result.map((e) => e.id)).toEqual([
      'main-calendar-evt::2026-03-18',
      'main-calendar-evt::2026-03-25',
    ]);
  });

  it('preserves the seed occurrence duration', () => {
    const [previous] = collapseSeriesInRange([weekly()], { from: -14, to: 30 }, TODAY);

    const start = new Date(previous.startDate);
    const end = new Date(previous.endDate!);
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
    expect(start.getHours()).toBe(15);
  });

  it('shows the series inside a window that starts months ahead', () => {
    // The whole point of anchoring to the range: brushing forward must not
    // leave the series invisible just because today is far behind. The window
    // opens on a Sunday, so the first Wednesday inside it is all there is.
    const result = collapseSeriesInRange([weekly()], { from: 60, to: 90 }, TODAY);

    expect(days(result)).toEqual(['2026-05-20']);
  });

  it("pairs the occurrences when one lands on a future window's first day", () => {
    // 63 days out is Wed 20 May, an occurrence — so it anchors the window and
    // the following week supplies the "next" card.
    const result = collapseSeriesInRange([weekly()], { from: 63, to: 90 }, TODAY);

    expect(days(result)).toEqual(['2026-05-20', '2026-05-27']);
  });

  it('shows the last occurrence of a window entirely in the past', () => {
    // Anchored at the window's end (Mon 16 Feb), the newest Wednesday behind
    // it is 11 Feb, and nothing follows inside the window.
    const result = collapseSeriesInRange([weekly()], { from: -60, to: -30 }, TODAY);

    expect(days(result)).toEqual(['2026-02-11']);
  });

  it('keeps every returned occurrence inside the range', () => {
    const range = { from: 60, to: 90 };
    const result = collapseSeriesInRange([weekly()], range, TODAY);

    for (const occurrence of result) {
      const offset = Math.round(
        (startOfDay(new Date(occurrence.startDate)).getTime() - TODAY.getTime()) / 86_400_000,
      );
      expect(offset).toBeGreaterThanOrEqual(range.from);
      expect(offset).toBeLessThanOrEqual(range.to);
    }
  });

  it('never resurrects a series past its COUNT', () => {
    const finished = weekly({
      recurrence: buildSeriesInfo('FREQ=WEEKLY;BYDAY=WE;COUNT=3'),
    });

    // Three occurrences from 7 Jan, so the series ended on 21 Jan.
    expect(collapseSeriesInRange([finished], { from: -14, to: 30 }, TODAY)).toEqual([]);
  });

  it('skips an occurrence cancelled by EXDATE', () => {
    const withException = weekly({
      recurrence: {
        ...buildSeriesInfo('FREQ=WEEKLY;BYDAY=WE')!,
        exceptions: ['2026-03-25'],
      },
    });

    expect(days(collapseSeriesInRange([withException], { from: -14, to: 30 }, TODAY))).toEqual([
      '2026-03-18',
      '2026-04-01',
    ]);
  });

  it('passes one-off events through, filtered to the range', () => {
    const inside = event({ id: 'a', startDate: new Date(2026, 2, 20).toISOString() });
    const outside = event({ id: 'b', startDate: new Date(2026, 6, 1).toISOString() });

    const result = collapseSeriesInRange([inside, outside], { from: -14, to: 30 }, TODAY);

    expect(result.map((e) => e.id)).toEqual(['a']);
    expect(result[0].occurrence).toBeUndefined();
  });

  it('leaves an event with an unparseable rule as a plain one-off', () => {
    const broken = event({
      isRecurring: true,
      startDate: new Date(2026, 2, 20).toISOString(),
      recurrence: { rrule: 'NONSENSE', summary: '', exceptions: [] },
    });

    expect(days(collapseSeriesInRange([broken], { from: -14, to: 30 }, TODAY))).toEqual([
      '2026-03-20',
    ]);
  });
});

describe('collapseSeriesAroundToday', () => {
  it('agrees with the range collapse when the range spans today', () => {
    const around = collapseSeriesAroundToday([weekly()], TODAY);
    const inRange = collapseSeriesInRange([weekly()], { from: -14, to: 30 }, TODAY);

    expect(days(around)).toEqual(days(inRange));
  });

  it('does not move when the range does', () => {
    // The histogram and axis are built from this, so it must not reshape
    // while the brush is dragged.
    const first = collapseSeriesAroundToday([weekly()], TODAY);
    const second = collapseSeriesAroundToday([weekly()], TODAY);

    expect(days(first)).toEqual(days(second));
  });

  it('keeps one-off events regardless of how far out they are', () => {
    const distant = event({
      id: 'far',
      startDate: new Date(2027, 5, 1).toISOString(),
    });

    expect(collapseSeriesAroundToday([distant], TODAY).map((e) => e.id)).toEqual(['far']);
  });
});
