import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';

import type { Identity, ScoreRow } from '@/lib/dao-delegates/types';
import type { DelegationEntry } from '@/lib/gnosis/types';

import { planDelegation, targetScoringOf } from '../logic/delegation-plan';
import type { OptOutStatuses } from '../opt-out/score-api';

const DELEGATOR = '0x1111111111111111111111111111111111111111';
const ALICE = getAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const BOB = getAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
const CAROL = getAddress('0xcccccccccccccccccccccccccccccccccccccccc');

const OWNER: Identity = {
  id: 'owner',
  hs_username: null,
  forum_handle: null,
  discord_handle: null,
  addresses: [],
};

function row(address: string, rank: number | null = 1): ScoreRow {
  return {
    address: address.toLowerCase(),
    display_name: address,
    rank,
    score: rank === null ? null : 50,
    community: null,
    holdings: 40,
    votes: 60,
    missing_community: true,
    missing_holdings: false,
    missing_votes: false,
    twab: null,
    twab_days: null,
    community_raw: null,
    voted_count: null,
    proposal_count: null,
    hs_rank: null,
    identity: OWNER,
    cohort: rank === null ? null : 'professional',
    power: rank === null ? null : 1000,
    opt_out: null,
  };
}

/** Distinct valid addresses: 0x0101…, 0x0202…, … */
function addresses(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
  );
}

function split(...targets: [string, string][]) {
  return {
    kind: 'split' as const,
    targets: targets.map(([target, percent]) => ({ target, percent })),
  };
}

describe('planDelegation', () => {
  describe('all to one', () => {
    it('delegates 10000 bps to the target and adds it when nothing is delegated yet', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: ALICE.toLowerCase() },
        current: [],
      });

      expect(plan.errors).toEqual([]);
      expect(plan.delegations).toEqual([{ address: ALICE, bps: 10000 }]);
      expect(plan.diff).toEqual({
        added: [{ address: ALICE, bps: 10000 }],
        changed: [],
        removed: [],
      });
      expect(plan.droppedDelegates).toEqual([]);
    });

    it('drops every other current delegate and raises the target to 10000 bps', () => {
      const current: DelegationEntry[] = [
        { address: ALICE.toLowerCase(), power: 60, weight: 6000 },
        { address: BOB.toLowerCase(), power: 40, weight: 4000 },
      ];

      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: ALICE },
        current,
      });

      expect(plan.diff).toEqual({
        added: [],
        changed: [{ address: ALICE, fromBps: 6000, toBps: 10000 }],
        removed: [{ address: BOB, bps: 4000 }],
      });
      expect(plan.droppedDelegates).toEqual([BOB]);
    });

    it('derives the current share from delegated power when the API omits the weight', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: ALICE },
        current: [
          { address: ALICE, power: 75 },
          { address: BOB, power: 25 },
        ],
      });

      expect(plan.diff.changed).toEqual([{ address: ALICE, fromBps: 7500, toBps: 10000 }]);
      expect(plan.diff.removed).toEqual([{ address: BOB, bps: 2500 }]);
    });

    it('rejects a target that is not an address', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: '0x1234' },
        current: [{ address: BOB, power: 1, weight: 10000 }],
      });

      expect(plan.errors).toEqual(['0x1234 is not a valid address.']);
      expect(plan.delegations).toEqual([]);
      expect(plan.droppedDelegates).toEqual([]);
    });

    it('rejects the zero address and the delegator itself', () => {
      const zero = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: '0x0000000000000000000000000000000000000000' },
        current: [],
      });
      const self = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: DELEGATOR },
        current: [],
      });

      expect(zero.errors).toEqual(["You can't delegate to the zero address."]);
      expect(self.errors).toEqual(["You can't delegate to your own address."]);
    });

    it('rejects a delegation identical to the current one', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'all-to-one', target: ALICE },
        current: [{ address: ALICE.toLowerCase(), power: 10, weight: 10000 }],
      });

      expect(plan.errors).toEqual([`You already delegate everything to ${ALICE}.`]);
    });
  });

  describe('clear', () => {
    it('removes and drops every current delegate', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'clear' },
        current: [
          { address: ALICE.toLowerCase(), power: 60, weight: 6000 },
          { address: BOB.toLowerCase(), power: 40, weight: 4000 },
        ],
      });

      expect(plan.errors).toEqual([]);
      expect(plan.delegations).toEqual([]);
      expect(plan.diff).toEqual({
        added: [],
        changed: [],
        removed: [
          { address: ALICE, bps: 6000 },
          { address: BOB, bps: 4000 },
        ],
      });
      expect(plan.droppedDelegates).toEqual([ALICE, BOB]);
    });

    it('rejects clearing when nothing is delegated', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
        scoring: {},
        input: { kind: 'clear' },
        current: [],
      });

      expect(plan.errors).toEqual(['You have no delegation to clear.']);
    });
  });
});

