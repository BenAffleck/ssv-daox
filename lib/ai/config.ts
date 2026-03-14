/**
 * Shared AI configuration
 * Central place for AI feature flags and API key management
 */

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return process.env.AI_EXTRACTION_ENABLED === 'true';
}

/**
 * Get Anthropic API key
 */
export function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || null;
}

/**
 * Shared AI model configuration
 */
export const AI_MODEL_CONFIG = {
  /**
   * Model to use for AI features
   * haiku is cost-efficient and fast for text extraction/summarization
   */
  model: (process.env.AI_EXTRACTION_MODEL || 'haiku') as
    | 'haiku'
    | 'sonnet'
    | 'opus',
} as const;
