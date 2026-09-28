import { describe, expect, it } from 'vitest';

import { toVotingPowerData } from '@/lib/gnosis/logic/transform-voting-power';
import type { GnosisDelegationResponse } from '@/lib/gnosis/types';

import { summarizePool } from '../logic/auto-delegation';

function poolPin(overrides: Partial<GnosisDelegationResponse> = {}) {
  return toVotingPowerData({
    votingPower: '0',
    incomingPower: '0',
    outgoingPower: '0',
    delegators: [],
    percentOfVotingPower: '0',
    blockNumber: '26069188',
    ...overrides,
  });
}

describe('summarizePool', () => {
  it('counts all power as DAO-held when nobody delegates in', () => {
    expect(summarizePool(poolPin({ votingPower: '1260000' }))).toEqual({
      totalPower: 1260000,
      daoHeldPower: 1260000,
      communityPower: 0,
      delegatorCount: 0,
    });
  });

  it('splits incoming power and delegators out as community-delegated', () => {
    const summary = summarizePool(
      poolPin({
        votingPower: '1300000',
        incomingPower: '40000',
        delegators: ['0xaaa', '0xbbb'],
        delegatorTree: [
          { delegator: '0xaaa', delegatedPower: 30000 },
          { delegator: '0xbbb', delegatedPower: 10000 },
        ],
      }),
    );

    expect(summary).toEqual({
      totalPower: 1300000,
      daoHeldPower: 1260000,
      communityPower: 40000,
      delegatorCount: 2,
    });
  });

  it('counts power the pool delegates out as DAO-held', () => {
    const summary = summarizePool(
      poolPin({ votingPower: '1000000', incomingPower: '40000', outgoingPower: '300000' }),
    );

    expect(summary.daoHeldPower).toBe(1260000);
  });
});
