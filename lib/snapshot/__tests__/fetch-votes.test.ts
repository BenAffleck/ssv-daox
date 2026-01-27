import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVotes } from '../api/fetch-votes';
import { ALL_MOCK_VOTES, VOTES_100_PERCENT } from './__mocks__/vote-data';
import { MOCK_PROPOSAL_IDS } from './__mocks__/proposal-data';
import type { SnapshotGraphQLResponse, VotesQueryResponse } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchVotes', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should return votes for given proposal IDs', async () => {
    const mockResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: {
        votes: VOTES_100_PERCENT,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const votes = await fetchVotes(MOCK_PROPOSAL_IDS);

    expect(votes).toEqual(VOTES_100_PERCENT);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no votes exist', async () => {
    const mockResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: {
        votes: [],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const votes = await fetchVotes(['proposal-no-votes']);

    expect(votes).toEqual([]);
  });

  it('should return empty array when proposal IDs array is empty', async () => {
    const votes = await fetchVotes([]);

    expect(votes).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchVotes(MOCK_PROPOSAL_IDS)).rejects.toThrow(
      'Snapshot API error: 500 Internal Server Error'
    );
  });

  it('should throw on GraphQL error', async () => {
    const mockResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: null,
      errors: [
        {
          message: 'Query too complex',
          locations: [{ line: 2, column: 3 }],
          path: ['votes'],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(fetchVotes(MOCK_PROPOSAL_IDS)).rejects.toThrow(
      'GraphQL error: Query too complex'
    );
  });

  it('should make POST request with correct query and variables', async () => {
    const mockResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: {
        votes: ALL_MOCK_VOTES,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchVotes(MOCK_PROPOSAL_IDS);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('GetProposalVotes'),
      })
    );

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.variables).toEqual({
      proposalIds: MOCK_PROPOSAL_IDS,
      first: 1000,
      skip: 0,
    });
  });

  it('should paginate when more than 1000 votes exist', async () => {
    // First page: 1000 votes
    const firstPageVotes = Array(1000)
      .fill(null)
      .map((_, i) => ({
        id: `vote-${i}`,
        voter: '0x1111111111111111111111111111111111111111',
        proposal: { id: 'proposal-1' },
      }));

    // Second page: 50 votes (indicates end)
    const secondPageVotes = Array(50)
      .fill(null)
      .map((_, i) => ({
        id: `vote-${1000 + i}`,
        voter: '0x2222222222222222222222222222222222222222',
        proposal: { id: 'proposal-2' },
      }));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { votes: firstPageVotes } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { votes: secondPageVotes } }),
      });

    const votes = await fetchVotes(['proposal-1', 'proposal-2']);

    // Should have made 2 API calls
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // First call should have skip=0
    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(firstCallBody.variables.skip).toBe(0);

    // Second call should have skip=1000
    const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondCallBody.variables.skip).toBe(1000);

    // Should return all 1050 votes
    expect(votes.length).toBe(1050);
  });
});
