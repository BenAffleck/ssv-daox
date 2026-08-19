/**
 * Type definitions for AI proposal Q&A
 */

import { z } from 'zod';

/**
 * Zod schema for an answer to a single question about a proposal.
 *
 * `answered: false` is the model's honest "the proposal text doesn't say"
 * signal — the UI renders it as a distinct state rather than presenting a
 * guess as fact. `supportingQuotes` are verbatim excerpts from the body so a
 * reader can check the answer against the source.
 */
export const ProposalAnswerSchema = z.object({
  answer: z.string().describe('The answer, grounded in the proposal text'),
  answered: z
    .boolean()
    .describe('False when the proposal text does not contain the information asked for'),
  supportingQuotes: z
    .array(z.string())
    .max(3)
    .default([])
    .describe('Up to 3 short verbatim excerpts from the proposal body'),
});

export type ProposalAnswer = z.infer<typeof ProposalAnswerSchema>;

/**
 * Request to answer a question about a proposal.
 *
 * Only the id is accepted from the client — the proposal text is resolved
 * server-side so this endpoint can't be used to summarize arbitrary content.
 */
export interface QnaRequest {
  proposalId: string;
  question: string;
}

/**
 * The proposal fields used to ground an answer. Deliberately static: no live
 * scores, quorum or dates, so answers stay valid for the cache lifetime.
 */
export interface QnaProposalContext {
  id: string;
  title: string;
  body: string;
  choices: string[];
}

/**
 * Response from question answering
 */
export interface QnaResponse {
  answer: ProposalAnswer | null;
  fromCache: boolean;
  error?: string;
}

/**
 * Cache entry for a single answered question
 */
export interface CachedAnswer {
  proposalId: string;
  /** The normalized question, retained for cache inspection/debugging. */
  question: string;
  cachedAt: string; // ISO date string
  answer: ProposalAnswer;
}

/**
 * Full answer cache structure
 */
export interface AnswerCache {
  version: number;
  answers: Record<string, CachedAnswer>;
}
