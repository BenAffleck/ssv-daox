import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTimelineProposals } from '../api/fetch-timeline-proposals';
import { SNAPSHOT_CONFIG } from '../config';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('fetchTimelineProposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockProposals = [
    {
      id: 'proposal-1',
      title: 'SIP-1: Test Proposal',
      body: 'This is a test proposal description with details about the governance decision.',
      created: 1700000000,
      start: 1700100000,
      end: 1700500000,
      state: 'active',
      link: 'https://snapshot.org/#/mainnet.ssvnetwork.eth/proposal/proposal-1',
    },
    {
      id: 'proposal-2',
      title: 'SIP-2: Another Proposal',
      body: 'Description for the second proposal.',
      created: 1699000000,
      start: 1699100000,
      end: 1699500000,
      state: 'closed',
      link: 'https://snapshot.org/#/mainnet.ssvnetwork.eth/proposal/proposal-2',
    },
  ];

  it('should fetch proposals from Snapshot API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { proposals: mockProposals },
      }),
    });

    const result = await fetchTimelineProposals('mainnet.ssvnetwork.eth');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      SNAPSHOT_CONFIG.apiUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('proposal-1');
    expect(result[0].title).toBe('SIP-1: Test Proposal');
    expect(result[0].state).toBe('active');
    expect(result[1].state).toBe('closed');
  });

  it('should pass space ID and limit to query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { proposals: [] },
      }),
    });

    await fetchTimelineProposals('test.space.eth', 10);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.variables.spaceId).toBe('test.space.eth');
    expect(callBody.variables.limit).toBe(10);
  });

  it('should return empty array on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchTimelineProposals('mainnet.ssvnetwork.eth');

    expect(result).toEqual([]);
  });

  it('should return empty array on GraphQL error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: null,
        errors: [{ message: 'Space not found' }],
      }),
    });

    const result = await fetchTimelineProposals('invalid.space');

    expect(result).toEqual([]);
  });

  it('should return empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchTimelineProposals('mainnet.ssvnetwork.eth');

    expect(result).toEqual([]);
  });

  it('should include all required fields in query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { proposals: mockProposals },
      }),
    });

    await fetchTimelineProposals('mainnet.ssvnetwork.eth');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const query = callBody.query;

    // Verify query includes all required fields
    expect(query).toContain('id');
    expect(query).toContain('title');
    expect(query).toContain('body');
    expect(query).toContain('created');
    expect(query).toContain('start');
    expect(query).toContain('end');
    expect(query).toContain('state');
    expect(query).toContain('link');
  });
});
