/**
 * Unit tests for AI extraction configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isAIExtractionEnabled,
  getAnthropicApiKey,
  getExtractionPrompt,
  AI_EXTRACTION_CONFIG,
} from '../config';

describe('AI Extraction Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAIExtractionEnabled', () => {
    it('should return false when AI_EXTRACTION_ENABLED is not set', () => {
      delete process.env.AI_EXTRACTION_ENABLED;
      expect(isAIExtractionEnabled()).toBe(false);
    });

    it('should return true when AI_EXTRACTION_ENABLED is "true"', () => {
      process.env.AI_EXTRACTION_ENABLED = 'true';
      expect(isAIExtractionEnabled()).toBe(true);
    });

    it('should return false when AI_EXTRACTION_ENABLED is "false"', () => {
      process.env.AI_EXTRACTION_ENABLED = 'false';
      expect(isAIExtractionEnabled()).toBe(false);
    });
  });

  describe('getAnthropicApiKey', () => {
    it('should return null when ANTHROPIC_API_KEY is not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(getAnthropicApiKey()).toBeNull();
    });

    it('should return the API key when set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      expect(getAnthropicApiKey()).toBe('test-api-key');
    });
  });

  describe('AI_EXTRACTION_CONFIG', () => {
    it('should have default configuration values', () => {
      expect(AI_EXTRACTION_CONFIG).toMatchObject({
        maxBudgetUsd: expect.any(Number),
        perProposalBudgetUsd: 0.10,
        model: expect.stringMatching(/^(haiku|sonnet|opus)$/),
        processingDelayMs: 100,
        maxProposalBodyLength: 10000,
        cacheVersion: 1,
        maxCacheAgeDays: 30,
      });
    });

    it('should have valid cache file path', () => {
      expect(AI_EXTRACTION_CONFIG.cacheFilePath).toBe('.cache/ai-extractions.json');
    });
  });

  describe('getExtractionPrompt', () => {
    it('should generate a prompt with all required information', () => {
      const prompt = getExtractionPrompt(
        'proposal-123',
        'Test Proposal',
        '2026-02-15',
        'This is the proposal body with a deadline on March 1st, 2026.'
      );

      expect(prompt).toContain('proposal-123');
      expect(prompt).toContain('Test Proposal');
      expect(prompt).toContain('2026-02-15');
      expect(prompt).toContain('This is the proposal body');
      expect(prompt).toContain('March 1st, 2026');
    });

    it('should include instructions for relative date interpretation', () => {
      const prompt = getExtractionPrompt(
        'id',
        'Title',
        '2026-02-15',
        'Body'
      );

      expect(prompt).toContain('within 2 weeks');
      expect(prompt).toContain('30 days after approval');
      expect(prompt).toContain('immediately upon passing');
      expect(prompt).toContain('2026-02-15');
    });

    it('should include confidence level guidance', () => {
      const prompt = getExtractionPrompt(
        'id',
        'Title',
        '2026-02-15',
        'Body'
      );

      expect(prompt).toContain('dateConfidence');
      expect(prompt).toContain('high');
      expect(prompt).toContain('medium');
      expect(prompt).toContain('low');
    });

    it('should include event type options', () => {
      const prompt = getExtractionPrompt(
        'id',
        'Title',
        '2026-02-15',
        'Body'
      );

      expect(prompt).toContain('milestone');
      expect(prompt).toContain('deadline');
      expect(prompt).toContain('launch');
      expect(prompt).toContain('meeting');
    });
  });
});
