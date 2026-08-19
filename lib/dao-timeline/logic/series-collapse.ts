/**
 * Collapse recurring series down to what is worth showing.
 *
 * A weekly DAO call would otherwise contribute a card for every week it meets,
 * burying the one-off events the timeline exists to surface. Instead a series
 * travels as a single event carrying its rule (see SeriesInfo) and is
 * materialised here into at most two occurrences: the most recent one and the
 * next one.
 *
 * Two entry points, because the list and the brush need different anchors:
 *
 * - `collapseSeriesInRange` anchors to the brushed range, so a series is never
 *   invisible in the window the user is actually looking at.
 * - `collapseSeriesAroundToday` anchors to today and takes no range, so the
 *   density histogram and the axis stay still while the brush is dragged.
 *
 * They agree exactly whenever the range spans today, which is the default.
 */

import { SERIES_LOOKAHEAD_MONTHS, SERIES_LOOKBEHIND_MONTHS } from '../config';
import { OccurrenceInfo, RecurrenceRule, SerializedEvent } from '../types';
import { addMonths, endOfDay, formatYMD } from '../utils/date-utils';
import {
  DayRange,
  fromDayOffset,
  toDayOffset,
} from './range-brush';
import {
  nextOccurrence,
  parseRRule,
  previousOccurrence,
} from './recurrence-expander';

/** A series event and the parsed rule it carries. */
interface Series {
  event: SerializedEvent;
  rule: RecurrenceRule;
  seed: Date;
  exceptions: string[];
}

/**
 * Today, clamped into the range.
 *
 * A window entirely in the future anchors at its start, so its first
 * occurrences show; a window entirely in the past anchors at its end, so its
 * last one does.
 */
export function resolveAnchor(range: DayRange, today: Date): Date {
  const offset = Math.min(Math.max(0, range.from), range.to);
  return fromDayOffset(offset, today);
}

/**
 * Collapse series and filter one-off events to the brushed range.
 *
 * Every event returned falls inside `range`, so the brush contract holds: what
 * the range says is showing is what shows.
 */
export function collapseSeriesInRange(
  events: SerializedEvent[],
  range: DayRange,
  today: Date
): SerializedEvent[] {
  const anchor = resolveAnchor(range, today);
  const floor = fromDayOffset(range.from, today);
  const ceiling = endOfDay(fromDayOffset(range.to, today));

  return collapse(events, {
    anchor,
    floor,
    ceiling,
    keep: (event) => inRange(event, range, today),
  });
}

/**
 * Collapse series around today, without reference to any range.
 *
 * Used for the axis extent and the density histogram, both of which must not
 * reshape while the user drags the brush.
 */
export function collapseSeriesAroundToday(
  events: SerializedEvent[],
  today: Date
): SerializedEvent[] {
  return collapse(events, {
    anchor: today,
    floor: addMonths(today, -SERIES_LOOKBEHIND_MONTHS),
    ceiling: addMonths(today, SERIES_LOOKAHEAD_MONTHS),
    keep: () => true,
  });
}

/* -------------------------------------------------------------------------- */

interface CollapseOptions {
  /** The split point: one occurrence at or before it, one after. */
  anchor: Date;
  /** How far back to search for the previous occurrence. */
  floor: Date;
  /** How far forward to search for the next one. */
  ceiling: Date;
  /** Whether a non-recurring event survives. */
  keep: (event: SerializedEvent) => boolean;
}

function collapse(
  events: SerializedEvent[],
  options: CollapseOptions
): SerializedEvent[] {
  const result: SerializedEvent[] = [];

  for (const event of events) {
    const series = asSeries(event);

    if (!series) {
      if (options.keep(event)) result.push(event);
      continue;
    }

    result.push(...collapseOne(series, options));
  }

  return result;
}

/**
 * The one or two occurrences of a single series that fall in the window.
 */
function collapseOne(series: Series, options: CollapseOptions): SerializedEvent[] {
  const { rule, seed, exceptions } = series;
  const { anchor, floor, ceiling } = options;

  // The anchor day belongs to the past half: an event earlier today has
  // already happened, and the "next" card should point at the following one.
  const previous = previousOccurrence(
    rule,
    seed,
    minDate(endOfDay(anchor), ceiling),
    floor,
    { exceptions }
  );
  const next = nextOccurrence(rule, seed, endOfDay(anchor), ceiling, {
    exceptions,
  });

  const occurrences: SerializedEvent[] = [];

  if (previous) {
    occurrences.push(
      materialize(series, previous, {
        role: 'previous',
        siblingDate: next ? next.toISOString() : null,
      })
    );
  }
  if (next) {
    occurrences.push(
      materialize(series, next, {
        role: 'next',
        siblingDate: previous ? previous.toISOString() : null,
      })
    );
  }

  return occurrences;
}

/**
 * Turn one occurrence date into a renderable event.
 *
 * The id is derived from the series id and the occurrence day so React keys
 * stay stable across re-renders and deduplication still works.
 */
function materialize(
  series: Series,
  date: Date,
  occurrence: OccurrenceInfo
): SerializedEvent {
  const { event, seed } = series;

  const duration = event.endDate
    ? new Date(event.endDate).getTime() - seed.getTime()
    : null;

  return {
    ...event,
    id: `${event.id}::${formatYMD(date)}`,
    startDate: date.toISOString(),
    endDate:
      duration === null ? null : new Date(date.getTime() + duration).toISOString(),
    occurrence,
  };
}

/** Read an event as a series, or null if it is a plain one-off. */
function asSeries(event: SerializedEvent): Series | null {
  if (!event.recurrence) return null;

  const rule = parseRRule(event.recurrence.rrule);
  if (!rule) return null;

  return {
    event,
    rule,
    seed: new Date(event.startDate),
    exceptions: event.recurrence.exceptions,
  };
}

function inRange(
  event: SerializedEvent,
  range: DayRange,
  today: Date
): boolean {
  const offset = toDayOffset(new Date(event.startDate), today);
  return offset >= range.from && offset <= range.to;
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}
