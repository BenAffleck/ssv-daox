/**
 * Mock proposal data for testing vote participation
 */

import type { SnapshotProposal } from '../../types';

/**
 * 5 mock closed proposals for testing
 */
export const MOCK_PROPOSALS: SnapshotProposal[] = [
  {
    id: 'proposal-1',
    title: 'SSV Improvement Proposal 1',
    end: 1700000000,
    state: 'closed',
  },
  {
    id: 'proposal-2',
    title: 'SSV Improvement Proposal 2',
    end: 1699900000,
    state: 'closed',
  },
  {
    id: 'proposal-3',
    title: 'SSV Improvement Proposal 3',
    end: 1699800000,
    state: 'closed',
  },
  {
    id: 'proposal-4',
    title: 'SSV Improvement Proposal 4',
    end: 1699700000,
    state: 'closed',
  },
  {
    id: 'proposal-5',
    title: 'SSV Improvement Proposal 5',
    end: 1699600000,
    state: 'closed',
  },
];

/**
 * Mock proposal IDs for convenience
 */
export const MOCK_PROPOSAL_IDS = MOCK_PROPOSALS.map((p) => p.id);
