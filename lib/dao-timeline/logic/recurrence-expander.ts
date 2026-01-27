/**
 * Expand recurring events into individual instances
 */

import {
  DEFAULT_EXPANSION_MONTHS,
  MAX_RECURRENCE_INSTANCES,
} from '../config';
import { RecurrenceRule, UnifiedEvent } from '../types';
import { addDays, addMonths } from '../utils/date-utils';

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

  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        if (
          value === 'DAILY' ||
          value === 'WEEKLY' ||
          value === 'MONTHLY' ||
          value === 'YEARLY'
        ) {
          rule.freq = value;
        }
        break;
      case 'INTERVAL':
        rule.interval = parseInt(value, 10) || 1;
        break;
      case 'COUNT':
        rule.count = parseInt(value, 10) || null;
        break;
      case 'UNTIL':
        rule.until = parseUntilDate(value);
        break;
      case 'BYDAY':
        rule.byDay = value.split(',');
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = value.split(',').map((v) => parseInt(v, 10));
        break;
      case 'BYMONTH':
        rule.byMonth = value.split(',').map((v) => parseInt(v, 10));
        break;
    }
  }

  return rule;
}

/**
 * Parse UNTIL date value
 */
function parseUntilDate(value: string): Date | null {
  if (!value) return null;

  // Format: YYYYMMDD or YYYYMMDDTHHMMSSZ
  const year = parseInt(value.substring(0, 4), 10);
  const month = parseInt(value.substring(4, 6), 10) - 1;
  const day = parseInt(value.substring(6, 8), 10);

  if (value.length > 8) {
    const hour = parseInt(value.substring(9, 11), 10);
    const minute = parseInt(value.substring(11, 13), 10);
    const second = parseInt(value.substring(13, 15), 10);
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day);
}

/**
 * Get the next occurrence date based on frequency
 */
function getNextOccurrence(
  current: Date,
  rule: RecurrenceRule,
  interval: number
): Date {
  const next = new Date(current);

  switch (rule.freq) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}

/**
 * Check if a date matches BYDAY rule (for WEEKLY freq)
 */
function matchesByDay(date: Date, byDay: string[]): boolean {
  const dayMap: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  const dayOfWeek = date.getDay();
  return byDay.some((d) => {
    // Handle formats like "MO" or "1MO" (first Monday)
    const dayCode = d.replace(/^-?\d+/, '');
    return dayMap[dayCode] === dayOfWeek;
  });
}

/**
 * Expand a recurring event into individual instances
 */
export function expandRecurringEvent(
  event: UnifiedEvent,
  rangeStart?: Date,
  rangeEnd?: Date
): UnifiedEvent[] {
  // If not recurring, return as-is
  if (!event.isRecurring || !event.metadata.rrule) {
    return [event];
  }

  const rrule = parseRRule(event.metadata.rrule as string);
  if (!rrule) {
    return [event];
  }

  // Calculate expansion range
  const now = new Date();
  const start = rangeStart || addMonths(now, -1);
  const end =
    rangeEnd || addMonths(now, DEFAULT_EXPANSION_MONTHS);

  // Calculate event duration
  const duration = event.endDate
    ? event.endDate.getTime() - event.startDate.getTime()
    : 0;

  const instances: UnifiedEvent[] = [];
  let current = new Date(event.startDate);
  let count = 0;

  // Check if original event falls within range
  if (current >= start && current <= end) {
    instances.push({
      ...event,
      id: `${event.id}-0`,
    });
    count++;
  }

  // Generate instances
  while (count < MAX_RECURRENCE_INSTANCES) {
    current = getNextOccurrence(current, rrule, rrule.interval);

    // Check termination conditions
    if (rrule.until && current > rrule.until) {
      break;
    }
    if (current > end) {
      break;
    }
    if (rrule.count && count >= rrule.count) {
      break;
    }

    // Check BYDAY constraint
    if (rrule.byDay && rrule.freq === 'WEEKLY') {
      if (!matchesByDay(current, rrule.byDay)) {
        continue;
      }
    }

    // Skip if before range start
    if (current < start) {
      continue;
    }

    // Create instance
    const instanceEnd = duration > 0 ? new Date(current.getTime() + duration) : null;

    instances.push({
      ...event,
      id: `${event.id}-${count}`,
      startDate: new Date(current),
      endDate: instanceEnd,
      metadata: {
        ...event.metadata,
        instanceIndex: count,
      },
    });

    count++;
  }

  return instances;
}

/**
 * Expand all recurring events in a list
 */
export function expandAllRecurringEvents(
  events: UnifiedEvent[],
  rangeStart?: Date,
  rangeEnd?: Date
): UnifiedEvent[] {
  return events.flatMap((event) =>
    expandRecurringEvent(event, rangeStart, rangeEnd)
  );
}
