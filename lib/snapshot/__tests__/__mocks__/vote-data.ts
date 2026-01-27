/**
 * Mock vote data for testing vote participation
 */

import type { SnapshotVote } from '../../types';
import { MOCK_PROPOSAL_IDS } from './proposal-data';

/**
 * Test addresses
 */
export const VOTER_100_PERCENT = '0x1111111111111111111111111111111111111111';
export const VOTER_40_PERCENT = '0x2222222222222222222222222222222222222222';
export const VOTER_0_PERCENT = '0x3333333333333333333333333333333333333333';
export const VOTER_MIXED_CASE = '0xAbCdEf0000000000000000000000000000000004';

/**
 * Mock votes - voter with 100% participation (5/5 proposals)
 */
export const VOTES_100_PERCENT: SnapshotVote[] = MOCK_PROPOSAL_IDS.map(
  (proposalId, idx) => ({
    id: `vote-100-${idx}`,
    voter: VOTER_100_PERCENT,
    proposal: { id: proposalId },
  })
);

/**
 * Mock votes - voter with 40% participation (2/5 proposals)
 */
export const VOTES_40_PERCENT: SnapshotVote[] = [
  {
    id: 'vote-40-0',
    voter: VOTER_40_PERCENT,
    proposal: { id: MOCK_PROPOSAL_IDS[0] },
  },
  {
    id: 'vote-40-1',
    voter: VOTER_40_PERCENT,
    proposal: { id: MOCK_PROPOSAL_IDS[2] },
  },
];

/**
 * Mock votes - mixed case address (should be normalized)
 */
export const VOTES_MIXED_CASE: SnapshotVote[] = [
  {
    id: 'vote-mixed-0',
    voter: VOTER_MIXED_CASE,
    proposal: { id: MOCK_PROPOSAL_IDS[0] },
  },
];

/**
 * All mock votes combined for comprehensive testing
 */
export const ALL_MOCK_VOTES: SnapshotVote[] = [
  ...VOTES_100_PERCENT,
  ...VOTES_40_PERCENT,
  ...VOTES_MIXED_CASE,
];
