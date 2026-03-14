/**
 * Type definitions for AI proposal summary generation
 */

import { z } from 'zod';

/**
 * Zod schema for a choice explanation
 */
export const ChoiceExplanationSchema = z.object({
  choice: z.string().describe('The voting choice label'),
  explanation: z.string().describe('Brief explanation of what this choice means'),
});

/**
 * Zod schema for a proposal summary
 */
export const ProposalSummarySchema = z.object({
  tldr: z.string().describe('2-3 sentence TL;DR of the proposal'),
  choiceExplanations: z.array(ChoiceExplanationSchema).describe(
    'Explanation of each voting choice'
  ),
});

/**
 * Type inference from schemas
 */
export type ChoiceExplanation = z.infer<typeof ChoiceExplanationSchema>;
export type ProposalSummary = z.infer<typeof ProposalSummarySchema>;

/**
 * Request to generate a proposal summary
 */
export interface SummaryRequest {
  proposalId: string;
  title: string;
  body: string;
  choices: string[];
}

/**
 * Response from summary generation
 */
export interface SummaryResponse {
  summary: ProposalSummary | null;
  fromCache: boolean;
  error?: string;
}

/**
 * Cache entry for a proposal summary
 */
export interface CachedSummary {
  proposalId: string;
  cachedAt: string; // ISO date string
  summary: ProposalSummary;
}

/**
 * Full summary cache structure
 */
export interface SummaryCache {
  version: number;
  summaries: Record<string, CachedSummary>;
}
