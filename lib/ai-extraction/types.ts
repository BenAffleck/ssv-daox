/**
 * Type definitions for AI-powered event extraction from proposals
 */

import { z } from 'zod';

/**
 * Event types that can be extracted from proposals
 */
export type AIEventType = 'milestone' | 'deadline' | 'launch' | 'meeting' | 'other';

/**
 * Confidence level for extracted dates
 */
export type DateConfidence = 'high' | 'medium' | 'low';

/**
 * Zod schema for a recurrence the model detected in a proposal.
 *
 * The model emits structure rather than a raw RRULE so a malformed rule can
 * never reach the occurrence engine; `buildRRule` turns this into the RRULE.
 */
export const AIRecurrenceSchema = z.object({
  /**
   * Who the cadence is for.
   *
   * A recurring event earns a permanent slot on the timeline, so it has to be
   * worth one to the DAO at large. Role- and team-internal cadences are
   * dropped. Defaults to 'internal' so an unlabelled series fails closed —
   * the timeline stays crisp rather than filling with other teams' standups.
   */
  audience: z.enum(['community', 'internal']).default('internal'),
  freq: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).max(52).default(1),
  byDay: z.array(z.enum(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'])).nullish(),
  count: z.number().int().min(2).max(400).nullish(),
  until: z.string().nullish().describe('ISO 8601 date (YYYY-MM-DD)'),
});

/**
 * Zod schema for a single AI-extracted event
 */
export const AIExtractedEventSchema = z.object({
  title: z.string().describe('Clear, concise event title'),
  date: z.string().describe('ISO 8601 date (YYYY-MM-DD)'),
  dateConfidence: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'Confidence level: high for exact dates, medium for approximate/calculated, low for inferred',
    ),
  description: z.string().describe('What happens on this date'),
  excerpt: z.string().describe('Original text snippet mentioning this date (max 100 chars)'),
  eventType: z
    .enum(['milestone', 'deadline', 'launch', 'meeting', 'other'])
    .describe('Type of event'),
  // Nullish so extractions cached before recurrence existed still validate.
  recurrence: AIRecurrenceSchema.nullish().describe(
    'Set only when the event repeats on a regular cadence; null otherwise',
  ),
});

/**
 * Zod schema for the full extraction response
 */
export const AIExtractionResponseSchema = z.object({
  events: z.array(AIExtractedEventSchema),
  extractionMetadata: z.object({
    proposalId: z.string(),
    eventsFound: z.number(),
    processingNote: z.string().optional(),
  }),
});

/**
 * Type inference from schemas
 */
export type AIRecurrence = z.infer<typeof AIRecurrenceSchema>;
export type AIExtractedEvent = z.infer<typeof AIExtractedEventSchema>;
export type AIExtractionResponse = z.infer<typeof AIExtractionResponseSchema>;

/**
 * Fully hydrated AI-extracted event with source information
 */
export interface AIExtractedEventWithSource extends AIExtractedEvent {
  id: string;
  sourceProposalId: string;
  sourceProposalTitle: string;
  sourceProposalUrl: string;
}

/**
 * Input data for extraction - a simplified proposal
 */
export interface ProposalForExtraction {
  id: string;
  title: string;
  body: string;
  end: number; // Unix timestamp when proposal ended/passed
  created: number; // Unix timestamp when proposal was created
  link: string;
}

/**
 * Time window options for AI extraction
 */
export type TimeWindow = '30d' | '90d' | '6m' | 'all';

/**
 * Configuration for a time window option
 */
export interface TimeWindowConfig {
  id: TimeWindow;
  label: string;
  days: number | null; // null = all time
}

/**
 * Available time window options
 */
export const TIME_WINDOWS: TimeWindowConfig[] = [
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: '6m', label: 'Last 6 months', days: 180 },
  { id: 'all', label: 'All time', days: null },
];

/**
 * Filter proposals by time window based on created timestamp
 */
export function filterProposalsByTimeWindow(
  proposals: ProposalForExtraction[],
  window: TimeWindow,
): ProposalForExtraction[] {
  if (window === 'all') return proposals;

  const config = TIME_WINDOWS.find((w) => w.id === window);
  if (!config?.days) return proposals;

  const cutoffDate = Date.now() - config.days * 24 * 60 * 60 * 1000;
  return proposals.filter((p) => p.created * 1000 >= cutoffDate);
}

/**
 * Get proposal counts for each time window
 */
export function getProposalCountsByWindow(
  proposals: ProposalForExtraction[],
): Record<TimeWindow, number> {
  return {
    '30d': filterProposalsByTimeWindow(proposals, '30d').length,
    '90d': filterProposalsByTimeWindow(proposals, '90d').length,
    '6m': filterProposalsByTimeWindow(proposals, '6m').length,
    all: proposals.length,
  };
}

/**
 * Statistics about an extraction run
 */
export interface ExtractionStats {
  totalProposals: number;
  proposalsProcessed: number;
  proposalsFromCache: number;
  eventsFound: number;
  /** Recurring events dropped as internal to a role or team. */
  eventsFiltered: number;
  errors: number;
  /** User-friendly error message if extraction failed */
  errorMessage?: string;
}

/**
 * Cache entry structure for storing extracted events
 */
export interface CachedExtraction {
  proposalId: string;
  extractedAt: string; // ISO date string
  events: AIExtractedEvent[];
}

/**
 * Full cache structure
 */
export interface ExtractionCache {
  version: number;
  extractions: Record<string, CachedExtraction>;
}
