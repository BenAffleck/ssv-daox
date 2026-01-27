/**
 * AI-powered event extraction from governance proposals using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  APIError,
  AuthenticationError,
  RateLimitError,
  BadRequestError,
} from '@anthropic-ai/sdk';
import {
  AI_EXTRACTION_CONFIG,
  getAnthropicApiKey,
  getExtractionPrompt,
  isAIExtractionEnabled,
} from './config';
import {
  getCachedExtractions,
  cacheExtractions,
} from './cache';
import {
  AIExtractedEvent,
  AIExtractedEventWithSource,
  AIExtractionResponseSchema,
  ExtractionStats,
  ProposalForExtraction,
} from './types';

/**
 * Parse Anthropic API error into a user-friendly message
 */
function parseAPIError(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Invalid API key. Please check your ANTHROPIC_API_KEY configuration.';
  }

  if (error instanceof RateLimitError) {
    return 'Rate limit exceeded. Please try again in a few minutes.';
  }

  if (error instanceof BadRequestError) {
    const message = error.message.toLowerCase();
    if (message.includes('credit') || message.includes('balance') || message.includes('billing')) {
      return 'Anthropic API credit balance is too low. Please add credits at console.anthropic.com/settings/billing';
    }
    return `API request error: ${error.message}`;
  }

  if (error instanceof APIError) {
    const message = error.message.toLowerCase();
    if (message.includes('credit') || message.includes('balance') || message.includes('billing')) {
      return 'Anthropic API credit balance is too low. Please add credits at console.anthropic.com/settings/billing';
    }
    return `API error: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error occurred during extraction';
}

/**
 * Get the model ID for API calls
 */
function getModelId(): string {
  const modelMap: Record<string, string> = {
    haiku: 'claude-3-5-haiku-20241022',
    sonnet: 'claude-sonnet-4-5-20250929',
    opus: 'claude-opus-4-5-20251101',
  };
  return modelMap[AI_EXTRACTION_CONFIG.model] || modelMap.haiku;
}

/**
 * Format Unix timestamp as ISO date string
 */
function formatProposalDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

/**
 * Truncate proposal body to maximum length
 */
function truncateBody(body: string): string {
  if (body.length <= AI_EXTRACTION_CONFIG.maxProposalBodyLength) {
    return body;
  }
  return (
    body.substring(0, AI_EXTRACTION_CONFIG.maxProposalBodyLength) +
    '\n\n[...truncated]'
  );
}

/**
 * Result of extracting events from a single proposal
 */
interface ProposalExtractionResult {
  events: AIExtractedEvent[];
  error?: string;
}

/**
 * Extract JSON from Claude's response text
 */
function extractJSONFromResponse(text: string): unknown {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON found in response');
}

/**
 * Extract events from a single proposal using Claude API
 * Throws on critical errors (billing, auth) to stop processing
 */
async function extractFromProposal(
  client: Anthropic,
  proposal: ProposalForExtraction
): Promise<ProposalExtractionResult> {
  const proposalEndDate = formatProposalDate(proposal.end);
  const truncatedBody = truncateBody(proposal.body);

  const basePrompt = getExtractionPrompt(
    proposal.id,
    proposal.title,
    proposalEndDate,
    truncatedBody
  );

  // Add JSON output instruction
  const prompt = `${basePrompt}

Respond with ONLY a valid JSON object in this exact format, no other text:
{
  "events": [
    {
      "title": "Event title",
      "date": "YYYY-MM-DD",
      "dateConfidence": "high" | "medium" | "low",
      "description": "What happens",
      "excerpt": "Original text mentioning date",
      "eventType": "milestone" | "deadline" | "launch" | "meeting" | "other"
    }
  ]
}

If no events with specific dates are found, return: {"events": []}`;

  try {
    const message = await client.messages.create({
      model: getModelId(),
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text content from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { events: [] };
    }

    // Parse JSON from response
    const parsed = extractJSONFromResponse(textContent.text);
    const validated = AIExtractionResponseSchema.pick({ events: true }).safeParse(parsed);

    if (validated.success) {
      return { events: validated.data.events };
    }

    console.warn('Failed to validate extraction response:', validated.error);
    return { events: [] };
  } catch (error) {
    console.error(`Failed to extract events from proposal ${proposal.id}:`, error);

    // Parse the error for user-friendly message
    const errorMessage = parseAPIError(error);

    // Check if this is a critical error that should stop all processing
    const isCriticalError =
      error instanceof AuthenticationError ||
      (error instanceof APIError &&
        (error.message.toLowerCase().includes('credit') ||
          error.message.toLowerCase().includes('balance') ||
          error.message.toLowerCase().includes('billing')));

    if (isCriticalError) {
      // Throw to stop processing - this error affects all proposals
      throw new Error(errorMessage);
    }

    // Return error for non-critical issues (single proposal parsing failed, etc.)
    return { events: [], error: errorMessage };
  }
}

/**
 * Add source information to extracted events
 */
function hydrateEvents(
  events: AIExtractedEvent[],
  proposal: ProposalForExtraction
): AIExtractedEventWithSource[] {
  return events.map((event, index) => ({
    ...event,
    id: `ai-${proposal.id}-${index}`,
    sourceProposalId: proposal.id,
    sourceProposalTitle: proposal.title,
    sourceProposalUrl: proposal.link,
  }));
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Options for extracting events from proposals
 */
export interface ExtractEventsOptions {
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
  /** Skip cache and force re-extraction from API */
  skipCache?: boolean;
}

/**
 * Extract timeline events from multiple proposals
 * Uses caching to avoid re-processing previously extracted proposals
 *
 * @param proposals - Array of proposals to extract events from
 * @param options - Extraction options
 * @returns Object with extracted events and statistics
 */
export async function extractEventsFromProposals(
  proposals: ProposalForExtraction[],
  options: ExtractEventsOptions = {}
): Promise<{
  events: AIExtractedEventWithSource[];
  stats: ExtractionStats;
}> {
  const { onProgress, skipCache = false } = options;

  const stats: ExtractionStats = {
    totalProposals: proposals.length,
    proposalsProcessed: 0,
    proposalsFromCache: 0,
    eventsFound: 0,
    errors: 0,
  };

  // Check if feature is enabled
  if (!isAIExtractionEnabled()) {
    console.warn('AI extraction is disabled');
    return { events: [], stats };
  }

  // Check for API key
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { events: [], stats };
  }

  // Initialize the client
  const client = new Anthropic({ apiKey });

  // Separate cached and uncached proposals
  const uncachedProposals: ProposalForExtraction[] = [];
  const allEvents: AIExtractedEventWithSource[] = [];

  if (skipCache) {
    // Skip cache - process all proposals fresh
    uncachedProposals.push(...proposals);
  } else {
    // Get cached extractions
    const proposalIds = proposals.map((p) => p.id);
    const cachedMap = await getCachedExtractions(proposalIds);

    for (const proposal of proposals) {
      const cached = cachedMap.get(proposal.id);
      if (cached !== null && cached !== undefined) {
        // Use cached extraction
        stats.proposalsFromCache++;
        const hydrated = hydrateEvents(cached, proposal);
        allEvents.push(...hydrated);
        stats.eventsFound += hydrated.length;
      } else {
        uncachedProposals.push(proposal);
      }
    }
  }

  // Process uncached proposals
  const newExtractions: Array<{
    proposalId: string;
    events: AIExtractedEvent[];
  }> = [];

  for (let i = 0; i < uncachedProposals.length; i++) {
    const proposal = uncachedProposals[i];

    // Report progress
    if (onProgress) {
      onProgress(
        stats.proposalsFromCache + i + 1,
        stats.totalProposals
      );
    }

    try {
      const result = await extractFromProposal(client, proposal);
      newExtractions.push({ proposalId: proposal.id, events: result.events });

      const hydrated = hydrateEvents(result.events, proposal);
      allEvents.push(...hydrated);
      stats.eventsFound += hydrated.length;
      stats.proposalsProcessed++;

      // Track non-critical errors
      if (result.error) {
        stats.errors++;
        if (!stats.errorMessage) {
          stats.errorMessage = result.error;
        }
      }
    } catch (error) {
      // Critical error - stop processing all proposals
      console.error(`Critical error during extraction:`, error);
      stats.errors++;
      stats.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Don't cache on critical errors - allow retry
      // Return immediately with error
      return { events: allEvents, stats };
    }

    // Add delay between requests to avoid rate limiting
    if (i < uncachedProposals.length - 1) {
      await sleep(AI_EXTRACTION_CONFIG.processingDelayMs);
    }
  }

  // Cache new extractions (only successful ones)
  if (newExtractions.length > 0) {
    await cacheExtractions(newExtractions);
  }

  return { events: allEvents, stats };
}

/**
 * Check if AI extraction is available (enabled and configured)
 */
export function isAIExtractionAvailable(): boolean {
  return isAIExtractionEnabled() && getAnthropicApiKey() !== null;
}
