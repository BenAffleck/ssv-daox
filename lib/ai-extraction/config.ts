/**
 * Configuration for AI event extraction
 */

/**
 * Check if AI extraction feature is enabled
 */
export function isAIExtractionEnabled(): boolean {
  return process.env.AI_EXTRACTION_ENABLED === 'true';
}

/**
 * Get Anthropic API key
 */
export function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || null;
}

/**
 * AI extraction configuration
 */
export const AI_EXTRACTION_CONFIG = {
  /**
   * Maximum budget for a single extraction run (in USD)
   * Default: $1.00
   */
  maxBudgetUsd: parseFloat(process.env.AI_EXTRACTION_MAX_BUDGET || '1.00'),

  /**
   * Budget limit per individual proposal (in USD)
   * This ensures no single proposal consumes too much budget
   */
  perProposalBudgetUsd: 0.10,

  /**
   * Model to use for extraction
   * haiku is cost-efficient and fast for text extraction
   */
  model: (process.env.AI_EXTRACTION_MODEL || 'haiku') as
    | 'haiku'
    | 'sonnet'
    | 'opus',

  /**
   * Delay between processing proposals (ms)
   * Helps with rate limiting
   */
  processingDelayMs: 100,

  /**
   * Maximum proposal body length to process (characters)
   * Longer bodies are truncated to manage costs
   */
  maxProposalBodyLength: 10000,

  /**
   * Cache file path (relative to project root)
   */
  cacheFilePath: '.cache/ai-extractions.json',

  /**
   * Cache version - increment when schema changes
   */
  cacheVersion: 1,

  /**
   * Maximum age for cached extractions (in days)
   * Older extractions will be re-processed
   */
  maxCacheAgeDays: 30,
} as const;

/**
 * Get the prompt for extracting events from a proposal
 */
export function getExtractionPrompt(
  proposalId: string,
  proposalTitle: string,
  proposalEndDate: string,
  proposalBody: string
): string {
  return `You are analyzing a DAO governance proposal to extract timeline events.

Extract any dates, deadlines, milestones, or scheduled events mentioned in the proposal text.
Only extract events with specific dates (not vague references like "soon" or "later").

IMPORTANT: This proposal passed on ${proposalEndDate}. When the proposal mentions relative
timeframes without specifying a start date (e.g., "within 2 weeks", "30 days after approval",
"Phase 1 starts immediately"), use the proposal passing date (${proposalEndDate}) as the
reference point to calculate absolute dates.

For each event found:
- title: Clear, action-oriented title (e.g., "Testnet Launch", "Funding Deadline")
- date: The specific date in ISO format (YYYY-MM-DD)
- dateConfidence:
  - "high" if exact date given (e.g., "March 15, 2026")
  - "medium" if approximate (e.g., "mid-March", "Q1 2026") or calculated from relative timeframe
  - "low" if inferred from context
- description: What happens on this date
- excerpt: The exact text snippet mentioning this date (max 100 chars)
- eventType: milestone, deadline, launch, meeting, or other

Examples of relative date interpretation (assuming proposal passed on ${proposalEndDate}):
- "within 2 weeks" -> calculate 2 weeks from ${proposalEndDate} (confidence: medium)
- "30 days after approval" -> calculate 30 days from ${proposalEndDate} (confidence: medium)
- "Q2 2026" -> use quarter start date 2026-04-01 (confidence: medium)
- "immediately upon passing" -> use ${proposalEndDate} (confidence: high)

If no timeline events with specific dates are found, return an empty events array.

Proposal ID: ${proposalId}
Proposal Title: ${proposalTitle}
Proposal Passed On: ${proposalEndDate}

--- Proposal Body ---
${proposalBody}`;
}
