/**
 * Range brush logic for the DAO Timeline date filter.
 *
 * The brush works in whole-day offsets relative to today (0 = today,
 * negative = past) rather than absolute dates. The control is anchored at
 * "now", so offsets keep the geometry integer-safe and make the range
 * presets ("Next 30") expressible without date arithmetic in the view.
 */

import { SerializedEvent } from '../types';
import { addDays, startOfDay } from '../utils/date-utils';

/** A selected span of days, inclusive, in offsets from today. */
export interface DayRange {
  from: number;
  to: number;
}

/** The full extent the brush can address, in offsets from today. */
export interface BrushDomain {
  min: number;
  max: number;
}

export interface RangePreset {
  id: string;
  label: string;
  from: number;
  to: number;
}

export interface HistogramBucket {
  from: number;
  to: number;
  count: number;
}

export interface MonthTick {
  offset: number;
  label: string;
}

/** The domain always reaches at least this far back, even with no past events. */
export const MIN_PAST_DAYS = 30;

/** The domain always reaches at least this far forward. */
export const MIN_FUTURE_DAYS = 90;

/** Weekly-ish buckets across the domain; tuned for a ~6 month axis. */
export const BUCKET_COUNT = 26;

/** Events this many days out (or fewer) get the emphasised countdown. */
export const IMMINENT_DAYS = 1;

/** Above this, month ticks are thinned to quarters, half-years or years. */
export const MAX_MONTH_TICKS = 12;

/** Tick spacings, in months, tried in order. */
const TICK_STEP_MONTHS = [1, 2, 3, 6, 12];

const MS_PER_DAY = 86_400_000;

/**
 * Whole days between two dates, ignoring time of day.
 *
 * Rounds because a DST boundary inside the span makes the raw quotient
 * fractional.
 */
export function toDayOffset(date: Date, today: Date): number {
  const diff = startOfDay(date).getTime() - startOfDay(today).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export function fromDayOffset(offset: number, today: Date): Date {
  return startOfDay(addDays(today, offset));
}

function startOfMonthOffset(offset: number, today: Date): number {
  const date = fromDayOffset(offset, today);
  return toDayOffset(new Date(date.getFullYear(), date.getMonth(), 1), today);
}

function endOfMonthOffset(offset: number, today: Date): number {
  const date = fromDayOffset(offset, today);
  return toDayOffset(new Date(date.getFullYear(), date.getMonth() + 1, 0), today);
}

/**
 * The axis extent for a set of events.
 *
 * Covers every event, never less than MIN_PAST_DAYS/MIN_FUTURE_DAYS around
 * today, and lands on whole months so the month ticks sit at the edges.
 */
export function computeDomain(events: SerializedEvent[], today: Date): BrushDomain {
  let min = -MIN_PAST_DAYS;
  let max = MIN_FUTURE_DAYS;

  for (const event of events) {
    const offset = toDayOffset(new Date(event.startDate), today);
    if (offset < min) min = offset;
    if (offset > max) max = offset;
  }

  return {
    min: startOfMonthOffset(min, today),
    max: endOfMonthOffset(max, today),
  };
}

/** Keep a range inside the domain, and at least one day wide. */
export function clampRange(range: DayRange, domain: BrushDomain): DayRange {
  const from = Math.min(Math.max(range.from, domain.min), domain.max - 1);
  const to = Math.min(Math.max(range.to, from + 1), domain.max);
  return { from, to };
}

export function getDefaultRange(): DayRange {
  return { from: -14, to: 30 };
}

/** Position of a day offset along the axis, as a 0–1 fraction. */
export function toFraction(offset: number, domain: BrushDomain): number {
  const span = domain.max - domain.min;
  if (span <= 0) return 0;
  const fraction = (offset - domain.min) / span;
  return Math.min(Math.max(fraction, 0), 1);
}

/** The day offset at a 0–1 position along the axis. */
export function toOffset(fraction: number, domain: BrushDomain): number {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  return Math.round(domain.min + clamped * (domain.max - domain.min));
}

/**
 * Event density across the domain, for the bars behind the brush.
 */
export function buildHistogram(
  events: SerializedEvent[],
  domain: BrushDomain,
  today: Date,
  bucketCount: number = BUCKET_COUNT,
): HistogramBucket[] {
  const span = domain.max - domain.min;
  if (span <= 0 || bucketCount <= 0) return [];

  const size = span / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, index) => ({
    from: domain.min + index * size,
    to: domain.min + (index + 1) * size,
    count: 0,
  }));

  for (const event of events) {
    const offset = toDayOffset(new Date(event.startDate), today);
    if (offset < domain.min || offset > domain.max) continue;
    const index = Math.min(Math.max(Math.floor((offset - domain.min) / size), 0), bucketCount - 1);
    buckets[index].count++;
  }

  return buckets;
}

