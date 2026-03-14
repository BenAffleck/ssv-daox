/**
 * AI-powered proposal summary generation using Claude API
 */

import { isAIEnabled, getAnthropicApiKey } from '@/lib/ai/config';
import {
  parseAPIError,
  getModelId,
  truncateBody,
  createClient,
} from '@/lib/ai/client';
import { AI_SUMMARY_CONFIG, getSummaryPrompt } from './config';
import { getCachedSummary, cacheSummary } from './cache';
import type { SummaryRequest, SummaryResponse } from './types';
import { ProposalSummarySchema } from './types';

/**
 * Extract JSON from Claude's response text
 */
function extractJSONFromResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON found in response');
}

/**
 * Generate a TL;DR summary for a proposal
 */
export async function generateProposalSummary(
  request: SummaryRequest
): Promise<SummaryResponse> {
  // Check cache first
  const cached = await getCachedSummary(request.proposalId);
  if (cached) {
    return { summary: cached, fromCache: true };
  }

  // Check if AI is available
  if (!isAIEnabled()) {
    return { summary: null, fromCache: false, error: 'AI features are not enabled' };
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return { summary: null, fromCache: false, error: 'ANTHROPIC_API_KEY is not set' };
  }

  const client = createClient(apiKey);
  const truncatedBody = truncateBody(request.body, AI_SUMMARY_CONFIG.maxBodyLength);
  const prompt = getSummaryPrompt(request.title, truncatedBody, request.choices);

  try {
    const message = await client.messages.create({
      model: getModelId(),
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { summary: null, fromCache: false, error: 'No text in API response' };
    }

    const parsed = extractJSONFromResponse(textContent.text);
    const validated = ProposalSummarySchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('Failed to validate summary response:', validated.error);
      return { summary: null, fromCache: false, error: 'Invalid response format' };
    }

    // Cache the result
    await cacheSummary(request.proposalId, validated.data);

    return { summary: validated.data, fromCache: false };
  } catch (error) {
    console.error(`Failed to generate summary for proposal ${request.proposalId}:`, error);
    return { summary: null, fromCache: false, error: parseAPIError(error) };
  }
}

/**
 * Check if AI summary feature is available
 */
export function isAISummaryAvailable(): boolean {
  return isAIEnabled() && getAnthropicApiKey() !== null;
}
