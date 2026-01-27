/**
 * Unit tests for AI extraction transformation functions
 */

import { describe, it, expect } from 'vitest';
import {
  transformAIExtractedEvent,
  transformAIExtractedEvents,
  serializeAIExtractedEvent,
  serializeAIExtractedEvents,
  AI_EXTRACTION_SOURCE_ID,
  AI_EXTRACTION_SOURCE_NAME,
} from '../transform';
import { EventSource } from '@/lib/dao-timeline/types';
import { AIExtractedEventWithSource } from '../types';

describe('AI Extraction Transform', () => {
  const mockAIEvent: AIExtractedEventWithSource = {
    id: 'ai-test-proposal-0',
    title: 'Testnet Launch',
    date: '2026-03-01',
    dateConfidence: 'high',
    description: 'Deploy testnet infrastructure',
    excerpt: 'Testnet deployment scheduled for March 1st',
    eventType: 'launch',
    sourceProposalId: 'test-proposal',
    sourceProposalTitle: 'Test Proposal',
    sourceProposalUrl: 'https://snapshot.org/#/test/proposal/test-proposal',
  };

  describe('transformAIExtractedEvent', () => {
    it('should transform AI event to UnifiedEvent format', () => {
      const result = transformAIExtractedEvent(mockAIEvent);

      expect(result).toMatchObject({
        id: 'ai-test-proposal-0',
        sourceId: AI_EXTRACTION_SOURCE_ID,
        title: 'Testnet Launch',
        description: 'Deploy testnet infrastructure',
        isAllDay: true,
        source: EventSource.AI_EXTRACTED,
        sourceName: AI_EXTRACTION_SOURCE_NAME,
        sourceUrl: 'https://snapshot.org/#/test/proposal/test-proposal',
        location: null,
        isRecurring: false,
        recurrenceId: null,
      });

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-03-01');
      expect(result.endDate).toBeNull();
    });

    it('should include metadata with source information', () => {
      const result = transformAIExtractedEvent(mockAIEvent);

      expect(result.metadata).toEqual({
        sourceProposalId: 'test-proposal',
        sourceProposalTitle: 'Test Proposal',
        sourceProposalUrl: 'https://snapshot.org/#/test/proposal/test-proposal',
        excerpt: 'Testnet deployment scheduled for March 1st',
        confidence: 'high',
        eventType: 'launch',
      });
    });

    it('should handle different confidence levels', () => {
      const lowConfidence = { ...mockAIEvent, dateConfidence: 'low' as const };
      const result = transformAIExtractedEvent(lowConfidence);
      expect(result.metadata.confidence).toBe('low');
    });
  });

  describe('transformAIExtractedEvents', () => {
    it('should transform multiple AI events', () => {
      const event2: AIExtractedEventWithSource = {
        ...mockAIEvent,
        id: 'ai-test-proposal-1',
        title: 'Mainnet Launch',
        date: '2026-03-15',
      };

      const results = transformAIExtractedEvents([mockAIEvent, event2]);

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Testnet Launch');
      expect(results[1].title).toBe('Mainnet Launch');
    });

    it('should handle empty array', () => {
      const results = transformAIExtractedEvents([]);
      expect(results).toEqual([]);
    });
  });

  describe('serializeAIExtractedEvent', () => {
    it('should serialize AI event with ISO date strings', () => {
      const result = serializeAIExtractedEvent(mockAIEvent);

      expect(typeof result.startDate).toBe('string');
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.endDate).toBeNull();
    });

    it('should preserve all event properties', () => {
      const result = serializeAIExtractedEvent(mockAIEvent);

      expect(result.id).toBe('ai-test-proposal-0');
      expect(result.title).toBe('Testnet Launch');
      expect(result.sourceId).toBe(AI_EXTRACTION_SOURCE_ID);
      expect(result.source).toBe(EventSource.AI_EXTRACTED);
    });
  });

  describe('serializeAIExtractedEvents', () => {
    it('should serialize multiple AI events', () => {
      const event2: AIExtractedEventWithSource = {
        ...mockAIEvent,
        id: 'ai-test-proposal-1',
        date: '2026-04-01',
      };

      const results = serializeAIExtractedEvents([mockAIEvent, event2]);

      expect(results).toHaveLength(2);
      expect(typeof results[0].startDate).toBe('string');
      expect(typeof results[1].startDate).toBe('string');
    });
  });

  describe('Constants', () => {
    it('should have correct source ID and name', () => {
      expect(AI_EXTRACTION_SOURCE_ID).toBe('ai-insights');
      expect(AI_EXTRACTION_SOURCE_NAME).toBe('AI Insights');
    });
  });
});
