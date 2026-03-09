import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchActiveVoteStatus } from '../api/fetch-active-vote-status';
import type { SnapshotActiveProposal } from '../types';

// Mock the dependencies
vi.mock('../api/fetch-active-proposals', () => ({
  fetchActiveProposals: vi.fn(),
}));

vi.mock('../api/fetch-votes', () => ({
  fetchVotes: vi.fn(),
}));

import { fetchActiveProposals } from '../api/fetch-active-proposals';
import { fetchVotes } from '../api/fetch-votes';

const mockFetchActiveProposals = fetchActiveProposals as ReturnType<typeof vi.fn>;
const mockFetchVotes = fetchVotes as ReturnType<typeof vi.fn>;

const MOCK_PROPOSALS: SnapshotActiveProposal[] = [
  {
    id: 'proposal-a',
    title: 'Proposal A',
    start: 1700000000,
    end: 1700100000,
    state: 'active',
    choices: ['For', 'Against'],
    scores: [100, 50],
    scores_total: 150,
    votes: 20,
    quorum: 100,
    type: 'single-choice',
    link: 'https://snapshot.org/#/ssv.dao.eth/proposal/proposal-a',
  },
  {
    id: 'proposal-b',
    title: 'Proposal B',
    start: 1700000000,
    end: 1700200000,
    state: 'active',
    choices: ['Yes', 'No'],
    scores: [200, 30],
    scores_total: 230,
    votes: 40,
    quorum: 150,
    type: 'single-choice',
    link: 'https://snapshot.org/#/ssv.dao.eth/proposal/proposal-b',
  },
];

describe('fetchActiveVoteStatus', () => {
  beforeEach(() => {
    mockFetchActiveProposals.mockReset();
    mockFetchVotes.mockReset();
  });

  it('should return empty data when no active proposals', async () => {
    mockFetchActiveProposals.mockResolvedValueOnce([]);

    const result = await fetchActiveVoteStatus('ssv.dao.eth');

    expect(result.proposals).toEqual([]);
    expect(result.voterMap.size).toBe(0);
    expect(mockFetchVotes).not.toHaveBeenCalled();
  });

  it('should build voterMap correctly from votes', async () => {
    mockFetchActiveProposals.mockResolvedValueOnce(MOCK_PROPOSALS);
    mockFetchVotes.mockResolvedValueOnce([
      { id: 'v1', voter: '0xAlice', proposal: { id: 'proposal-a' } },
      { id: 'v2', voter: '0xAlice', proposal: { id: 'proposal-b' } },
      { id: 'v3', voter: '0xBob', proposal: { id: 'proposal-a' } },
    ]);

    const result = await fetchActiveVoteStatus('ssv.dao.eth');

    expect(result.proposals).toEqual(MOCK_PROPOSALS);
    expect(result.voterMap.size).toBe(2);

    // Alice voted on both
    const aliceVotes = result.voterMap.get('0xalice')!;
    expect(aliceVotes.has('proposal-a')).toBe(true);
    expect(aliceVotes.has('proposal-b')).toBe(true);

    // Bob voted on only proposal-a
    const bobVotes = result.voterMap.get('0xbob')!;
    expect(bobVotes.has('proposal-a')).toBe(true);
    expect(bobVotes.has('proposal-b')).toBe(false);
  });

  it('should normalize addresses to lowercase', async () => {
    mockFetchActiveProposals.mockResolvedValueOnce(MOCK_PROPOSALS);
    mockFetchVotes.mockResolvedValueOnce([
      { id: 'v1', voter: '0xABCDEF', proposal: { id: 'proposal-a' } },
    ]);

    const result = await fetchActiveVoteStatus('ssv.dao.eth');

    expect(result.voterMap.has('0xabcdef')).toBe(true);
    expect(result.voterMap.has('0xABCDEF')).toBe(false);
  });

  it('should pass correct proposal IDs to fetchVotes', async () => {
    mockFetchActiveProposals.mockResolvedValueOnce(MOCK_PROPOSALS);
    mockFetchVotes.mockResolvedValueOnce([]);

    await fetchActiveVoteStatus('ssv.dao.eth');

    expect(mockFetchVotes).toHaveBeenCalledWith(['proposal-a', 'proposal-b']);
  });
});
