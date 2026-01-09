import { Delegate } from '../types';

/**
 * Calculates ranks for delegates based on karmaScore
 * Sorts by karmaScore descending and assigns rank (1-indexed)
 */
export function calculateRanks(delegates: Delegate[]): Delegate[] {
  // Sort by karmaScore descending
  const sorted = [...delegates].sort((a, b) => b.karmaScore - a.karmaScore);

  // Assign rank (1-indexed)
  return sorted.map((delegate, index) => ({
    ...delegate,
    rank: index + 1,
  }));
}
