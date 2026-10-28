import { describe, expect, it } from 'vitest';

import { scoreBreakdownOf } from '../logic/score-breakdown';
import type { ScoreRow } from '../types';

function row(overrides: Partial<ScoreRow> = {}): ScoreRow {
  return {
    address: '0xaaa',
    display_name: 'A',
    rank: 3,
    score: 71.234,
    community: 80,
    holdings: 60,
    votes: 74,
    missing_community: false,
    missing_holdings: false,
    missing_votes: false,
    twab: null,
    twab_days: null,
    community_raw: null,
    voted_count: 9,
    proposal_count: 12,
    hs_rank: null,
    identity: {
      id: 'i',
      hs_username: null,
      forum_handle: null,
      discord_handle: null,
      addresses: [],
    },
    cohort: null,
    power: null,
    opt_out: null,
    ...overrides,
  };
}

describe('scoreBreakdownOf', () => {
  it('splits the score into pillars and keeps the rank and score', () => {
    const own = row();
    const result = scoreBreakdownOf(own, [own]);

    expect(result).toMatchObject({ score: 71.234, rank: 3 });
    expect(result?.pillars.map((p) => [p.label, p.score])).toEqual([
      ['Community', 80],
      ['Holdings', 60],
      ['Votes', 74],
    ]);
  });

  it('notes how many proposals the votes pillar counted', () => {
    const own = row();

    expect(scoreBreakdownOf(own, [own])?.pillars[2].note).toBe('9 of 12 proposals');
  });

  it('flags a pillar without data as missing', () => {
    const own = row({ holdings: 0, missing_holdings: true });

    expect(scoreBreakdownOf(own, [own])?.pillars[1]).toMatchObject({ missing: true });
  });

  it('leaves out a pillar that is not live for any row', () => {
    const own = row({ community: null });

    expect(
      scoreBreakdownOf(own, [own, row({ community: null })])?.pillars.map((p) => p.key),
    ).toEqual(['holdings', 'votes']);
  });

  it('is null for an address without a row', () => {
    expect(scoreBreakdownOf(undefined, [row()])).toBeNull();
  });
});
