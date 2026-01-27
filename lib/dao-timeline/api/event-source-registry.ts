/**
 * Registry for fetching events from multiple sources
 */

import { getEventSources } from '../config';
import {
  transformICSEvents,
  transformSnapshotProposals,
} from '../logic/event-transformer';
import { expandAllRecurringEvents } from '../logic/recurrence-expander';
import { mergeEvents } from '../logic/event-aggregator';
import { EventSource, EventSourceConfig, UnifiedEvent } from '../types';
import { fetchICSFromUrl } from './fetch-ics';
import { fetchTimelineProposals } from '@/lib/snapshot/api/fetch-timeline-proposals';

/**
 * Fetch events from a single source
 */
async function fetchFromSource(
  source: EventSourceConfig
): Promise<UnifiedEvent[]> {
  switch (source.type) {
    case EventSource.ICS: {
      const rawEvents = await fetchICSFromUrl(source.url);
      const transformed = transformICSEvents(rawEvents, source);
      return expandAllRecurringEvents(transformed);
    }
    case EventSource.SNAPSHOT_PROPOSALS: {
      // source.url contains the space ID for Snapshot sources
      const spaceId = source.url;
      const proposals = await fetchTimelineProposals(spaceId);
      return transformSnapshotProposals(proposals, source, spaceId);
    }
    default:
      console.warn(`Unknown source type: ${source.type}`);
      return [];
  }
}

/**
 * Fetch events from all configured sources in parallel
 */
export async function fetchAllEvents(): Promise<UnifiedEvent[]> {
  const sources = getEventSources();

  if (sources.length === 0) {
    console.warn('No event sources configured');
    return [];
  }

  // Fetch from all sources in parallel
  const eventArrays = await Promise.all(
    sources.map((source) => fetchFromSource(source))
  );

  // Merge all events
  return mergeEvents(...eventArrays);
}

/**
 * Get configured source metadata for UI display
 */
export function getSourcesMetadata(): Array<{
  id: string;
  name: string;
  color?: string;
}> {
  return getEventSources().map((source) => ({
    id: source.id,
    name: source.name,
    color: source.color,
  }));
}
