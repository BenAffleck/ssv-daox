/**
 * AI-powered Q&A against a single governance proposal, using the Claude API.
 */

import { isAIEnabled, getAnthropicApiKey } from '@/lib/ai/config';
import {
  parseAPIError,
  getModelId,
  truncateBody,
  createClient,
  extractJSONFromResponse,
} from '@/lib/ai/client';
import { AI_QNA_CONFIG, getQnaPrompt } from './config';
import { getCachedAnswer, cacheAnswer } from './cache';
import type { QnaRequest, QnaResponse, QnaProposalContext } from './types';
import { ProposalAnswerSchema } from './types';

/**
 * Answer a single question about a proposal, grounded in its text.
 *
 * @param request - The proposal id and the reader's question
 * @param proposal - Proposal text resolved server-side by the caller
 */
export async function answerProposalQuestion(
  request: QnaRequest,
  proposal: QnaProposalContext
): Promise<QnaResponse> {
  // Check cache first
  const cached = await getCachedAnswer(request.proposalId, request.question);
  if (cached) {
    return { answer: cached, fromCache: true };
  }

  // Check if AI is available
  if (!isAIEnabled()) {
    return { answer: null, fromCache: false, error: 'AI features are not enabled' };
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return { answer: null, fromCache: false, error: 'ANTHROPIC_API_KEY is not set' };
  }

  const client = createClient(apiKey);
  const truncatedBody = truncateBody(proposal.body, AI_QNA_CONFIG.maxBodyLength);
  const prompt = getQnaPrompt(
    proposal.title,
    truncatedBody,
    proposal.choices,
    request.question
  );

  try {
    const message = await client.messages.create({
      model: getModelId(),
      max_tokens: AI_QNA_CONFIG.maxAnswerTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { answer: null, fromCache: false, error: 'No text in API response' };
    }

    const parsed = extractJSONFromResponse(textContent.text);
    const validated = ProposalAnswerSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('Failed to validate answer response:', validated.error);
      return { answer: null, fromCache: false, error: 'Invalid response format' };
    }

    await cacheAnswer(request.proposalId, request.question, validated.data);

    return { answer: validated.data, fromCache: false };
  } catch (error) {
    console.error(
      `Failed to answer question for proposal ${request.proposalId}:`,
      error
    );
    return { answer: null, fromCache: false, error: parseAPIError(error) };
  }
}

/**
 * Check if the proposal Q&A feature is available
 */
export function isProposalQnaAvailable(): boolean {
  return isAIEnabled() && getAnthropicApiKey() !== null;
}
