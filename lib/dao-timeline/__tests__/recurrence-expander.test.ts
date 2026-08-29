import { describe, expect, it } from 'vitest';

import {
  buildRRule,
  buildSeriesInfo,
  describeRecurrence,
  nextOccurrence,
  occurrencesBetween,
  parseRRule,
  previousOccurrence,
} from '../logic/recurrence-expander';
import { RecurrenceRule } from '../types';
import { formatYMD } from '../utils/date-utils';

/** A rule with every field defaulted, so tests state only what they mean. */
function rule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return {
    freq: 'WEEKLY',
    interval: 1,
    count: null,
    until: null,
    byDay: null,
    byMonthDay: null,
    byMonth: null,
    ...overrides,
  };
}

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h);
const ymd = (dates: Date[]) => dates.map(formatYMD);

describe('parseRRule', () => {
  it('parses a full weekly rule', () => {
    const parsed = parseRRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=6');

    expect(parsed).toMatchObject({
      freq: 'WEEKLY',
      interval: 2,
      byDay: ['TU', 'TH'],
      count: 6,
    });
  });

  it('parses UNTIL in both date and date-time forms', () => {
    expect(parseRRule('FREQ=DAILY;UNTIL=20260315')?.until).toEqual(
      new Date(2026, 2, 15, 23, 59, 59, 999),
    );
    expect(parseRRule('FREQ=DAILY;UNTIL=20260315T120000Z')?.until).toEqual(
      new Date(Date.UTC(2026, 2, 15, 12, 0, 0)),
    );
  });

  it('rejects a rule with no usable FREQ', () => {
    expect(parseRRule('INTERVAL=2;BYDAY=TU')).toBeNull();
    expect(parseRRule('FREQ=FORTNIGHTLY')).toBeNull();
    expect(parseRRule('')).toBeNull();
  });

  it('falls back to sane values for malformed numbers', () => {
    const parsed = parseRRule('FREQ=DAILY;INTERVAL=0;COUNT=nonsense');

    expect(parsed?.interval).toBe(1);
    expect(parsed?.count).toBeNull();
  });
});

describe('buildRRule', () => {
  it('omits the parts that carry no information', () => {
    expect(buildRRule({ freq: 'MONTHLY', interval: 1 })).toBe('FREQ=MONTHLY');
  });

  it('renders every supported part', () => {
    expect(
      buildRRule({
        freq: 'WEEKLY',
        interval: 2,
        byDay: ['TU'],
        count: 6,
      }),
    ).toBe('FREQ=WEEKLY;INTERVAL=2;COUNT=6;BYDAY=TU');
  });

  it('round-trips UNTIL without shifting the day', () => {
    // A date-only UNTIL is a local date; reading it back in UTC moved the day
    // for anyone not on UTC.
    const until = new Date(2026, 11, 31, 23, 59, 59, 999);
    const parsed = parseRRule(buildRRule({ freq: 'MONTHLY', until }));

    expect(buildRRule({ freq: 'MONTHLY', until })).toBe('FREQ=MONTHLY;UNTIL=20261231');
    expect(parsed?.until).toEqual(until);
  });

  it('round-trips through parseRRule', () => {
    const original = rule({ freq: 'MONTHLY', interval: 3, byDay: ['1MO'] });
    const parsed = parseRRule(buildRRule(original));

    expect(parsed).toMatchObject({
      freq: 'MONTHLY',
      interval: 3,
      byDay: ['1MO'],
    });
  });
});

