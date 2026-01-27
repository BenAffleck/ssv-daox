/**
 * Aggregate, filter, and group events for display
 */

import {
  EventGroup,
  SerializedEvent,
  TimelineFilters,
  UnifiedEvent,
} from '../types';
import {
  getDateLabel,
  isPastDate,
  isSameDay,
  startOfDay,
} from '../utils/date-utils';
import { serializeEvents } from './event-transformer';

/**
 * Sort events by start date (ascending)
 */
export function sortEventsByDate(events: UnifiedEvent[]): UnifiedEvent[] {
  return [...events].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

/**
 * Filter events by source IDs
 */
export function filterBySource(
  events: UnifiedEvent[],
  sourceIds: string[]
): UnifiedEvent[] {
  if (!sourceIds.length) return events;

  return events.filter((event) => sourceIds.includes(event.sourceId));
}

/**
 * Filter events by date range
 */
export function filterByDateRange(
  events: UnifiedEvent[],
  startDate?: Date | null,
  endDate?: Date | null
): UnifiedEvent[] {
  return events.filter((event) => {
    if (startDate && event.startDate < startDate) {
      return false;
    }
    if (endDate && event.startDate > endDate) {
      return false;
    }
    return true;
  });
}

/**
 * Filter out past events
 */
export function filterPastEvents(
  events: UnifiedEvent[],
  showPast: boolean
): UnifiedEvent[] {
  if (showPast) return events;
  return events.filter((event) => !isPastDate(event.startDate));
}

/**
 * Apply all filters to events
 */
export function applyFilters(
  events: UnifiedEvent[],
  filters: TimelineFilters
): UnifiedEvent[] {
  let filtered = [...events];

  // Filter by source
  if (filters.sources.length > 0) {
    filtered = filterBySource(filtered, filters.sources);
  }

  // Filter by date range
  filtered = filterByDateRange(filtered, filters.startDate, filters.endDate);

  // Filter past events
  filtered = filterPastEvents(filtered, filters.showPastEvents);

  return filtered;
}

/**
 * Group events by day for display
 */
export function groupEventsByDay(events: UnifiedEvent[]): EventGroup[] {
  const sorted = sortEventsByDate(events);
  const groups: EventGroup[] = [];
  let currentGroup: EventGroup | null = null;

  for (const event of sorted) {
    const eventDay = startOfDay(event.startDate);

    if (!currentGroup || !isSameDay(currentGroup.date, eventDay)) {
      currentGroup = {
        date: eventDay,
        label: getDateLabel(eventDay),
        events: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.events.push(serializeEvents([event])[0]);
  }

  return groups;
}

/**
 * Merge events from multiple sources
 */
export function mergeEvents(...eventArrays: UnifiedEvent[][]): UnifiedEvent[] {
  return eventArrays.flat();
}

/**
 * Deduplicate events by ID
 */
export function deduplicateEvents(events: UnifiedEvent[]): UnifiedEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) {
      return false;
    }
    seen.add(event.id);
    return true;
  });
}

/**
 * Process events through full pipeline: merge, dedupe, filter, sort, group
 */
export function processEvents(
  events: UnifiedEvent[],
  filters: TimelineFilters
): EventGroup[] {
  const deduped = deduplicateEvents(events);
  const filtered = applyFilters(deduped, filters);
  return groupEventsByDay(filtered);
}

/**
 * Get default filters (show future events from all sources)
 */
export function getDefaultFilters(): TimelineFilters {
  return {
    sources: [],
    startDate: null,
    endDate: null,
    showPastEvents: false,
  };
}
