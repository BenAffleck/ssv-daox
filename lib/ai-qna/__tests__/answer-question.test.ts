/**
 * Unit tests for AI proposal Q&A
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the ai modules before imports
vi.mock('@/lib/ai/config', () => ({
  isAIEnabled: vi.fn(),
  getAnthropicApiKey: vi.fn(),
}));

vi.mock('@/lib/ai/client', () => ({
  createClient: vi.fn(),
  getModelId: vi.fn().mockReturnValue('claude-haiku-4-5-20251001'),
  truncateBody: vi.fn((body: string, _max: number) => body),
  parseAPIError: vi.fn((e: unknown) => (e instanceof Error ? e.message : 'Unknown error')),
  extractJSONFromResponse: vi.fn((text: string) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No JSON found in response');
  }),
}));

vi.mock('../cache', () => ({
  getCachedAnswer: vi.fn(),
  cacheAnswer: vi.fn(),
}));

import { answerProposalQuestion, isProposalQnaAvailable } from '../answer-question';
import { isAIEnabled, getAnthropicApiKey } from '@/lib/ai/config';
import { createClient } from '@/lib/ai/client';
import { getCachedAnswer, cacheAnswer } from '../cache';
import type { QnaRequest, QnaProposalContext } from '../types';

const mockRequest: QnaRequest = {
  proposalId: 'proposal-123',
  question: 'Who executes this if it passes?',
};

const mockProposal: QnaProposalContext = {
  id: 'proposal-123',
  title: 'Test Proposal',
  body: 'The multisig executes the transfer within 14 days of the vote closing.',
  choices: ['For', 'Against', 'Abstain'],
};

const mockAnswer = {
  answer: 'The multisig executes the transfer within 14 days.',
  answered: true,
  supportingQuotes: ['The multisig executes the transfer within 14 days'],
};

/** Build a fake Anthropic client whose single text block is `text`. */
function mockClientReturning(text: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text }] }),
    },
  };
}

describe('answerProposalQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a cached answer if available', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(mockAnswer);

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toEqual(mockAnswer);
    expect(result.fromCache).toBe(true);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('should return an error when AI is not enabled', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(false);

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toBeNull();
    expect(result.error).toContain('not enabled');
  });

  it('should return an error when the API key is missing', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue(null);

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toBeNull();
    expect(result.error).toContain('ANTHROPIC_API_KEY');
  });

  it('should call the API and cache the answer on success', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    vi.mocked(createClient).mockReturnValue(
      mockClientReturning(JSON.stringify(mockAnswer)) as any
    );

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toEqual(mockAnswer);
    expect(result.fromCache).toBe(false);
    expect(cacheAnswer).toHaveBeenCalledWith(
      'proposal-123',
      'Who executes this if it passes?',
      mockAnswer
    );
  });

  it('should preserve an "answered: false" response rather than treating it as a failure', async () => {
    const declined = {
      answer: 'The proposal text does not cover live vote results.',
      answered: false,
      supportingQuotes: [],
    };
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    vi.mocked(createClient).mockReturnValue(
      mockClientReturning(JSON.stringify(declined)) as any
    );

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toEqual(declined);
    expect(result.error).toBeUndefined();
  });

  it('should default supportingQuotes to an empty array when omitted', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    vi.mocked(createClient).mockReturnValue(
      mockClientReturning('{"answer": "Yes.", "answered": true}') as any
    );

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer?.supportingQuotes).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    vi.mocked(createClient).mockReturnValue({
      messages: { create: vi.fn().mockRejectedValue(new Error('API failed')) },
    } as any);

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toBeNull();
    expect(result.error).toBe('API failed');
    expect(cacheAnswer).not.toHaveBeenCalled();
  });

  it('should handle an invalid API response format', async () => {
    vi.mocked(getCachedAnswer).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    vi.mocked(createClient).mockReturnValue(
      mockClientReturning('{"invalid": "response"}') as any
    );

    const result = await answerProposalQuestion(mockRequest, mockProposal);

    expect(result.answer).toBeNull();
    expect(result.error).toContain('Invalid response format');
    expect(cacheAnswer).not.toHaveBeenCalled();
  });
});

describe('isProposalQnaAvailable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when AI is enabled and an API key exists', () => {
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    expect(isProposalQnaAvailable()).toBe(true);
  });

  it('should return false when AI is disabled', () => {
    vi.mocked(isAIEnabled).mockReturnValue(false);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    expect(isProposalQnaAvailable()).toBe(false);
  });

  it('should return false when the API key is missing', () => {
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue(null);
    expect(isProposalQnaAvailable()).toBe(false);
  });
});
