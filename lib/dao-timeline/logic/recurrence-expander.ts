/**
 * Occurrence engine for recurring events.
 *
 * A series is never materialised into one event per occurrence. Instead it
 * travels as a single event carrying its RRULE, and callers ask this module
 * for the occurrences they actually need — normally just the one before and
 * the one after some anchor. Everything here is pure and works in absolute
 * time; day-granularity decisions belong to the caller.
 */

import { MAX_OCCURRENCE_ITERATIONS } from '../config';
import { RecurrenceRule, SeriesInfo } from '../types';
import { formatYMD, startOfDay } from '../utils/date-utils';

/** RFC 5545 weekday codes, in `Date.getDay()` order. */
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** RFC 5545 default week start is Monday. Matters only when INTERVAL > 1. */
const WEEK_START_DAY = 1;

const MS_PER_DAY = 86_400_000;

export interface OccurrenceOptions {
  /** Dates to skip, as YYYY-MM-DD (ICS EXDATE). */
  exceptions?: readonly string[];
  /** Hard iteration ceiling; defaults to MAX_OCCURRENCE_ITERATIONS. */
  cap?: number;
}

/**
 * Parse an RRULE string into a RecurrenceRule object
 */
export function parseRRule(rrule: string): RecurrenceRule | null {
  if (!rrule) return null;

  const parts = rrule.split(';');
  const rule: RecurrenceRule = {
    freq: 'DAILY',
    interval: 1,
    count: null,
    until: null,
    byDay: null,
    byMonthDay: null,
    byMonth: null,
  };

  let sawFreq = false;

  for (const part of parts) {
    const [rawKey, value] = part.split('=');
    if (!rawKey || value === undefined) continue;
    const key = rawKey.trim().toUpperCase();

    switch (key) {
      case 'FREQ':
        if (
          value === 'DAILY' ||
          value === 'WEEKLY' ||
          value === 'MONTHLY' ||
          value === 'YEARLY'
        ) {
          rule.freq = value;
          sawFreq = true;
        }
        break;
      case 'INTERVAL': {
        const interval = parseInt(value, 10);
        rule.interval = Number.isFinite(interval) && interval > 0 ? interval : 1;
        break;
      }
      case 'COUNT': {
        const count = parseInt(value, 10);
        rule.count = Number.isFinite(count) && count > 0 ? count : null;
        break;
      }
      case 'UNTIL':
        rule.until = parseUntilDate(value);
        break;
      case 'BYDAY':
        rule.byDay = value.split(',').filter(Boolean);
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = value
          .split(',')
          .map((v) => parseInt(v, 10))
          .filter((v) => Number.isFinite(v) && v !== 0);
        break;
      case 'BYMONTH':
        rule.byMonth = value
          .split(',')
          .map((v) => parseInt(v, 10))
          .filter((v) => Number.isFinite(v) && v >= 1 && v <= 12);
        break;
    }
  }

  // A rule without a usable FREQ is not a recurrence at all.
  return sawFreq ? rule : null;
}

/**
 * Render a RecurrenceRule back to an RRULE string.
 *
 * The AI extraction path emits structured recurrence fields rather than a raw
 * RRULE, so this is where those become one.
 */
export function buildRRule(rule: Partial<RecurrenceRule>): string {
  const parts: string[] = [`FREQ=${rule.freq ?? 'DAILY'}`];

  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }
  if (rule.until) {
    parts.push(`UNTIL=${formatUntilDate(rule.until)}`);
  }
  if (rule.byDay?.length) {
    parts.push(`BYDAY=${rule.byDay.join(',')}`);
  }
  if (rule.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
  }
  if (rule.byMonth?.length) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
  }

  return parts.join(';');
}

/**
 * A short human-readable cadence, for the recurring badge.
 *
 * e.g. "Weekly on Tue", "Every 2 weeks on Tue", "Monthly", "Every 3 days".
 */
