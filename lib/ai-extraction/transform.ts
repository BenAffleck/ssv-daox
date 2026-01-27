/**
 * Transform AI-extracted events into UnifiedEvent format for the timeline
 */

import { EventSource, SerializedEvent, UnifiedEvent } from '../dao-timeline/types';
import { AIExtractedEventWithSource } from './types';

/**
 * AI extraction source ID used for filtering
 */
export const AI_EXTRACTION_SOURCE_ID = 'ai-insights';

/**
 * AI extraction source name for display
 */
export const AI_EXTRACTION_SOURCE_NAME = 'AI Insights';

/**
 * Transform an AI-extracted event into a UnifiedEvent
 */
export function transformAIExtractedEvent(
  event: AIExtractedEventWithSource
): UnifiedEvent {
  // Parse the date from ISO format
  const eventDate = new Date(event.date);

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
    isRecurring: false,
    recurrenceId: null,
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
