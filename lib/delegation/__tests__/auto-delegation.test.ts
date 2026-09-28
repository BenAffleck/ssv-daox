import { describe, expect, it } from 'vitest';

import { toVotingPowerData } from '@/lib/gnosis/logic/transform-voting-power';
import type { GnosisDelegationResponse } from '@/lib/gnosis/types';

import { autoDelegationView, summarizePool } from '../logic/auto-delegation';

function pinData(overrides: Partial<GnosisDelegationResponse> = {}) {
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
    expect(summarizePool(pinData({ votingPower: '1260000' }))).toEqual({
      totalPower: 1260000,
      daoHeldPower: 1260000,
      communityPower: 0,
      delegatorCount: 0,
    });
  });

  it('splits incoming power and delegators out as community-delegated', () => {
    const summary = summarizePool(
      pinData({
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
      pinData({ votingPower: '1000000', incomingPower: '40000', outgoingPower: '300000' }),
    );

    expect(summary.daoHeldPower).toBe(1260000);
  });
});

const POOL = '0xb35096b074fdb9bBac63E3AdaE0Bbde512B2E6b6';

describe('autoDelegationView breakdown', () => {
  it('is unavailable when the pin lookup failed', () => {
    expect(autoDelegationView({ pin: null, poolAddress: POOL }).breakdown).toBeNull();
  });

  it('derives own tokens as total − incoming + outgoing', () => {
    const { breakdown } = autoDelegationView({
      pin: pinData({
        votingPower: '900',
        incomingPower: '300',
        outgoingPower: '400',
        delegators: ['0xaaa'],
        delegatorTree: [{ delegator: '0xaaa', delegatedPower: 300 }],
        delegateTree: [{ delegate: '0xccc', delegatedPower: 400 }],
      }),
      poolAddress: POOL,
    });

    expect(breakdown).toMatchObject({
      ownPower: 1000,
      incomingPower: 300,
      delegatorCount: 1,
      fromPool: null,
      outgoingPower: 400,
      totalPower: 900,
    });
  });

  it('separates power delegated in from the pool, matching its address in any case', () => {
    const { breakdown } = autoDelegationView({
      pin: pinData({
        votingPower: '5000',
        incomingPower: '4500',
        delegators: [POOL.toLowerCase(), '0xaaa'],
        delegatorTree: [
          { delegator: POOL.toLowerCase(), delegatedPower: 4000 },
          { delegator: '0xaaa', delegatedPower: 500 },
        ],
      }),
      poolAddress: POOL,
    });

    expect(breakdown?.incomingPower).toBe(4500);
    expect(breakdown?.fromPool).toEqual({ power: 4000 });
  });

  it('keeps the pool row with an unknown amount when the API omits delegated power', () => {
    const { breakdown } = autoDelegationView({
      pin: pinData({ votingPower: '5000', incomingPower: '4000', delegators: [POOL] }),
      poolAddress: POOL.toLowerCase(),
    });

    expect(breakdown?.fromPool).toEqual({ power: null });
  });

  it('flags the pool among outgoing delegations, matching its address in any case', () => {
    const { breakdown } = autoDelegationView({
      pin: pinData({
        outgoingPower: '1000',
        delegateTree: [
          { delegate: POOL.toUpperCase().replace('0X', '0x'), delegatedPower: 600 },
          { delegate: '0xccc', delegatedPower: 400 },
        ],
      }),
      poolAddress: POOL,
    });

    expect(breakdown?.outgoing.map((e) => e.isPool)).toEqual([true, false]);
  });
});
