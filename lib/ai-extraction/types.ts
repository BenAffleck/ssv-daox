/**
 * Type definitions for AI-powered event extraction from proposals
 */

import { z } from 'zod';

/**
 * Event types that can be extracted from proposals
 */
export type AIEventType =
  | 'milestone'
  | 'deadline'
  | 'launch'
  | 'meeting'
  | 'other';

/**
 * Confidence level for extracted dates
 */
export type DateConfidence = 'high' | 'medium' | 'low';

/**
 * Zod schema for a single AI-extracted event
 */
export const AIExtractedEventSchema = z.object({
  title: z.string().describe('Clear, concise event title'),
  date: z.string().describe('ISO 8601 date (YYYY-MM-DD)'),
  dateConfidence: z.enum(['high', 'medium', 'low']).describe(
    'Confidence level: high for exact dates, medium for approximate/calculated, low for inferred'
  ),
  description: z.string().describe('What happens on this date'),
  excerpt: z
    .string()
    .describe('Original text snippet mentioning this date (max 100 chars)'),
  eventType: z
    .enum(['milestone', 'deadline', 'launch', 'meeting', 'other'])
    .describe('Type of event'),
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
  window: TimeWindow
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
  proposals: ProposalForExtraction[]
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