describe('planDelegation split', () => {
  function planSplit(input: ReturnType<typeof split>, current: DelegationEntry[] = []) {
    return planDelegation({ delegator: DELEGATOR, scoring: {}, input, current });
  }

  it('converts two-decimal percentages to basis points that sum to exactly 10000', () => {
    const plan = planSplit(split([ALICE, '33.33'], [BOB, '33.33'], [CAROL, '33.34']));

    expect(plan.errors).toEqual([]);
    expect(plan.delegations).toEqual([
      { address: ALICE, bps: 3333 },
      { address: BOB, bps: 3333 },
      { address: CAROL, bps: 3334 },
    ]);
  });

  it('accepts whole and one-decimal percentages', () => {
    const plan = planSplit(split([ALICE, '70'], [BOB, '29.5'], [CAROL, '0.50']));

    expect(plan.delegations.map((d) => d.bps)).toEqual([7000, 2950, 50]);
  });

  it('rejects totals other than 100%', () => {
    expect(planSplit(split([ALICE, '50'], [BOB, '49.99'])).errors).toEqual([
      'The percentages add up to 99.99%, not 100%.',
    ]);
    expect(planSplit(split([ALICE, '60'], [BOB, '40.01'])).errors).toEqual([
      'The percentages add up to 100.01%, not 100%.',
    ]);
  });

  it('rejects percentages with more than two decimals, and zero or missing percentages', () => {
    expect(planSplit(split([ALICE, '33.333'], [BOB, '66.667'])).errors).toEqual([
      '33.333 is not a valid percentage. Use a number with up to 2 decimals.',
      '66.667 is not a valid percentage. Use a number with up to 2 decimals.',
    ]);
    expect(planSplit(split([ALICE, '100'], [BOB, '0'])).errors).toEqual([
      'Every percentage must be above 0.',
    ]);
    expect(planSplit(split([ALICE, '100'], [BOB, ''])).errors).toEqual([
      'Enter a percentage for every address.',
    ]);
  });

  it('rejects a split with fewer than 2 targets', () => {
    expect(planSplit(split([ALICE, '100'])).errors).toEqual([
      'Split across at least 2 addresses, or use All to one.',
    ]);
  });

  it('accepts 10 targets and rejects more than 10', () => {
    const ten = addresses(10).map((a): [string, string] => [a, '10']);
    const eleven = addresses(11).map((a, i): [string, string] => [a, i === 0 ? '0.1' : '9.99']);

    expect(planSplit(split(...ten)).errors).toEqual([]);
    expect(planSplit(split(...ten)).delegations).toHaveLength(10);
    expect(planSplit(split(...eleven)).errors).toEqual([
      'You can split across at most 10 addresses.',
    ]);
  });

  it('rejects the same target twice, whatever its casing', () => {
    const plan = planSplit(split([ALICE, '50'], [ALICE.toLowerCase(), '50']));

    expect(plan.errors).toEqual([`${ALICE} appears more than once.`]);
  });

  it('rejects empty, invalid and own-address targets', () => {
    expect(planSplit(split([ALICE, '50'], ['', '50'])).errors).toEqual([
      'Enter an address for every row.',
    ]);
    expect(planSplit(split([ALICE, '50'], ['0x1234', '50'])).errors).toEqual([
      '0x1234 is not a valid address.',
    ]);
    expect(planSplit(split([ALICE, '50'], [DELEGATOR, '50'])).errors).toEqual([
      "You can't delegate to your own address.",
    ]);
  });

  it('diffs the split against the current delegations and lists dropped delegates', () => {
    const plan = planSplit(split([ALICE, '25'], [CAROL, '75']), [
      { address: ALICE.toLowerCase(), power: 50, weight: 5000 },
      { address: BOB.toLowerCase(), power: 50, weight: 5000 },
    ]);

    expect(plan.diff).toEqual({
      added: [{ address: CAROL, bps: 7500 }],
      changed: [{ address: ALICE, fromBps: 5000, toBps: 2500 }],
      removed: [{ address: BOB, bps: 5000 }],
    });
    expect(plan.droppedDelegates).toEqual([BOB]);
  });

  it('rejects a split identical to the current delegation', () => {
    const plan = planSplit(split([BOB, '40'], [ALICE, '60']), [
      { address: ALICE.toLowerCase(), power: 60, weight: 6000 },
      { address: BOB.toLowerCase(), power: 40, weight: 4000 },
    ]);

    expect(plan.errors).toEqual(['Your delegation already matches this split.']);
  });
});

describe('planDelegation warnings', () => {
  function warningsFor(targets: [string, string][], rows: ScoreRow[], statuses: OptOutStatuses) {
    return planDelegation({
      delegator: DELEGATOR,
      scoring: targetScoringOf(rows, statuses),
      input: split(...targets),
      current: [],
    }).warnings;
  }

  it('warns for a target without a leaderboard row or without a rank', () => {
    const warnings = warningsFor(
      [
        [ALICE, '50'],
        [BOB, '30'],
        [CAROL, '20'],
      ],
      [row(ALICE), row(BOB, null)],
      {},
    );

    expect(warnings).toEqual([
      `${BOB} is not scored. The power you delegate to it leaves the scored set.`,
      `${CAROL} is not scored. The power you delegate to it leaves the scored set.`,
    ]);
  });

  it('warns for opted-out targets and pending opt-outs, but not after an opt-in', () => {
    const warnings = warningsFor(
      [
        [ALICE, '50'],
        [BOB, '30'],
        [CAROL, '20'],
      ],
      [row(ALICE), row(BOB), row(CAROL)],
      {
        [ALICE.toLowerCase()]: { action: 'opt-out', status: 'applied' },
        [BOB.toLowerCase()]: { action: 'opt-out', status: 'pending' },
        [CAROL.toLowerCase()]: { action: 'opt-in', status: 'applied' },
      },
    );

    expect(warnings).toEqual([
      `${ALICE} opted out of scoring. The power you delegate to it leaves the scored set.`,
      `${BOB} is opting out of scoring. The power you delegate to it leaves the scored set after the next run.`,
    ]);
  });

  it('warns for an all-to-one target too, and never blocks the plan', () => {
    const plan = planDelegation({
      delegator: DELEGATOR,
      scoring: targetScoringOf([], {}),
      input: { kind: 'all-to-one', target: ALICE },
      current: [],
    });

    expect(plan.errors).toEqual([]);
    expect(plan.delegations).toEqual([{ address: ALICE, bps: 10000 }]);
    expect(plan.warnings).toEqual([
      `${ALICE} is not scored. The power you delegate to it leaves the scored set.`,
    ]);
  });
});