export function describeRecurrence(rule: RecurrenceRule): string {
  const n = rule.interval;
  const days = rule.byDay?.length ? ` on ${formatByDayList(rule.byDay)}` : '';

  switch (rule.freq) {
    case 'DAILY':
      return n === 1 ? 'Daily' : `Every ${n} days`;
    case 'WEEKLY':
      return n === 1 ? `Weekly${days}` : `Every ${n} weeks${days}`;
    case 'MONTHLY':
      // RRULE has no quarterly or semi-annual frequency, so those arrive as a
      // monthly interval. Say what they mean rather than "Every 3 months".
      if (n === 1) return `Monthly${days}`;
      if (n === 3) return `Quarterly${days}`;
      if (n === 6) return `Twice a year${days}`;
      return `Every ${n} months${days}`;
    case 'YEARLY':
      return n === 1 ? 'Yearly' : `Every ${n} years`;
  }
}

/**
 * Package an RRULE string into the SeriesInfo an event carries.
 *
 * Returns null for a missing or unparseable rule, which is what makes an
 * event non-recurring — there is no other flag to keep in sync.
 */
export function buildSeriesInfo(
  rrule: string | null | undefined,
  exceptions: readonly string[] = []
): SeriesInfo | null {
  if (!rrule) return null;

  const rule = parseRRule(rrule);
  if (!rule) return null;

  return {
    rrule,
    summary: describeRecurrence(rule),
    exceptions: [...exceptions],
  };
}

/**
 * Every occurrence of `rule` seeded at `seed` that falls within [from, to].
 *
 * COUNT is honoured from the seed forward, independently of the query window,
 * so narrowing the window can never lengthen the series.
 */
export function occurrencesBetween(
  rule: RecurrenceRule,
  seed: Date,
  from: Date,
  to: Date,
  options: OccurrenceOptions = {}
): Date[] {
  const cap = options.cap ?? MAX_OCCURRENCE_ITERATIONS;
  const excluded = new Set(options.exceptions ?? []);
  const results: Date[] = [];

  if (to < from || cap <= 0) return results;

  const limit = rule.until && rule.until < to ? rule.until : to;

  // With a COUNT we must walk from the seed to know when the series ends.
  // Without one, skip straight to the period covering `from` so an old daily
  // series does not cost thousands of iterations.
  const startPeriod = rule.count === null ? periodOffsetFor(rule, seed, from) : 0;

  let emitted = 0;
  let period = startPeriod;
  let iterations = 0;

  // Candidates never precede their period's anchor, so once the anchor passes
  // the limit nothing further can qualify.
  while (iterations < cap && periodStart(rule, seed, period) <= limit) {
    iterations++;

    for (const date of candidatesForPeriod(rule, seed, period)) {
      // DTSTART is the first occurrence; BY* parts can name earlier days
      // inside the seed's own period.
      if (date < seed) continue;

      if (rule.count !== null) {
        if (emitted >= rule.count) return results;
        emitted++;
      }

      if (date > limit || date < from) continue;
      if (excluded.has(formatYMD(date))) continue;

      results.push(date);
    }

    period++;
  }

  return results;
}

/**
 * The latest occurrence at or before `anchor`, no earlier than `floor`.
 */
export function previousOccurrence(
  rule: RecurrenceRule,
  seed: Date,
  anchor: Date,
  floor: Date,
  options: OccurrenceOptions = {}
): Date | null {
  const found = occurrencesBetween(rule, seed, floor, anchor, options);
  return found.length ? found[found.length - 1] : null;
}

/**
 * The earliest occurrence strictly after `anchor`, no later than `ceiling`.
 */
