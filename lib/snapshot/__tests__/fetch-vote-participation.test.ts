import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVoteParticipation } from '../api/fetch-vote-participation';
import { MOCK_PROPOSALS } from './__mocks__/proposal-data';
import {
  ALL_MOCK_VOTES,
  VOTER_100_PERCENT,
  VOTER_40_PERCENT,
  VOTER_0_PERCENT,
  VOTER_MIXED_CASE,
} from './__mocks__/vote-data';
import type {
  SnapshotGraphQLResponse,
  ProposalsQueryResponse,
  VotesQueryResponse,
} from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchVoteParticipation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should calculate 100% participation correctly', async () => {
    // Mock proposals response
    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: MOCK_PROPOSALS },
    };

    // Mock votes response
    const votesResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: { votes: ALL_MOCK_VOTES },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => proposalsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => votesResponse,
      });

    const participation = await fetchVoteParticipation('ssv.dao.eth');

    // Voter with 5/5 votes = 100%
    expect(participation[VOTER_100_PERCENT.toLowerCase()]).toBe(100);
  });

  it('should calculate 40% participation correctly', async () => {
    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: MOCK_PROPOSALS },
    };

    const votesResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: { votes: ALL_MOCK_VOTES },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => proposalsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => votesResponse,
      });

    const participation = await fetchVoteParticipation('ssv.dao.eth');

    // Voter with 2/5 votes = 40%
    expect(participation[VOTER_40_PERCENT.toLowerCase()]).toBe(40);
  });

  it('should not include addresses with 0% participation in map', async () => {
    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: MOCK_PROPOSALS },
    };

    const votesResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: { votes: ALL_MOCK_VOTES },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => proposalsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => votesResponse,
      });

    const participation = await fetchVoteParticipation('ssv.dao.eth');

    // Address with no votes should not be in the map
    expect(participation[VOTER_0_PERCENT.toLowerCase()]).toBeUndefined();
  });

  it('should normalize addresses to lowercase', async () => {
    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: MOCK_PROPOSALS },
    };

    const votesResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: { votes: ALL_MOCK_VOTES },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => proposalsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => votesResponse,
      });

    const participation = await fetchVoteParticipation('ssv.dao.eth');

    // Mixed case address should be normalized to lowercase
    expect(participation[VOTER_MIXED_CASE.toLowerCase()]).toBe(20);
    // Original case should not exist
    expect(participation[VOTER_MIXED_CASE]).toBeUndefined();
  });

  it('should return empty map when no proposals exist', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: [] },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => proposalsResponse,
    });

    const participation = await fetchVoteParticipation('new-space.eth');

    expect(participation).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No closed proposals found for space: new-space.eth'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchVoteParticipation('ssv.dao.eth')).rejects.toThrow(
      'Snapshot API error: 500 Internal Server Error'
    );
  });

  it('should fetch proposals and votes in sequence', async () => {
    const proposalsResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: { proposals: MOCK_PROPOSALS },
    };

    const votesResponse: SnapshotGraphQLResponse<VotesQueryResponse> = {
      data: { votes: ALL_MOCK_VOTES },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => proposalsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => votesResponse,
      });

    await fetchVoteParticipation('ssv.dao.eth');

    // Should make 2 API calls: proposals then votes
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // First call should be for proposals
    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(firstCallBody.query).toContain('GetLatestProposals');

    // Second call should be for votes
    const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondCallBody.query).toContain('GetProposalVotes');
  });
});
