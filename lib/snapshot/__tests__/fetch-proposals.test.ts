import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProposals } from '../api/fetch-proposals';
import { MOCK_PROPOSALS } from './__mocks__/proposal-data';
import type { SnapshotGraphQLResponse, ProposalsQueryResponse } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchProposals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should return proposals from valid space', async () => {
    const mockResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: {
        proposals: MOCK_PROPOSALS,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchProposals('ssv.dao.eth', 5);

    expect(proposals).toEqual(MOCK_PROPOSALS);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no proposals exist', async () => {
    const mockResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: {
        proposals: [],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const proposals = await fetchProposals('new-space.eth', 5);

    expect(proposals).toEqual([]);
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchProposals('ssv.dao.eth', 5)).rejects.toThrow(
      'Snapshot API error: 500 Internal Server Error'
    );
  });

  it('should throw on GraphQL error', async () => {
    const mockResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: null,
      errors: [
        {
          message: 'Rate limited',
          locations: [{ line: 2, column: 3 }],
          path: ['proposals'],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(fetchProposals('ssv.dao.eth', 5)).rejects.toThrow(
      'GraphQL error: Rate limited'
    );
  });

  it('should make POST request with correct query and variables', async () => {
    const mockResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: {
        proposals: MOCK_PROPOSALS,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchProposals('ssv.dao.eth', 5);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('GetLatestProposals'),
      })
    );

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.variables).toEqual({ spaceId: 'ssv.dao.eth', limit: 5 });
  });

  it('should use default limit from config', async () => {
    const mockResponse: SnapshotGraphQLResponse<ProposalsQueryResponse> = {
      data: {
        proposals: MOCK_PROPOSALS,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchProposals('ssv.dao.eth');

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.variables.limit).toBe(5);
  });
});