export function nextOccurrence(
  rule: RecurrenceRule,
  seed: Date,
  anchor: Date,
  ceiling: Date,
  options: OccurrenceOptions = {}
): Date | null {
  const after = new Date(anchor.getTime() + 1);
  const found = occurrencesBetween(rule, seed, after, ceiling, options);
  return found.length ? found[0] : null;
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Parse UNTIL date value. Format: YYYYMMDD or YYYYMMDDTHHMMSSZ
 */
function parseUntilDate(value: string): Date | null {
  if (!value || value.length < 8) return null;

  const year = parseInt(value.substring(0, 4), 10);
  const month = parseInt(value.substring(4, 6), 10) - 1;
  const day = parseInt(value.substring(6, 8), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  if (value.length > 8) {
    const hour = parseInt(value.substring(9, 11), 10) || 0;
    const minute = parseInt(value.substring(11, 13), 10) || 0;
    const second = parseInt(value.substring(13, 15), 10) || 0;
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  // A date-only UNTIL bounds the whole day.
  return new Date(year, month, day, 23, 59, 59, 999);
}

/**
 * Render UNTIL in its date-only form.
 *
 * Local fields, not UTC: a date-only UNTIL is parsed as local midnight, so
 * reading it back in UTC would shift the day for anyone east or west of it.
 */
function formatUntilDate(date: Date): string {
  return formatYMD(date).replace(/-/g, '');
}

/** Split a BYDAY token such as "MO", "1MO" or "-1FR". */
function parseByDay(token: string): { ordinal: number | null; weekday: number } | null {
  const match = token.trim().toUpperCase().match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/);
  if (!match) return null;

  return {
    ordinal: match[1] ? parseInt(match[1], 10) : null,
    weekday: WEEKDAY_CODES.indexOf(match[2] as (typeof WEEKDAY_CODES)[number]),
  };
}

function formatByDayList(byDay: readonly string[]): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels = byDay
    .map(parseByDay)
    .filter((d): d is { ordinal: number | null; weekday: number } => d !== null)
    .map((d) => names[d.weekday]);

  return labels.length ? labels.join(', ') : byDay.join(', ');
}

/** Copy the time-of-day from `seed` onto `date`. */
function withSeedTime(date: Date, seed: Date): Date {
  const result = new Date(date);
  result.setHours(
    seed.getHours(),
    seed.getMinutes(),
    seed.getSeconds(),
    seed.getMilliseconds()
  );
  return result;
}

/** Monday-based start of the week containing `date`, at midnight. */
function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const shift = (result.getDay() - WEEK_START_DAY + 7) % 7;
  result.setDate(result.getDate() - shift);
  return result;
}

/** The anchor date of period `n` of the rule, counting the seed as period 0. */
function periodStart(rule: RecurrenceRule, seed: Date, n: number): Date {
  const step = n * rule.interval;

  switch (rule.freq) {
    case 'DAILY': {
      const result = new Date(seed);
      result.setDate(result.getDate() + step);
      return result;
    }
    case 'WEEKLY': {
      const result = startOfWeek(seed);
      result.setDate(result.getDate() + step * 7);
      return withSeedTime(result, seed);
    }
    case 'MONTHLY': {
      const result = new Date(seed.getFullYear(), seed.getMonth() + step, 1);
      return withSeedTime(result, seed);
    }
    case 'YEARLY': {
      const result = new Date(seed.getFullYear() + step, 0, 1);
      return withSeedTime(result, seed);
    }
  }
}

/**
 * How many whole periods separate the seed from `target`.
 *
 * Used to skip ahead without iterating. Deliberately conservative: it returns
 * one period early so a candidate sitting near a period boundary is not missed.
 */
