/**
 * Merge and sort events from all sources
 */

import { UnifiedEvent } from '../types';

/**
 * Sort events by start date (ascending)
 */
export function sortEventsByDate(events: UnifiedEvent[]): UnifiedEvent[] {
  return [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Merge events from multiple sources
 */
export function mergeEvents(...eventArrays: UnifiedEvent[][]): UnifiedEvent[] {
  return eventArrays.flat();
}
