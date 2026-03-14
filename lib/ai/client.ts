/**
 * Shared AI client utilities
 * Provides Anthropic client creation and common helpers
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  APIError,
  AuthenticationError,
  RateLimitError,
  BadRequestError,
} from '@anthropic-ai/sdk';
import { AI_MODEL_CONFIG } from './config';

/**
 * Parse Anthropic API error into a user-friendly message
 */
export function parseAPIError(error: unknown): string {
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

  return 'Unknown error occurred';
}

/**
 * Check if an error is critical (should stop all processing)
 */
export function isCriticalAPIError(error: unknown): boolean {
  return (
    error instanceof AuthenticationError ||
    (error instanceof APIError &&
      (error.message.toLowerCase().includes('credit') ||
        error.message.toLowerCase().includes('balance') ||
        error.message.toLowerCase().includes('billing')))
  );
}

/**
 * Get the model ID for API calls
 */
export function getModelId(): string {
  const modelMap: Record<string, string> = {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6',
    opus: 'claude-opus-4-6',
  };
  return modelMap[AI_MODEL_CONFIG.model] || modelMap.haiku;
}

/**
 * Truncate text to a maximum length
 */
export function truncateBody(body: string, maxLength: number): string {
  if (body.length <= maxLength) {
    return body;
  }
  return body.substring(0, maxLength) + '\n\n[...truncated]';
}

/**
 * Create an Anthropic client instance
 */
export function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}
