/**
 * Unit tests for AI summary types and Zod schemas
 */

import { describe, it, expect } from 'vitest';
import { ProposalSummarySchema, ChoiceExplanationSchema } from '../types';

describe('AI Summary Types', () => {
  describe('ChoiceExplanationSchema', () => {
    it('should validate a valid choice explanation', () => {
      const result = ChoiceExplanationSchema.safeParse({
        choice: 'For',
        explanation: 'Approve the proposal',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing choice field', () => {
      const result = ChoiceExplanationSchema.safeParse({
        explanation: 'Approve the proposal',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing explanation field', () => {
      const result = ChoiceExplanationSchema.safeParse({
        choice: 'For',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ProposalSummarySchema', () => {
    it('should validate a valid proposal summary', () => {
      const result = ProposalSummarySchema.safeParse({
        tldr: 'This proposal allocates 100k SSV tokens for ecosystem grants. It aims to fund new integrations and tooling.',
        choiceExplanations: [
          { choice: 'For', explanation: 'Approve the grant allocation' },
          { choice: 'Against', explanation: 'Reject the grant allocation' },
          { choice: 'Abstain', explanation: 'Neither approve nor reject' },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tldr).toContain('100k SSV');
        expect(result.data.choiceExplanations).toHaveLength(3);
      }
    });

    it('should validate summary with empty choice explanations', () => {
      const result = ProposalSummarySchema.safeParse({
        tldr: 'A simple proposal.',
        choiceExplanations: [],
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing tldr', () => {
      const result = ProposalSummarySchema.safeParse({
        choiceExplanations: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing choiceExplanations', () => {
      const result = ProposalSummarySchema.safeParse({
        tldr: 'Summary text',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string tldr', () => {
      const result = ProposalSummarySchema.safeParse({
        tldr: 123,
        choiceExplanations: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid choice explanations', () => {
      const result = ProposalSummarySchema.safeParse({
        tldr: 'Summary',
        choiceExplanations: [{ choice: 'For' }], // missing explanation
      });
      expect(result.success).toBe(false);
    });
  });
});
