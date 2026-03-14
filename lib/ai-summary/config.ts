/**
 * Configuration for AI proposal summary generation
 */

/**
 * AI summary configuration
 */
export const AI_SUMMARY_CONFIG = {
  /**
   * Cache file path (relative to project root)
   */
  cacheFilePath: '.cache/ai-summaries.json',

  /**
   * Cache version - increment when schema changes
   */
  cacheVersion: 1,

  /**
   * Maximum age for cached summaries (in days)
   */
  maxCacheAgeDays: 7,

  /**
   * Maximum proposal body length to process (characters)
   */
  maxBodyLength: 10000,
} as const;

/**
 * Get the prompt for generating a proposal summary
 */
export function getSummaryPrompt(
  title: string,
  body: string,
  choices: string[]
): string {
  const choicesList = choices.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `You are summarizing a DAO governance proposal for voters who need to quickly understand what they're voting on.

Provide:
1. A TL;DR: 2-3 concise sentences explaining what this proposal does and why it matters.
2. For each voting choice, a brief explanation of what choosing it means.

Keep language simple and neutral. Focus on the practical impact.

Proposal Title: ${title}

Voting Choices:
${choicesList}

--- Proposal Body ---
${body}

Respond with ONLY a valid JSON object in this exact format, no other text:
{
  "tldr": "2-3 sentence summary of the proposal",
  "choiceExplanations": [
    { "choice": "Choice label", "explanation": "What this choice means" }
  ]
}`;
}
