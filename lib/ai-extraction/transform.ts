/**
 * Transform AI-extracted events into UnifiedEvent format for the timeline
 */

import {
  EventSource,
  SeriesInfo,
  SerializedEvent,
  UnifiedEvent,
} from '../dao-timeline/types';
import {
  buildRRule,
  buildSeriesInfo,
} from '../dao-timeline/logic/recurrence-expander';
import { parseYMD } from '../dao-timeline/utils/date-utils';
import { AIExtractedEventWithSource, AIRecurrence } from './types';

/**
 * AI extraction source ID used for filtering
 */
export const AI_EXTRACTION_SOURCE_ID = 'ai-insights';

/**
 * AI extraction source name for display
 */
export const AI_EXTRACTION_SOURCE_NAME = 'AI Insights';

/**
 * Turn the model's structured recurrence into the SeriesInfo an event carries.
 *
 * Going through `buildRRule` rather than letting the model emit an RRULE
 * directly means AI-extracted series and ICS series are the same thing by the
 * time the timeline sees them, and collapse only has one code path.
 */
export function toSeriesInfo(
  recurrence: AIRecurrence | null | undefined
): SeriesInfo | null {
  if (!recurrence) return null;

  return buildSeriesInfo(
    buildRRule({
      freq: recurrence.freq,
      interval: recurrence.interval,
      count: recurrence.count ?? null,
      until: recurrence.until ? parseYMD(recurrence.until) : null,
      byDay: recurrence.byDay?.length ? [...recurrence.byDay] : null,
    })
  );
}

/**
 * Transform an AI-extracted event into a UnifiedEvent
 */
export function transformAIExtractedEvent(
  event: AIExtractedEventWithSource
): UnifiedEvent {
  // Parse the date from ISO format
  const eventDate = new Date(event.date);
  const recurrence = toSeriesInfo(event.recurrence);

  return {
    id: event.id,
    sourceId: AI_EXTRACTION_SOURCE_ID,
    title: event.title,
    description: event.description,
    startDate: eventDate,
    endDate: null, // AI-extracted events are point-in-time
    isAllDay: true,
    source: EventSource.AI_EXTRACTED,
    sourceName: AI_EXTRACTION_SOURCE_NAME,
    sourceUrl: event.sourceProposalUrl,
    location: null,
    isRecurring: recurrence !== null,
    recurrenceId: recurrence ? event.id : null,
    recurrence,
    metadata: {
      sourceProposalId: event.sourceProposalId,
      sourceProposalTitle: event.sourceProposalTitle,
      sourceProposalUrl: event.sourceProposalUrl,
      excerpt: event.excerpt,
      confidence: event.dateConfidence,
      eventType: event.eventType,
    },
  };
}

/**
 * Transform multiple AI-extracted events into UnifiedEvents
 */
export function transformAIExtractedEvents(
  events: AIExtractedEventWithSource[]
): UnifiedEvent[] {
  return events.map(transformAIExtractedEvent);
}

/**
 * Serialize an AI-extracted event for client-side use
 */
export function serializeAIExtractedEvent(
  event: AIExtractedEventWithSource
): SerializedEvent {
  const unified = transformAIExtractedEvent(event);
  return {
    ...unified,
    startDate: unified.startDate.toISOString(),
    endDate: unified.endDate?.toISOString() ?? null,
  };
}

/**
 * Serialize multiple AI-extracted events
 */
export function serializeAIExtractedEvents(
  events: AIExtractedEventWithSource[]
): SerializedEvent[] {
  return events.map(serializeAIExtractedEvent);
}