/** The tallest bucket, used to scale bar heights. Never zero. */
export function peakCount(buckets: HistogramBucket[]): number {
  return buckets.reduce((max, bucket) => Math.max(max, bucket.count), 1);
}

/**
 * Ticks along the bottom of the axis, thinned to fit.
 *
 * A calendar with years of history would otherwise collide dozens of month
 * labels into the same strip, so the step widens to quarters, half-years or
 * years and lands on natural boundaries. January carries its year so a domain
 * spanning the new year stays unambiguous; year-stepped ticks are bare years.
 */
export function buildMonthTicks(
  domain: BrushDomain,
  today: Date,
  maxTicks: number = MAX_MONTH_TICKS,
): MonthTick[] {
  const ticks: MonthTick[] = [];
  if (domain.max <= domain.min) return ticks;

  const first = fromDayOffset(domain.min, today);
  const last = fromDayOffset(domain.max, today);
  const spanMonths =
    (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) + 1;

  let step = TICK_STEP_MONTHS[TICK_STEP_MONTHS.length - 1];
  for (const candidate of TICK_STEP_MONTHS) {
    if (spanMonths / candidate <= maxTicks) {
      step = candidate;
      break;
    }
  }
  // Beyond a year per tick, keep widening in whole years.
  while (step >= 12 && spanMonths / step > maxTicks) {
    step += 12;
  }

  const alignedMonth = step >= 12 ? 0 : Math.floor(first.getMonth() / step) * step;
  const cursor = new Date(first.getFullYear(), alignedMonth, 1);
  while (toDayOffset(cursor, today) < domain.min) {
    cursor.setMonth(cursor.getMonth() + step);
  }

  // Bounded so a malformed domain cannot spin here.
  for (let guard = 0; guard < 200; guard++) {
    const offset = toDayOffset(cursor, today);
    if (offset > domain.max) break;

    const month = cursor.toLocaleDateString('en-US', { month: 'short' });
    const label =
      step >= 12
        ? String(cursor.getFullYear())
        : cursor.getMonth() === 0
          ? `${month} '${String(cursor.getFullYear()).slice(-2)}`
          : month;
    ticks.push({ offset, label });

    cursor.setMonth(cursor.getMonth() + step);
  }

  return ticks;
}

export function filterByDayRange(
  events: SerializedEvent[],
  range: DayRange,
  today: Date,
): SerializedEvent[] {
  return events.filter((event) => {
    const offset = toDayOffset(new Date(event.startDate), today);
    return offset >= range.from && offset <= range.to;
  });
}

export function isPastOffset(offset: number): boolean {
  return offset < 0;
}

export function isImminentOffset(offset: number): boolean {
  return offset >= 0 && offset <= IMMINENT_DAYS;
}

/** "today", "in 9 days", "12 days ago" — the countdown next to an event time. */
export function formatRelativeLabel(offset: number): string {
  if (offset === 0) return 'today';
  if (offset === 1) return 'tomorrow';
  if (offset === -1) return 'yesterday';
  if (offset < 0) return `${Math.abs(offset)} days ago`;
  return `in ${offset} days`;
}

export function formatOffsetShort(offset: number, today: Date): string {
  return fromDayOffset(offset, today).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatOffsetLong(offset: number, today: Date): string {
  return fromDayOffset(offset, today).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRangeLabel(range: DayRange, today: Date): string {
  return `${formatOffsetShort(range.from, today)} – ${formatOffsetShort(range.to, today)}`;
}

/**
 * The range the timeline opens on.
 *
 * Prefers the near-term window, but a calendar whose events are all historical
 * would open on an empty list with no hint of where the events are — so when
 * the preferred window catches nothing, fall back to the whole domain and let
 * the histogram show where to brush.
 */
export function resolveInitialRange(
  domain: BrushDomain,
  events: SerializedEvent[],
  today: Date,
): DayRange {
  const preferred = clampRange(getDefaultRange(), domain);
  if (filterByDayRange(events, preferred, today).length > 0) {
    return preferred;
  }
  return { from: domain.min, to: domain.max };
}

export function getPresets(domain: BrushDomain): RangePreset[] {
  const presets: RangePreset[] = [
    { id: 'past-90', label: 'Past 90d', from: -90, to: 0 },
    { id: 'next-30', label: 'Next 30d', from: 0, to: 30 },
    { id: 'next-180', label: 'Next 180d', from: 0, to: 180 },
    { id: 'next-12-months', label: 'Next 12 months', from: 0, to: 365 },
    { id: 'all', label: 'All', from: domain.min, to: domain.max },
  ];

  // Clamped here rather than only on click: the long presets routinely reach
  // past the end of a short axis, and an unclamped preset could never match
  // the applied range, so it would never light up as active.
  return presets.map((preset) => ({
    ...preset,
    ...clampRange({ from: preset.from, to: preset.to }, domain),
  }));
}

export function isPresetActive(preset: RangePreset, range: DayRange): boolean {
  return preset.from === range.from && preset.to === range.to;
}
