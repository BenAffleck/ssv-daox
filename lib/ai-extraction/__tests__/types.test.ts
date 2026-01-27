/**
 * Unit tests for AI extraction types and time window utilities
 */

import { describe, it, expect } from 'vitest';
import {
  TIME_WINDOWS,
  filterProposalsByTimeWindow,
  getProposalCountsByWindow,
  ProposalForExtraction,
} from '../types';

describe('AI Extraction Types', () => {
  describe('TIME_WINDOWS', () => {
    it('should have 4 time window options', () => {
      expect(TIME_WINDOWS).toHaveLength(4);
    });

    it('should have correct time window IDs', () => {
      const ids = TIME_WINDOWS.map((w) => w.id);
      expect(ids).toEqual(['30d', '90d', '6m', 'all']);
    });

    it('should have null days for "all" option', () => {
      const allWindow = TIME_WINDOWS.find((w) => w.id === 'all');
      expect(allWindow?.days).toBeNull();
    });

    it('should have correct days for time-limited options', () => {
      expect(TIME_WINDOWS.find((w) => w.id === '30d')?.days).toBe(30);
      expect(TIME_WINDOWS.find((w) => w.id === '90d')?.days).toBe(90);
      expect(TIME_WINDOWS.find((w) => w.id === '6m')?.days).toBe(180);
    });
  });

  describe('filterProposalsByTimeWindow', () => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Helper to create proposal with created timestamp X days ago
    const createProposal = (
      id: string,
      daysAgo: number
    ): ProposalForExtraction => ({
      id,
      title: `Proposal ${id}`,
      body: 'Test body',
      end: Math.floor((now - daysAgo * msPerDay) / 1000),
      created: Math.floor((now - daysAgo * msPerDay) / 1000),
      link: `https://snapshot.org/#/test/proposal/${id}`,
    });

    const proposals: ProposalForExtraction[] = [
      createProposal('recent', 5), // 5 days ago
      createProposal('month', 45), // 45 days ago
      createProposal('quarter', 100), // 100 days ago
      createProposal('old', 200), // 200 days ago
    ];

    it('should return all proposals for "all" window', () => {
      const result = filterProposalsByTimeWindow(proposals, 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter to last 30 days', () => {
      const result = filterProposalsByTimeWindow(proposals, '30d');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recent');
    });

    it('should filter to last 90 days', () => {
      const result = filterProposalsByTimeWindow(proposals, '90d');
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toContain('recent');
      expect(result.map((p) => p.id)).toContain('month');
    });

    it('should filter to last 6 months (180 days)', () => {
      const result = filterProposalsByTimeWindow(proposals, '6m');
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.id)).not.toContain('old');
    });

    it('should handle empty proposals array', () => {
      const result = filterProposalsByTimeWindow([], '30d');
      expect(result).toEqual([]);
    });
  });

  describe('getProposalCountsByWindow', () => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    const createProposal = (
      id: string,
      daysAgo: number
    ): ProposalForExtraction => ({
      id,
      title: `Proposal ${id}`,
      body: 'Test body',
      end: Math.floor((now - daysAgo * msPerDay) / 1000),
      created: Math.floor((now - daysAgo * msPerDay) / 1000),
      link: `https://snapshot.org/#/test/proposal/${id}`,
    });

    const proposals: ProposalForExtraction[] = [
      createProposal('1', 5),
      createProposal('2', 45),
      createProposal('3', 100),
      createProposal('4', 200),
    ];

    it('should return counts for all time windows', () => {
      const counts = getProposalCountsByWindow(proposals);

      expect(counts['30d']).toBe(1);
      expect(counts['90d']).toBe(2);
      expect(counts['6m']).toBe(3);
      expect(counts.all).toBe(4);
    });

    it('should return zeros for empty proposals', () => {
      const counts = getProposalCountsByWindow([]);

      expect(counts['30d']).toBe(0);
      expect(counts['90d']).toBe(0);
      expect(counts['6m']).toBe(0);
      expect(counts.all).toBe(0);
    });

    it('should handle proposals all within 30 days', () => {
      const recentProposals = [
        createProposal('a', 1),
        createProposal('b', 10),
        createProposal('c', 20),
      ];

      const counts = getProposalCountsByWindow(recentProposals);

      expect(counts['30d']).toBe(3);
      expect(counts['90d']).toBe(3);
      expect(counts['6m']).toBe(3);
      expect(counts.all).toBe(3);
    });
  });
});
