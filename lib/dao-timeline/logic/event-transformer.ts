/**
 * Transform raw events into unified events
 */

import {
  EventSource,
  EventSourceConfig,
  RawICSEvent,
  UnifiedEvent,
  SerializedEvent,
} from '../types';
import { SnapshotTimelineProposal } from '@/lib/snapshot/types';

/**
 * Transform a raw ICS event into a UnifiedEvent
 */
export function transformICSEvent(
  raw: RawICSEvent,
  source: EventSourceConfig
): UnifiedEvent {
  return {
    id: `${source.id}-${raw.uid}`,
    sourceId: source.id,
    title: raw.summary,
    description: raw.description,
    startDate: raw.dtstart,
    endDate: raw.dtend,
    isAllDay: raw.isAllDay,
    source: EventSource.ICS,
    sourceName: source.name,
    sourceUrl: raw.url,
    location: raw.location,
    isRecurring: raw.rrule !== null,
    recurrenceId: raw.rrule ? raw.uid : null,
    metadata: {
      originalUid: raw.uid,
      rrule: raw.rrule,
    },
  };
}

/**
 * Transform multiple raw ICS events from a source
 */
export function transformICSEvents(
  rawEvents: RawICSEvent[],
  source: EventSourceConfig
): UnifiedEvent[] {
  return rawEvents.map((raw) => transformICSEvent(raw, source));
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncateText(text: string | null, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Transform a Snapshot proposal into a UnifiedEvent
 */
export function transformSnapshotProposal(
  proposal: SnapshotTimelineProposal,
  source: EventSourceConfig,
  spaceId: string
): UnifiedEvent {
  // Use the link from Snapshot if available, otherwise construct it
  const proposalUrl =
    proposal.link ||
    `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`;

  return {
    id: `${source.id}-${proposal.id}`,
    sourceId: source.id,
    title: proposal.title,
    description: truncateText(proposal.body, 500),
    startDate: new Date(proposal.start * 1000),
    endDate: new Date(proposal.end * 1000),
    isAllDay: false,
    source: EventSource.SNAPSHOT_PROPOSALS,
    sourceName: source.name,
    sourceUrl: proposalUrl,
    location: null,
    isRecurring: false,
    recurrenceId: null,
    metadata: {
      state: proposal.state,
      created: proposal.created,
      spaceId,
    },
  };
}

/**
 * Transform multiple Snapshot proposals from a source
 */
export function transformSnapshotProposals(
  proposals: SnapshotTimelineProposal[],
  source: EventSourceConfig,
  spaceId: string
): UnifiedEvent[] {
  return proposals.map((proposal) =>
    transformSnapshotProposal(proposal, source, spaceId)
  );
}

/**
 * Serialize a UnifiedEvent for client-side use
 */
export function serializeEvent(event: UnifiedEvent): SerializedEvent {
  return {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
  };
}

/**
 * Deserialize a SerializedEvent back to UnifiedEvent
 */
export function deserializeEvent(event: SerializedEvent): UnifiedEvent {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
  };
}

/**
 * Serialize multiple events
 */
export function serializeEvents(events: UnifiedEvent[]): SerializedEvent[] {
  return events.map(serializeEvent);
}

/**
 * Deserialize multiple events
 */
export function deserializeEvents(events: SerializedEvent[]): UnifiedEvent[] {
  return events.map(deserializeEvent);
}
