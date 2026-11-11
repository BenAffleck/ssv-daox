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
