import { describe, expect, it } from 'vitest';

import { toRegistryDelegations } from '../registry';

describe('toRegistryDelegations', () => {
  it('left-pads delegates to bytes32 in the ascending order the contract requires', () => {
    const result = toRegistryDelegations([
      { address: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', bps: 4000 },
      { address: '0x0aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', bps: 6000 },
    ]);

    expect(result).toEqual([
      {
        delegate: '0x0000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        ratio: BigInt(6000),
      },
      {
        delegate: '0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        ratio: BigInt(4000),
      },
    ]);
  });
});
