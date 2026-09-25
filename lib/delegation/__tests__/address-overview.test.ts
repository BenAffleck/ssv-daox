import { describe, expect, it } from 'vitest';

import type { Identity, ScoreRow } from '@/lib/dao-delegates/types';

import {
  accountSwitchPrompt,
  buildAddressOverview,
  optOutActionFor,
  optOutBadgeOf,
  withOptOutStatuses,
} from '../logic/address-overview';

const ALICE_1 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const ALICE_2 = '0x2222222222222222222222222222222222222222';
const ALICE_3 = '0x3333333333333333333333333333333333333333';
const BOB = '0x4444444444444444444444444444444444444444';

const HIGHSIGNAL = {
  projectUrl: 'https://hs.example/p/ssv/',
  settingsUrlTemplate: 'https://hs.example/settings/u/{username}',
};

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
    opt_out: null,
  };
}

describe('buildAddressOverview', () => {
  const alice = identity('alice', [ALICE_1, ALICE_2, ALICE_3]);
  const bob = identity('bob', [BOB]);
  const rows = [row(ALICE_2, alice), row(BOB, bob), row(ALICE_1, alice)];

  it('lists the requested address first, then its identity siblings', () => {
    const overview = buildAddressOverview(ALICE_2, rows, HIGHSIGNAL);

    expect(overview?.addresses.map((a) => a.address)).toEqual([ALICE_2, ALICE_1, ALICE_3]);
  });

  it('matches the requested address regardless of case', () => {
    const overview = buildAddressOverview(
      '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD',
      rows,
      HIGHSIGNAL,
    );

    expect(overview?.addresses[0].address).toBe(ALICE_1);
  });

  it('keeps a sibling without a leaderboard row as unscored', () => {
    const overview = buildAddressOverview(ALICE_1, rows, HIGHSIGNAL);
    const unscored = overview?.addresses.find((a) => a.address === ALICE_3);

    expect(unscored).toMatchObject({ rank: null, score: null, cohort: null, allocatedPower: null });
  });

  it('resolves an address that only appears as a sibling', () => {
    const overview = buildAddressOverview(ALICE_3, rows, HIGHSIGNAL);

    expect(overview?.addresses.map((a) => a.address)).toEqual([ALICE_3, ALICE_1, ALICE_2]);
  });

  it('resolves a scored address its identity does not list', () => {
    const carol = identity('carol', [ALICE_1]);
    const overview = buildAddressOverview(BOB, [row(BOB, carol), row(ALICE_1, carol)], HIGHSIGNAL);

    expect(overview?.addresses.map((a) => a.address)).toEqual([BOB, ALICE_1]);
    expect(overview?.addresses[0].score).toBe(50);
  });

  it('returns null for an address in no identity', () => {
    expect(
      buildAddressOverview('0x5555555555555555555555555555555555555555', rows, HIGHSIGNAL),
    ).toBeNull();
  });

  describe('claim status', () => {
    function claimStatusOf(owner: Identity, target: ScoreRow[]) {
      return buildAddressOverview(owner.addresses[0].address, target, HIGHSIGNAL)?.addresses[0]
        .claimStatus;
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
      const overview = buildAddressOverview(ALICE_1, [row(BOB, owner, 70)], HIGHSIGNAL);

      expect(overview?.addresses[0].claimStatus).toBe('claimed_pending');
    });

    it('is scored once the community pillar is present', () => {
      const owner = identity('carol', [BOB], 'carol');

      expect(claimStatusOf(owner, [row(BOB, owner, 70)])).toBe('claimed_scored');
    });
  });

  describe('HighSignal links', () => {
    it('sends a first-time user to the project page only', () => {
      const overview = buildAddressOverview(ALICE_1, rows, HIGHSIGNAL);

      expect(overview?.addresses[0].highSignal).toEqual({
        projectUrl: 'https://hs.example/p/ssv/',
        settingsUrl: null,
      });
    });

    it('adds the personal settings page for a known username', () => {
      const owner = identity('carol', [BOB], 'carol');
      const overview = buildAddressOverview(BOB, [row(BOB, owner)], HIGHSIGNAL);

      expect(overview?.addresses[0].highSignal).toEqual({
        projectUrl: 'https://hs.example/p/ssv/',
        settingsUrl: 'https://hs.example/settings/u/carol',
      });
    });

    it('encodes the username into the settings URL', () => {
      const owner = identity('carol', [BOB], 'carol/x y');
      const overview = buildAddressOverview(BOB, [row(BOB, owner)], HIGHSIGNAL);

      expect(overview?.addresses[0].highSignal.settingsUrl).toBe(
        'https://hs.example/settings/u/carol%2Fx%20y',
      );
    });
  });
});

describe('withOptOutStatuses', () => {
  const CHECKSUMMED = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';
  const alice = identity('alice', [CHECKSUMMED, ALICE_2]);

  it('attaches each address its pending opt-out request, matched regardless of case', () => {
    const overview = buildAddressOverview(CHECKSUMMED, [row(CHECKSUMMED, alice)], HIGHSIGNAL);

    const merged = withOptOutStatuses(overview!, {
      [ALICE_1.toLowerCase()]: { action: 'opt-out', status: 'pending' },
    });

    expect(merged.addresses.map((a) => [a.address, a.optOut])).toEqual([
      [CHECKSUMMED, { action: 'opt-out', status: 'pending' }],
      [ALICE_2, null],
    ]);
  });
});

describe('opt-out states', () => {
  it.each([
    ['no request', null, 'opt-out', null],
    ['a pending opt-out', { action: 'opt-out', status: 'pending' }, 'opt-in', 'opt_out_pending'],
    ['an applied opt-out', { action: 'opt-out', status: 'applied' }, 'opt-in', 'opted_out'],
    ['a pending opt-in', { action: 'opt-in', status: 'pending' }, 'opt-out', 'opt_in_pending'],
    ['an applied opt-in', { action: 'opt-in', status: 'applied' }, 'opt-out', null],
  ] as const)('offers the right action and badge after %s', (_, status, action, badge) => {
    expect(optOutActionFor(status)).toBe(action);
    expect(optOutBadgeOf(status)).toBe(badge);
  });
});

describe('accountSwitchPrompt', () => {
  const siblings = [ALICE_1, ALICE_2, ALICE_3];

  it('is not shown without a connected account', () => {
    expect(accountSwitchPrompt(ALICE_1, undefined, siblings)).toBeNull();
  });

  it('is not shown when the selected address is the connected account', () => {
    const connected = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';

    expect(accountSwitchPrompt(ALICE_1, connected, siblings)).toBeNull();
  });

  it('asks to switch from a sibling to the selected address', () => {
    expect(accountSwitchPrompt(ALICE_1, ALICE_2, siblings)).toBe('sibling');
  });

  it('asks to switch from an account outside the identity', () => {
    expect(accountSwitchPrompt(ALICE_1, BOB, siblings)).toBe('other');
  });
});
