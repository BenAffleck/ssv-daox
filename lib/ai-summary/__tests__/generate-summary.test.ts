/**
 * Unit tests for AI summary generation
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
  parseAPIError: vi.fn((e: unknown) => e instanceof Error ? e.message : 'Unknown error'),
}));

vi.mock('../cache', () => ({
  getCachedSummary: vi.fn(),
  cacheSummary: vi.fn(),
}));

import { generateProposalSummary, isAISummaryAvailable } from '../generate-summary';
import { isAIEnabled, getAnthropicApiKey } from '@/lib/ai/config';
import { createClient } from '@/lib/ai/client';
import { getCachedSummary, cacheSummary } from '../cache';
import type { SummaryRequest } from '../types';

const mockRequest: SummaryRequest = {
  proposalId: 'proposal-123',
  title: 'Test Proposal',
  body: 'This is a test proposal body.',
  choices: ['For', 'Against', 'Abstain'],
};

const mockSummaryResponse = {
  tldr: 'This proposal does something important.',
  choiceExplanations: [
    { choice: 'For', explanation: 'Approve it' },
    { choice: 'Against', explanation: 'Reject it' },
    { choice: 'Abstain', explanation: 'No opinion' },
  ],
};

describe('generateProposalSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached summary if available', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(mockSummaryResponse);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toEqual(mockSummaryResponse);
    expect(result.fromCache).toBe(true);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('should return error when AI is not enabled', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(false);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toBeNull();
    expect(result.error).toContain('not enabled');
  });

  it('should return error when API key is missing', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue(null);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toBeNull();
    expect(result.error).toContain('ANTHROPIC_API_KEY');
  });

  it('should call API and return summary on success', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');

    const mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify(mockSummaryResponse),
          }],
        }),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toEqual(mockSummaryResponse);
    expect(result.fromCache).toBe(false);
    expect(cacheSummary).toHaveBeenCalledWith('proposal-123', mockSummaryResponse);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');

    const mockClient = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error('API failed')),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toBeNull();
    expect(result.error).toBe('API failed');
    expect(cacheSummary).not.toHaveBeenCalled();
  });

  it('should handle invalid API response format', async () => {
    vi.mocked(getCachedSummary).mockResolvedValue(null);
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');

    const mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '{"invalid": "response"}',
          }],
        }),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    const result = await generateProposalSummary(mockRequest);

    expect(result.summary).toBeNull();
    expect(result.error).toContain('Invalid response format');
  });
});

describe('isAISummaryAvailable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when AI is enabled and API key exists', () => {
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    expect(isAISummaryAvailable()).toBe(true);
  });

  it('should return false when AI is disabled', () => {
    vi.mocked(isAIEnabled).mockReturnValue(false);
    vi.mocked(getAnthropicApiKey).mockReturnValue('test-key');
    expect(isAISummaryAvailable()).toBe(false);
  });

  it('should return false when API key is missing', () => {
    vi.mocked(isAIEnabled).mockReturnValue(true);
    vi.mocked(getAnthropicApiKey).mockReturnValue(null);
    expect(isAISummaryAvailable()).toBe(false);
  });
});
