import { describe, expect, it } from 'vitest';

import { lookupTargetOf } from '../address-lookup';

const RANKED = {
  publicAddress: '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01',
  ensName: 'ranked.eth',
};
const UNRANKED = '0x1111111111111111111111111111111111111111';

describe('lookupTargetOf', () => {
  it('offers an address that is not on the leaderboard', () => {
    expect(lookupTargetOf(` ${UNRANKED} `, [RANKED])).toBe(UNRANKED);
  });

  it('offers an ENS name that is not on the leaderboard', () => {
    expect(lookupTargetOf('someone.eth', [RANKED])).toBe('someone.eth');
  });

  it('skips an address the leaderboard already lists, in any case', () => {
    expect(lookupTargetOf(RANKED.publicAddress.toLowerCase(), [RANKED])).toBeNull();
  });

  it('skips an ENS name the leaderboard already lists', () => {
    expect(lookupTargetOf('Ranked.eth', [RANKED])).toBeNull();
  });

  it('skips names, handles and partial addresses', () => {
    expect(lookupTargetOf('alice', [RANKED])).toBeNull();
    expect(lookupTargetOf('0x1111', [RANKED])).toBeNull();
    expect(lookupTargetOf('', [RANKED])).toBeNull();
  });
});
