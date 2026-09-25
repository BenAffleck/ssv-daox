import { describe, expect, it } from 'vitest';

import type { Identity, ScoreRow } from '@/lib/dao-delegates/types';

import { buildAddressOverview } from '../logic/address-overview';

const ALICE_1 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const ALICE_2 = '0x2222222222222222222222222222222222222222';
const ALICE_3 = '0x3333333333333333333333333333333333333333';
const BOB = '0x4444444444444444444444444444444444444444';

function identity(id: string, addresses: string[], hsUsername: string | null = null): Identity {
  return {
    id,
    hs_username: hsUsername,
    forum_handle: null,
    discord_handle: null,
    addresses: addresses.map((address) => ({ address, ens_name: null })),
  };
}

function row(address: string, owner: Identity, community: number | null = null): ScoreRow {
  return {
    address,
    display_name: address,
    rank: 1,
    score: 50,
    community,
    holdings: 40,
    votes: 60,
    missing_community: community === null,
    missing_holdings: false,
    missing_votes: false,
    twab: null,
    twab_days: null,
    community_raw: null,
    voted_count: null,
    proposal_count: null,
    hs_rank: null,
    identity: owner,
    cohort: 'professional',
    power: 1000,
  };
}

describe('buildAddressOverview', () => {
  const alice = identity('alice', [ALICE_1, ALICE_2, ALICE_3]);
  const bob = identity('bob', [BOB]);
  const rows = [row(ALICE_2, alice), row(BOB, bob), row(ALICE_1, alice)];

  it('lists the requested address first, then its identity siblings', () => {
    const overview = buildAddressOverview(ALICE_2, rows);

    expect(overview?.addresses.map((a) => a.address)).toEqual([ALICE_2, ALICE_1, ALICE_3]);
  });

  it('matches the requested address regardless of case', () => {
    const overview = buildAddressOverview('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD', rows);

    expect(overview?.addresses[0].address).toBe(ALICE_1);
  });

  it('keeps a sibling without a leaderboard row as unscored', () => {
    const overview = buildAddressOverview(ALICE_1, rows);
    const unscored = overview?.addresses.find((a) => a.address === ALICE_3);

    expect(unscored).toMatchObject({ rank: null, score: null, cohort: null, allocatedPower: null });
  });

  it('resolves an address that only appears as a sibling', () => {
    const overview = buildAddressOverview(ALICE_3, rows);

    expect(overview?.addresses.map((a) => a.address)).toEqual([ALICE_3, ALICE_1, ALICE_2]);
  });

  it('resolves a scored address its identity does not list', () => {
    const carol = identity('carol', [ALICE_1]);
    const overview = buildAddressOverview(BOB, [row(BOB, carol), row(ALICE_1, carol)]);

    expect(overview?.addresses.map((a) => a.address)).toEqual([BOB, ALICE_1]);
    expect(overview?.addresses[0].score).toBe(50);
  });

  it('returns null for an address in no identity', () => {
    expect(buildAddressOverview('0x5555555555555555555555555555555555555555', rows)).toBeNull();
  });

  describe('claim status', () => {
    function claimStatusOf(owner: Identity, target: ScoreRow[]) {
      return buildAddressOverview(owner.addresses[0].address, target)?.addresses[0].claimStatus;
    }

    it('is unclaimed without a HighSignal username', () => {
      const owner = identity('carol', [BOB]);

      expect(claimStatusOf(owner, [row(BOB, owner, 70)])).toBe('unclaimed');
    });

    it('is pending while the community pillar is missing', () => {
      const owner = identity('carol', [BOB], 'carol');

      expect(claimStatusOf(owner, [row(BOB, owner, null)])).toBe('claimed_pending');
    });

    it('is pending for a claimed address without a leaderboard row', () => {
      const owner = identity('carol', [ALICE_1, BOB], 'carol');
      const overview = buildAddressOverview(ALICE_1, [row(BOB, owner, 70)]);

      expect(overview?.addresses[0].claimStatus).toBe('claimed_pending');
    });

    it('is scored once the community pillar is present', () => {
      const owner = identity('carol', [BOB], 'carol');

      expect(claimStatusOf(owner, [row(BOB, owner, 70)])).toBe('claimed_scored');
    });
  });
});
