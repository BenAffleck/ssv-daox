/**
 * Registry for fetching events from multiple sources
 */

import { getEventSources } from '../config';
import {
  transformICSEvents,
  transformSnapshotProposals,
} from '../logic/event-transformer';
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
      // Recurring events stay as one event carrying their rule; the timeline
      // collapses each series to the occurrences worth showing.
      const rawEvents = await fetchICSFromUrl(source.url);
      return transformICSEvents(rawEvents, source);
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