describe('describeRecurrence', () => {
  it.each([
    [rule({ freq: 'DAILY' }), 'Daily'],
    [rule({ freq: 'DAILY', interval: 3 }), 'Every 3 days'],
    [rule({ byDay: ['TU'] }), 'Weekly on Tue'],
    [rule({ interval: 2, byDay: ['TU'] }), 'Every 2 weeks on Tue'],
    [rule({ byDay: ['MO', 'WE', 'FR'] }), 'Weekly on Mon, Wed, Fri'],
    [rule({ freq: 'MONTHLY' }), 'Monthly'],
    [rule({ freq: 'MONTHLY', interval: 2 }), 'Every 2 months'],
    // A quarterly report reaches us as MONTHLY/3, and must not read as
    // "Every 3 months" on the badge.
    [rule({ freq: 'MONTHLY', interval: 3 }), 'Quarterly'],
    [rule({ freq: 'MONTHLY', interval: 6 }), 'Twice a year'],
    [rule({ freq: 'YEARLY' }), 'Yearly'],
  ])('describes %o as "%s"', (input, expected) => {
    expect(describeRecurrence(input)).toBe(expected);
  });
});

describe('occurrencesBetween', () => {
  it('emits every listed weekday of a weekly rule', () => {
    // The old expander advanced whole weeks, so BYDAY=MO,WE,FR could never
    // yield more than the seed's own weekday.
    const found = occurrencesBetween(
      rule({ byDay: ['MO', 'WE', 'FR'] }),
      at(2026, 3, 2), // a Monday
      at(2026, 3, 1),
      at(2026, 3, 14),
    );

    expect(ymd(found)).toEqual([
      '2026-03-02',
      '2026-03-04',
      '2026-03-06',
      '2026-03-09',
      '2026-03-11',
      '2026-03-13',
    ]);
  });

  it('honours INTERVAL on weekly rules', () => {
    const found = occurrencesBetween(
      rule({ interval: 2, byDay: ['WE'] }),
      at(2026, 3, 4),
      at(2026, 3, 1),
      at(2026, 4, 5),
    );

    expect(ymd(found)).toEqual(['2026-03-04', '2026-03-18', '2026-04-01']);
  });

  it('stops at COUNT regardless of the query window', () => {
    const seriesRule = rule({ byDay: ['WE'], count: 3 });
    const seed = at(2026, 3, 4);

    // Asking about a later window must not resurrect a series that already
    // exhausted its COUNT before that window began.
    expect(occurrencesBetween(seriesRule, seed, at(2026, 3, 1), at(2026, 5, 1))).toHaveLength(3);
    expect(occurrencesBetween(seriesRule, seed, at(2026, 4, 1), at(2026, 5, 1))).toHaveLength(0);
  });

  it('stops at UNTIL', () => {
    const found = occurrencesBetween(
      rule({ byDay: ['WE'], until: new Date(2026, 2, 18, 23, 59, 59) }),
      at(2026, 3, 4),
      at(2026, 3, 1),
      at(2026, 5, 1),
    );

    expect(ymd(found)).toEqual(['2026-03-04', '2026-03-11', '2026-03-18']);
  });

  it('never emits before the seed', () => {
    const found = occurrencesBetween(
      rule({ byDay: ['MO', 'FR'] }),
      at(2026, 3, 4), // a Wednesday: Monday of that week precedes it
      at(2026, 3, 1),
      at(2026, 3, 8),
    );

    expect(ymd(found)).toEqual(['2026-03-06']);
  });

  it('skips excluded dates', () => {
    const found = occurrencesBetween(
      rule({ byDay: ['WE'] }),
      at(2026, 3, 4),
      at(2026, 3, 1),
      at(2026, 3, 26),
      { exceptions: ['2026-03-11'] },
    );

    expect(ymd(found)).toEqual(['2026-03-04', '2026-03-18', '2026-03-25']);
  });

  it('resolves an ordinal BYDAY against the month', () => {
    const found = occurrencesBetween(
      rule({ freq: 'MONTHLY', byDay: ['1MO'] }),
      at(2026, 3, 2),
      at(2026, 3, 1),
      at(2026, 5, 31),
    );

    expect(ymd(found)).toEqual(['2026-03-02', '2026-04-06', '2026-05-04']);
  });

  it('resolves a negative ordinal BYDAY as the last such weekday', () => {
    const found = occurrencesBetween(
      rule({ freq: 'MONTHLY', byDay: ['-1FR'] }),
      at(2026, 3, 27),
      at(2026, 3, 1),
      at(2026, 4, 30),
    );

    expect(ymd(found)).toEqual(['2026-03-27', '2026-04-24']);
  });

  it('applies BYMONTHDAY on monthly rules', () => {
    const found = occurrencesBetween(
      rule({ freq: 'MONTHLY', byMonthDay: [1, 15] }),
      at(2026, 3, 1),
      at(2026, 3, 1),
      at(2026, 4, 30),
    );

    expect(ymd(found)).toEqual(['2026-03-01', '2026-03-15', '2026-04-01', '2026-04-15']);
  });

  it('skips months too short for the seed day', () => {
    const found = occurrencesBetween(
      rule({ freq: 'MONTHLY' }),
      at(2026, 1, 31),
      at(2026, 1, 1),
      at(2026, 4, 30),
    );

    expect(ymd(found)).toEqual(['2026-01-31', '2026-03-31']);
  });

  it('keeps the seed time of day across a DST boundary', () => {
    // US DST begins 2026-03-08; a naive ms-based step would drift by an hour.
    const found = occurrencesBetween(
      rule({ freq: 'DAILY' }),
      at(2026, 3, 6, 9),
      at(2026, 3, 6, 0),
      at(2026, 3, 10, 23),
    );

    expect(ymd(found)).toEqual([
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    expect(found.every((d) => d.getHours() === 9)).toBe(true);
  });

  it('reaches a far-future window without exhausting its iteration budget', () => {
    const found = occurrencesBetween(
      rule({ freq: 'DAILY' }),
      at(2019, 1, 1),
      at(2026, 8, 19),
      at(2026, 8, 21),
      { cap: 50 },
    );

    expect(ymd(found)).toEqual(['2026-08-19', '2026-08-20', '2026-08-21']);
  });

  it('returns nothing for an inverted window', () => {
    expect(occurrencesBetween(rule(), at(2026, 3, 4), at(2026, 4, 1), at(2026, 3, 1))).toEqual([]);
  });
});

describe('previousOccurrence / nextOccurrence', () => {
  const weekly = rule({ byDay: ['WE'] });
  const seed = at(2026, 3, 4);

  it('splits the series either side of the anchor', () => {
    const anchor = at(2026, 3, 20);

    expect(formatYMD(previousOccurrence(weekly, seed, anchor, at(2026, 1, 1))!)).toBe('2026-03-18');
    expect(formatYMD(nextOccurrence(weekly, seed, anchor, at(2026, 6, 1))!)).toBe('2026-03-25');
  });

  it('treats an occurrence on the anchor itself as previous, not next', () => {
    const anchor = new Date(2026, 2, 18, 23, 59, 59, 999);

    expect(formatYMD(previousOccurrence(weekly, seed, anchor, at(2026, 1, 1))!)).toBe('2026-03-18');
    expect(formatYMD(nextOccurrence(weekly, seed, anchor, at(2026, 6, 1))!)).toBe('2026-03-25');
  });

  it('returns null when the search window holds no occurrence', () => {
    expect(previousOccurrence(weekly, seed, at(2026, 3, 1), at(2026, 1, 1))).toBeNull();
    expect(
      nextOccurrence(rule({ byDay: ['WE'], count: 1 }), seed, at(2026, 3, 20), at(2026, 6, 1)),
    ).toBeNull();
  });
});

describe('buildSeriesInfo', () => {
  it('packages a rule with its cadence and exceptions', () => {
    expect(buildSeriesInfo('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU', ['2026-03-10'])).toEqual({
      rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU',
      summary: 'Every 2 weeks on Tue',
      exceptions: ['2026-03-10'],
    });
  });

  it('is null for a missing or unusable rule', () => {
    expect(buildSeriesInfo(null)).toBeNull();
    expect(buildSeriesInfo('')).toBeNull();
    expect(buildSeriesInfo('BYDAY=TU')).toBeNull();
  });
});
