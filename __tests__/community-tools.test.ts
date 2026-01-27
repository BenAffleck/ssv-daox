import { describe, it, expect } from 'vitest';
import { communityTools, getCommunityToolsSorted } from '@/lib/data/community-tools';

describe('community-tools', () => {
  describe('communityTools array', () => {
    it('contains at least one tool', () => {
      expect(communityTools.length).toBeGreaterThan(0);
    });

    it('includes Stake Easy', () => {
      const stakeeasy = communityTools.find((tool) => tool.id === 'stakeeasy');
      expect(stakeeasy).toBeDefined();
      expect(stakeeasy?.name).toBe('Stake Easy');
      expect(stakeeasy?.url).toBe('https://stakeeasy.xyz');
    });

    it('all tools have required fields', () => {
      communityTools.forEach((tool) => {
        expect(tool.id).toBeTruthy();
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.url).toBeTruthy();
        expect(typeof tool.sortOrder).toBe('number');
      });
    });

    it('all tools have valid URLs', () => {
      communityTools.forEach((tool) => {
        expect(() => new URL(tool.url)).not.toThrow();
      });
    });

    it('all tools have unique IDs', () => {
      const ids = communityTools.map((tool) => tool.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getCommunityToolsSorted', () => {
    it('returns a copy of the array', () => {
      const sorted = getCommunityToolsSorted();
      expect(sorted).not.toBe(communityTools);
    });

    it('returns tools sorted by sortOrder ascending', () => {
      const sorted = getCommunityToolsSorted();
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder);
      }
    });

    it('does not modify the original array', () => {
      const originalLength = communityTools.length;
      const originalFirst = communityTools[0];

      getCommunityToolsSorted();

      expect(communityTools.length).toBe(originalLength);
      expect(communityTools[0]).toBe(originalFirst);
    });
  });
});
