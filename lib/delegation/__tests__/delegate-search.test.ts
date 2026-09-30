import { describe, expect, it } from 'vitest';

import type { ScoreRow } from '@/lib/dao-delegates/types';

import { delegateOptionsOf, searchDelegates } from '../logic/delegate-search';
import type { TargetScoring } from '../logic/delegation-plan';

const ALICE = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BOB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const CAROL = '0xcccccccccccccccccccccccccccccccccccccccc';
const DAVE = '0xdddddddddddddddddddddddddddddddddddddddd';

function row(address: string, name: string, rank: number | null, ens: string | null = null) {
  return {
    address,
    display_name: name,
    rank,
    identity: { id: name, addresses: [{ address, ens_name: ens }] },
  } as ScoreRow;
}

const ROWS = [
  row(CAROL, 'Carol Validator', 3),
  row(ALICE, 'Alice Nodes', 1, 'alice.eth'),
  row(BOB, 'bobby', 2, 'lido-voter.eth'),
  row(DAVE, 'Dave', null),
];
const SCORING: TargetScoring = { [ALICE]: 'scored', [BOB]: 'scored', [CAROL]: 'scored' };
const OPTIONS = delegateOptionsOf(ROWS, SCORING);

const addressesOf = (query: string) => searchDelegates(OPTIONS, query).map((o) => o.address);

describe('delegateOptionsOf', () => {
  it('lists only scored delegates, best rank first, with their ENS name', () => {
    expect(OPTIONS).toEqual([
      { address: ALICE, name: 'Alice Nodes', ensName: 'alice.eth', rank: 1 },
      { address: BOB, name: 'bobby', ensName: 'lido-voter.eth', rank: 2 },
      { address: CAROL, name: 'Carol Validator', ensName: null, rank: 3 },
    ]);
  });

  it('leaves out opted-out delegates', () => {
    const options = delegateOptionsOf(ROWS, { ...SCORING, [BOB]: 'opted_out' });
    expect(options.map((o) => o.address)).toEqual([ALICE, CAROL]);
  });
});

describe('searchDelegates', () => {
  it('offers the top-ranked delegates for an empty query', () => {
    expect(addressesOf('')).toEqual([ALICE, BOB, CAROL]);
    expect(searchDelegates(OPTIONS, '', 2)).toHaveLength(2);
  });

  it('matches name, ENS name and address case-insensitively', () => {
    expect(addressesOf('carol')).toEqual([CAROL]);
    expect(addressesOf('LIDO')).toEqual([BOB]);
    expect(addressesOf('0xAAAA')).toEqual([ALICE]);
  });

  it('matches loosely when no delegate contains the query', () => {
    expect(addressesOf('cval')).toEqual([CAROL]);
  });

  it('puts name matches ahead of other matches', () => {
    const options = delegateOptionsOf(
      [row(ALICE, 'Validator Alice', 1, 'nodes.eth'), row(BOB, 'Nodes Inc', 2)],
      { [ALICE]: 'scored', [BOB]: 'scored' },
    );
    expect(searchDelegates(options, 'nodes').map((o) => o.address)).toEqual([BOB, ALICE]);
  });

  it('finds nothing for an unrelated query', () => {
    expect(addressesOf('zzz')).toEqual([]);
  });
});
