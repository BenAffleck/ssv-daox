import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGovernanceProposals } from '../api/fetch-governance-proposals';
import type { GovernanceSpace, SnapshotActiveProposal } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const MAIN: GovernanceSpace = {
  key: 'main',
  label: 'Main',
  spaceId: 'mainnet.ssvnetwork.eth',
  voteType: 'token',
};
const OC: GovernanceSpace = {
  key: 'operator',
  label: 'OC',
  spaceId: 'vo.ssvnetwork.eth',
  voteType: 'member',
};

function proposal(
  overrides: Partial<SnapshotActiveProposal> & { id: string }
): SnapshotActiveProposal {
  return {
    title: `Proposal ${overrides.id}`,
    body: '',
    start: 1700000000,
    end: 1700100000,
    state: 'active',
    choices: ['For', 'Against'],
    scores: [1, 0],
    scores_total: 1,
    votes: 1,
    quorum: 0,
    type: 'single-choice',
    link: `https://snapshot.org/#/x/proposal/${overrides.id}`,
    ...overrides,
  };
}

/** Builds a GraphQL ok-response for the given proposals. */
function gqlOk(proposals: SnapshotActiveProposal[]) {
  return { ok: true, json: async () => ({ data: { proposals } }) };
}

type SpaceCfg = {
  active?: SnapshotActiveProposal[];
  pending?: SnapshotActiveProposal[];
  closed?: SnapshotActiveProposal[];
  fail?: boolean;
};

/**
 * Routes a mocked fetch call to proposals based on the query (active / pending /
 * closed) and spaceId in the request body.
 */
function routeFetch(bySpace: Record<string, SpaceCfg>) {
  return (_url: string, init: any) => {
    const parsed = JSON.parse(init.body);
    const spaceId: string = parsed.variables.spaceId;
    const cfg = bySpace[spaceId];
    if (!cfg || cfg.fail) {
      return Promise.resolve({ ok: false, status: 500, statusText: 'Server Error' });
    }
    const q = parsed.query;
    const which = q.includes('GetActiveProposals')
      ? cfg.active
      : q.includes('GetPendingProposals')
        ? cfg.pending
        : cfg.closed;
    return Promise.resolve(gqlOk(which ?? []));
  };
}

describe('fetchGovernanceProposals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('aggregates proposals across spaces and tags each with its space', async () => {
    mockFetch.mockImplementation(
      routeFetch({
        [MAIN.spaceId]: { active: [proposal({ id: 'm1' })], pending: [] },
        [OC.spaceId]: { active: [proposal({ id: 'o1' })], pending: [] },
      })
    );

    const { proposals, failedSpaces } = await fetchGovernanceProposals([MAIN, OC]);

    expect(failedSpaces).toEqual([]);
    expect(proposals).toHaveLength(2);
    expect(proposals.find((p) => p.id === 'm1')?.space.key).toBe('main');
    expect(proposals.find((p) => p.id === 'o1')?.space.key).toBe('operator');
  });

  it('orders active proposals before pending, sorted within group', async () => {
    mockFetch.mockImplementation(
      routeFetch({
        [MAIN.spaceId]: {
          active: [
            proposal({ id: 'late', state: 'active', end: 2000 }),
            proposal({ id: 'soon', state: 'active', end: 1000 }),
          ],
          pending: [proposal({ id: 'pend', state: 'pending', start: 5000 })],
        },
      })
    );

    const { proposals } = await fetchGovernanceProposals([MAIN]);

    expect(proposals.map((p) => p.id)).toEqual(['soon', 'late', 'pend']);
  });

  it('reports a failed space while still returning others', async () => {
    mockFetch.mockImplementation(
      routeFetch({
        [MAIN.spaceId]: { active: [proposal({ id: 'm1' })], pending: [] },
        [OC.spaceId]: { fail: true },
      })
    );

    const { proposals, failedSpaces } = await fetchGovernanceProposals([MAIN, OC]);

    expect(proposals.map((p) => p.id)).toEqual(['m1']);
    expect(failedSpaces).toEqual(['OC']);
  });

  it('includes closed proposals, ordered active → pending → closed (closed newest first)', async () => {
    mockFetch.mockImplementation(
      routeFetch({
        [MAIN.spaceId]: {
          active: [proposal({ id: 'a', state: 'active', end: 1000 })],
          pending: [proposal({ id: 'p', state: 'pending', start: 5000 })],
          closed: [
            proposal({ id: 'c-old', state: 'closed', end: 100 }),
            proposal({ id: 'c-new', state: 'closed', end: 900 }),
          ],
        },
      })
    );

    const { proposals } = await fetchGovernanceProposals([MAIN]);

    expect(proposals.map((p) => p.id)).toEqual(['a', 'p', 'c-new', 'c-old']);
    expect(proposals.find((p) => p.id === 'c-new')?.space.key).toBe('main');
  });

  it('skips the closed query when includeClosed is false', async () => {
    mockFetch.mockImplementation(
      routeFetch({
        [MAIN.spaceId]: {
          active: [proposal({ id: 'a', state: 'active' })],
          pending: [],
          closed: [proposal({ id: 'c', state: 'closed' })],
        },
      })
    );

    const { proposals } = await fetchGovernanceProposals([MAIN], { includeClosed: false });

    expect(proposals.map((p) => p.id)).toEqual(['a']);
    // Only active + pending queries issued (no closed query).
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const queries = mockFetch.mock.calls.map((c: any) => JSON.parse(c[1].body).query);
    expect(queries.some((q: string) => q.includes('GetClosedProposals'))).toBe(false);
  });

  it('returns empty result when no spaces are configured', async () => {
    const result = await fetchGovernanceProposals([]);
    expect(result).toEqual({ proposals: [], failedSpaces: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
