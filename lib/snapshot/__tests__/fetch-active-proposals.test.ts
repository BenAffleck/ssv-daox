import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchActiveProposals } from '../api/fetch-active-proposals';
import type { SnapshotGraphQLResponse, ActiveProposalsQueryResponse, SnapshotActiveProposal } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const MOCK_ACTIVE_PROPOSALS: SnapshotActiveProposal[] = [
  {
    id: 'active-1',
    title: 'Active Proposal 1',
    start: 1700000000,
    end: 1700100000,
    state: 'active',
    choices: ['For', 'Against', 'Abstain'],
    scores: [100, 50, 10],
    scores_total: 160,
    votes: 25,
    quorum: 100,
    type: 'single-choice',
    link: 'https://snapshot.org/#/ssv.dao.eth/proposal/active-1',
  },
  {
    id: 'active-2',
    title: 'Active Proposal 2',
    start: 1700000000,
    end: 1700200000,
    state: 'active',
    choices: ['Yes', 'No'],
    scores: [200, 30],
    scores_total: 230,
    votes: 40,
    quorum: 150,
    type: 'single-choice',
    link: 'https://snapshot.org/#/ssv.dao.eth/proposal/active-2',
  },
];

describe('fetchActiveProposals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return active proposals from valid space', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: MOCK_ACTIVE_PROPOSALS },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchActiveProposals('ssv.dao.eth');

    expect(proposals).toEqual(MOCK_ACTIVE_PROPOSALS);
    expect(proposals[0].choices).toEqual(['For', 'Against', 'Abstain']);
    expect(proposals[0].scores_total).toBe(160);
  });

  it('should return empty array when no active proposals', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: [] },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchActiveProposals('ssv.dao.eth');
    expect(proposals).toEqual([]);
  });

  it('should return empty array on HTTP error (graceful degradation)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const proposals = await fetchActiveProposals('ssv.dao.eth');
    expect(proposals).toEqual([]);
  });

  it('should return empty array on GraphQL error', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: null,
      errors: [{ message: 'Rate limited' }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchActiveProposals('ssv.dao.eth');
    expect(proposals).toEqual([]);
  });

  it('should make POST request with correct query variables', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: [] },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchActiveProposals('ssv.dao.eth');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('GetActiveProposals'),
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ spaceId: 'ssv.dao.eth' });
  });
});
