import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchClosedProposals } from '../api/fetch-closed-proposals';
import type { SnapshotGraphQLResponse, ActiveProposalsQueryResponse } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchClosedProposals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('queries closed proposals with the given limit and returns them', async () => {
    const mockResponse: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> = {
      data: {
        proposals: [
          {
            id: 'c1',
            title: 'Closed 1',
            body: '',
            start: 1,
            end: 2,
            state: 'closed',
            choices: ['For', 'Against'],
            scores: [3, 1],
            scores_total: 4,
            votes: 4,
            quorum: 0,
            type: 'single-choice',
            link: 'https://snapshot.org/#/x/proposal/c1',
          },
        ],
      },
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const proposals = await fetchClosedProposals('ssv.dao.eth', 20);

    expect(proposals).toHaveLength(1);
    expect(proposals[0].id).toBe('c1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('GetClosedProposals'),
      })
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ spaceId: 'ssv.dao.eth', limit: 20 });
  });

  it('returns an empty array on HTTP error (graceful degradation)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });
    const proposals = await fetchClosedProposals('ssv.dao.eth', 20);
    expect(proposals).toEqual([]);
  });
});
