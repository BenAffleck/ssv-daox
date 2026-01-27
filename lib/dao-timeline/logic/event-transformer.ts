/**
 * Transform raw ICS events into unified events
 */

import {
  EventSource,
  EventSourceConfig,
  RawICSEvent,
  UnifiedEvent,
  SerializedEvent,
} from '../types';

/**
 * Transform a raw ICS event into a UnifiedEvent
 */
export function transformICSEvent(
  raw: RawICSEvent,
  source: EventSourceConfig
): UnifiedEvent {
  return {
    id: `${source.id}-${raw.uid}`,
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
