import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPendingProposals } from '../api/fetch-pending-proposals';
import type { SnapshotGraphQLResponse, ActiveProposalsQueryResponse, SnapshotActiveProposal } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const MOCK_PENDING_PROPOSALS: SnapshotActiveProposal[] = [
  {
    id: 'pending-1',
    title: 'Pending Proposal 1',
    body: 'Description of pending proposal',
    start: 1700100000,
    end: 1700200000,
    state: 'pending',
    choices: ['For', 'Against', 'Abstain'],
    scores: [0, 0, 0],
    scores_total: 0,
    votes: 0,
    quorum: 100,
    type: 'single-choice',
    link: 'https://snapshot.org/#/ssv.dao.eth/proposal/pending-1',
  },
];

describe('fetchPendingProposals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return pending proposals from valid space', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: MOCK_PENDING_PROPOSALS },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchPendingProposals('ssv.dao.eth');

    expect(proposals).toEqual(MOCK_PENDING_PROPOSALS);
    expect(proposals[0].state).toBe('pending');
    expect(proposals[0].scores_total).toBe(0);
  });

  it('should return empty array when no pending proposals', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: [] },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchPendingProposals('ssv.dao.eth');
    expect(proposals).toEqual([]);
  });

  it('should return empty array on HTTP error (graceful degradation)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const proposals = await fetchPendingProposals('ssv.dao.eth');
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

    const proposals = await fetchPendingProposals('ssv.dao.eth');
    expect(proposals).toEqual([]);
  });

  it('should make POST request with correct query for pending state', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: { proposals: [] },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchPendingProposals('ssv.dao.eth');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('GetPendingProposals'),
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ spaceId: 'ssv.dao.eth' });
    expect(body.query).toContain('state: "pending"');
  });
});