function periodOffsetFor(rule: RecurrenceRule, seed: Date, target: Date): number {
  if (target <= seed) return 0;

  let periods: number;

  switch (rule.freq) {
    case 'DAILY':
      periods = Math.floor(
        (startOfDay(target).getTime() - startOfDay(seed).getTime()) /
          (MS_PER_DAY * rule.interval)
      );
      break;
    case 'WEEKLY':
      periods = Math.floor(
        (startOfWeek(target).getTime() - startOfWeek(seed).getTime()) /
          (MS_PER_DAY * 7 * rule.interval)
      );
      break;
    case 'MONTHLY':
      periods = Math.floor(
        ((target.getFullYear() - seed.getFullYear()) * 12 +
          (target.getMonth() - seed.getMonth())) /
          rule.interval
      );
      break;
    case 'YEARLY':
      periods = Math.floor(
        (target.getFullYear() - seed.getFullYear()) / rule.interval
      );
      break;
  }

  return Math.max(0, periods - 1);
}

/**
 * Every candidate date inside period `n`, in ascending order, before the
 * BYMONTH filter and window bounds are applied.
 */
function candidatesForPeriod(
  rule: RecurrenceRule,
  seed: Date,
  n: number
): Date[] {
  const anchor = periodStart(rule, seed, n);
  let dates: Date[];

  switch (rule.freq) {
    case 'DAILY':
      dates = [anchor];
      break;

    case 'WEEKLY': {
      // The anchor is the week start; BYDAY picks days inside that week.
      const weekdays = rule.byDay?.length
        ? rule.byDay
            .map(parseByDay)
            .filter((d): d is { ordinal: number | null; weekday: number } => d !== null)
            .map((d) => d.weekday)
        : [seed.getDay()];

      dates = [...new Set(weekdays)]
        .sort((a, b) => a - b)
        .map((weekday) => {
          const date = new Date(anchor);
          date.setDate(date.getDate() + ((weekday - WEEK_START_DAY + 7) % 7));
          return date;
        });
      break;
    }

    case 'MONTHLY':
      dates = monthlyCandidates(rule, seed, anchor);
      break;

    case 'YEARLY': {
      const months = rule.byMonth?.length ? rule.byMonth : [seed.getMonth() + 1];
      dates = months.flatMap((month) => {
        const monthAnchor = new Date(anchor.getFullYear(), month - 1, 1);
        return monthlyCandidates(rule, seed, withSeedTime(monthAnchor, seed));
      });
      break;
    }
  }

  // BYMONTH narrows any frequency, not just YEARLY.
  if (rule.byMonth?.length && rule.freq !== 'YEARLY') {
    const months = new Set(rule.byMonth);
    dates = dates.filter((d) => months.has(d.getMonth() + 1));
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/** Days selected within the month that `anchor` falls in. */
function monthlyCandidates(
  rule: RecurrenceRule,
  seed: Date,
  anchor: Date
): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (rule.byMonthDay?.length) {
    return rule.byMonthDay
      .map((day) => (day < 0 ? daysInMonth + day + 1 : day))
      .filter((day) => day >= 1 && day <= daysInMonth)
      .map((day) => withSeedTime(new Date(year, month, day), seed));
  }

  if (rule.byDay?.length) {
    const dates: Date[] = [];

    for (const token of rule.byDay) {
      const parsed = parseByDay(token);
      if (!parsed) continue;

      const matching: number[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        if (new Date(year, month, day).getDay() === parsed.weekday) {
          matching.push(day);
        }
      }

      if (parsed.ordinal === null) {
        dates.push(
          ...matching.map((day) => withSeedTime(new Date(year, month, day), seed))
        );
        continue;
      }

      // "1MO" is the first Monday, "-1FR" the last Friday.
      const index =
        parsed.ordinal > 0
          ? parsed.ordinal - 1
          : matching.length + parsed.ordinal;
      if (index >= 0 && index < matching.length) {
        dates.push(withSeedTime(new Date(year, month, matching[index]), seed));
      }
    }

    return dates;
  }

  // No BY* parts: repeat the seed's day of month, skipping months too short
  // for it (RFC 5545 behaviour — Jan 31 monthly skips February).
  const day = seed.getDate();
  if (day > daysInMonth) return [];
  return [withSeedTime(new Date(year, month, day), seed)];
}
