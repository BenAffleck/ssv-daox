import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchLeaderboard, fetchScoreHealth } from '../api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '../config';
import type { ScoreRow } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const BASE_URL = 'http://score.test';

function row(address: string): ScoreRow {
  return {
    address,
    display_name: address,
    rank: 1,
    score: 50,
    community: 0,
    holdings: 50,
    votes: 50,
    missing_community: true,
    missing_holdings: false,
    missing_votes: false,
    twab: null,
    twab_days: null,
    community_raw: null,
    voted_count: null,
    proposal_count: null,
    hs_rank: null,
    identity: {
      id: address,
      hs_username: null,
      forum_handle: null,
      discord_handle: null,
      addresses: [{ address, ens_name: null }],
    },
    cohort: null,
    power: 0,
  };
}

function page(runId: number, rows: ScoreRow[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ run_id: runId, as_of: '2026-09-21', rows }),
  };
}

function rows(count: number): ScoreRow[] {
  return Array.from({ length: count }, (_, i) => row(`0x${i.toString(16).padStart(40, '0')}`));
}

describe('fetchLeaderboard', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubEnv('DELEGATE_SCORE_API_URL', `${BASE_URL}/`);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a single page with its run', async () => {
    mockFetch.mockResolvedValueOnce(page(8, rows(3)));

    const result = await fetchLeaderboard();

    expect(result.runId).toBe(8);
    expect(result.asOf).toBe('2026-09-21');
    expect(result.rows).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      `${BASE_URL}/v1/leaderboard?limit=${DELEGATE_SCORE_CONFIG.pageSize}&offset=0`,
    );
  });

  it('pages until a short page and pins later pages to the first as-of', async () => {
    const { pageSize } = DELEGATE_SCORE_CONFIG;
    mockFetch
      .mockResolvedValueOnce(page(8, rows(pageSize)))
      .mockResolvedValueOnce(page(8, rows(2)));

    const result = await fetchLeaderboard();

    expect(result.rows).toHaveLength(pageSize + 2);
    expect(mockFetch.mock.calls[1][0]).toBe(
      `${BASE_URL}/v1/leaderboard?as_of=2026-09-21&limit=${pageSize}&offset=${pageSize}`,
    );
  });

  it('fails when the run changes while paging', async () => {
    mockFetch
      .mockResolvedValueOnce(page(8, rows(DELEGATE_SCORE_CONFIG.pageSize)))
      .mockResolvedValueOnce(page(9, rows(1)));

    await expect(fetchLeaderboard()).rejects.toThrow('run changed from 8 to 9');
  });

  it('reports the API error detail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ detail: 'No published run' }),
    });

    await expect(fetchLeaderboard()).rejects.toThrow('404: No published run');
  });
});

describe('fetchScoreHealth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubEnv('DELEGATE_SCORE_API_URL', BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the body of a 503 as stale data', async () => {
    const body = {
      status: 'stale',
      run_id: 8,
      as_of: '2026-09-19',
      latest_published_as_of: '2026-09-19',
      age_hours: 60,
    };
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => body });

    expect(await fetchScoreHealth()).toEqual(body);
  });

  it('returns null when the API is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    expect(await fetchScoreHealth()).toBeNull();
  });
});
