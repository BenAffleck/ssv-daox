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
  choiceExplanations: z
    .array(ChoiceExplanationSchema)
    .describe('Explanation of each voting choice'),
});

/**
 * Type inference from schemas
 */
export type ChoiceExplanation = z.infer<typeof ChoiceExplanationSchema>;
export type ProposalSummary = z.infer<typeof ProposalSummarySchema>;
