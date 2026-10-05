import { describe, expect, it } from 'vitest';

import type { OptOutStatus } from '@/lib/delegation/opt-out/score-api';
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

const CAP = 500000;

describe('summarizePool', () => {
  it('counts all power as DAO-held when nobody delegates in', () => {
    expect(summarizePool(pinData({ votingPower: '1260000' }), CAP)).toEqual({
      totalPower: 1260000,
      cap: CAP,
      allocatedPower: 500000,
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
      CAP,
    );

    expect(summary).toEqual({
      totalPower: 1300000,
      cap: CAP,
      allocatedPower: 500000,
      daoHeldPower: 1260000,
      communityPower: 40000,
      delegatorCount: 2,
    });
  });

  it('counts power the pool delegates out as DAO-held', () => {
    const summary = summarizePool(
      pinData({ votingPower: '1000000', incomingPower: '40000', outgoingPower: '300000' }),
      CAP,
    );

    expect(summary.daoHeldPower).toBe(1260000);
  });

  it("allocates all power while the pool's power is below the cap", () => {
    expect(summarizePool(pinData({ votingPower: '320000' }), CAP).allocatedPower).toBe(320000);
  });

  it('allocates all power when the run is uncapped', () => {
    expect(summarizePool(pinData({ votingPower: '1260000' }), null).allocatedPower).toBe(1260000);
  });
});

const POOL = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';
const HOLDER = '0x1111111111111111111111111111111111111111';
const DELEGATE = '0x2222222222222222222222222222222222222222';

function view(pin: ReturnType<typeof pinData> | null, address = HOLDER, connected = address) {
  return autoDelegationView({ address, connected, pin, poolAddress: POOL, optOut: null });
}

describe('autoDelegationView breakdown', () => {
  it('is unavailable when the pin lookup failed', () => {
    expect(view(null).breakdown).toBeNull();
  });

  it('derives own tokens as total − incoming + outgoing', () => {
    const { breakdown } = view(
      pinData({
        votingPower: '900',
        incomingPower: '300',
        outgoingPower: '400',
        delegators: ['0xaaa'],
        delegatorTree: [{ delegator: '0xaaa', delegatedPower: 300 }],
        delegateTree: [{ delegate: DELEGATE, delegatedPower: 400 }],
      }),
    );

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
    const { breakdown } = view(
      pinData({
        votingPower: '5000',
        incomingPower: '4500',
        delegators: [POOL.toLowerCase(), '0xaaa'],
        delegatorTree: [
          { delegator: POOL.toLowerCase(), delegatedPower: 4000 },
          { delegator: '0xaaa', delegatedPower: 500 },
        ],
      }),
    );

    expect(breakdown?.incomingPower).toBe(4500);
    expect(breakdown?.fromPool).toEqual({ power: 4000 });
  });

  it('keeps the pool row with an unknown amount when the API omits delegated power', () => {
    const { breakdown } = autoDelegationView({
      address: HOLDER,
      connected: HOLDER,
      pin: pinData({ votingPower: '5000', incomingPower: '4000', delegators: [POOL] }),
      poolAddress: POOL.toLowerCase(),
      optOut: null,
    });

    expect(breakdown?.fromPool).toEqual({ power: null });
  });

  it('flags the pool among outgoing delegations, matching its address in any case', () => {
    const { breakdown } = view(
      pinData({
        outgoingPower: '1000',
        delegateTree: [
          { delegate: POOL.toUpperCase().replace('0X', '0x'), delegatedPower: 600 },
          { delegate: DELEGATE, delegatedPower: 400 },
        ],
      }),
    );

    expect(breakdown?.outgoing.map((e) => e.isPool)).toEqual([true, false]);
  });
});

describe('autoDelegationView state', () => {
  const holding = pinData({ votingPower: '1000' });

  it('is unavailable when the pin lookup failed, so a write never overwrites unseen delegations', () => {
    expect(view(null).state).toEqual({ kind: 'unavailable' });
  });

  it('asks to switch account when the connected wallet is another address', () => {
    expect(view(holding, HOLDER, DELEGATE).state).toEqual({ kind: 'switch-account' });
  });

  it('asks to switch account when no wallet is connected', () => {
    expect(
      autoDelegationView({
        address: HOLDER,
        connected: undefined,
        pin: holding,
        poolAddress: POOL,
        optOut: null,
      }).state,
    ).toEqual({ kind: 'switch-account' });
  });

  it('matches the connected wallet case-insensitively', () => {
    expect(view(holding, HOLDER, HOLDER.toUpperCase().replace('0X', '0x')).state.kind).toBe(
      'ready',
    );
  });

  it('has nothing to delegate without own tokens or third-party power', () => {
    expect(view(pinData()).state).toEqual({ kind: 'nothing-to-delegate', reason: 'no-power' });
  });

  it('has nothing to delegate on the pool address itself, whoever views it', () => {
    const pool = pinData({ votingPower: '1260000' });

    expect(view(pool, POOL.toLowerCase(), DELEGATE).state).toEqual({
      kind: 'nothing-to-delegate',
      reason: 'pool',
    });
  });

  it('is ready to delegate everything to the pool without a current delegation', () => {
    expect(view(holding).state).toEqual({
      kind: 'ready',
      delegations: [{ address: POOL, bps: 10000 }],
      droppedDelegates: [],
      movesAlong: null,
    });
  });

  it('lists the current delegates the pool delegation drops', () => {
    const pin = pinData({
      votingPower: '0',
      outgoingPower: '1000',
      delegateTree: [
        { delegate: DELEGATE, delegatedPower: 600, weight: 6000 },
        { delegate: POOL.toLowerCase(), delegatedPower: 400, weight: 4000 },
      ],
    });

    expect(view(pin).state).toMatchObject({ kind: 'ready', droppedDelegates: [DELEGATE] });
  });

  it('reports third-party power that moves to the pool too', () => {
    const pin = pinData({
      votingPower: '1500',
      incomingPower: '500',
      delegators: ['0xaaa', '0xbbb'],
      delegatorTree: [
        { delegator: '0xaaa', delegatedPower: 300 },
        { delegator: '0xbbb', delegatedPower: 200 },
      ],
    });

    expect(view(pin).state).toMatchObject({
      kind: 'ready',
      movesAlong: { delegatorCount: 2, power: 500 },
    });
  });

  it('reports third-party power with an unknown amount when the API omits it', () => {
    const pin = pinData({ votingPower: '1500', incomingPower: '500', delegators: ['0xaaa'] });

    expect(view(pin).state).toMatchObject({
      kind: 'ready',
      movesAlong: { delegatorCount: 1, power: null },
    });
  });

  it('is already delegating when the only delegation is the pool at 100%', () => {
    const pin = pinData({
      votingPower: '0',
      outgoingPower: '1000',
      delegateTree: [{ delegate: POOL.toLowerCase(), delegatedPower: 1000, weight: 10000 }],
    });

    expect(view(pin).state).toEqual({ kind: 'already-delegating', power: 1000 });
  });

  it('is ready when the pool holds only part of the delegation', () => {
    const pin = pinData({
      votingPower: '0',
      outgoingPower: '1000',
      delegateTree: [
        { delegate: POOL, delegatedPower: 500, weight: 5000 },
        { delegate: DELEGATE, delegatedPower: 500, weight: 5000 },
      ],
    });

    expect(view(pin).state.kind).toBe('ready');
  });
});

describe('autoDelegationView loop guard', () => {
  const seatHolder = pinData({
    votingPower: '5000',
    incomingPower: '4000',
    delegators: [POOL.toLowerCase()],
    delegatorTree: [{ delegator: POOL.toLowerCase(), delegatedPower: 4000 }],
  });

  function guarded(optOut: OptOutStatus | null, pin = seatHolder, connected: string = HOLDER) {
    return autoDelegationView({ address: HOLDER, connected, pin, poolAddress: POOL, optOut }).state;
  }

  it('requires an opt-out first when the pool delegates in and the address is not opted out', () => {
    expect(guarded(null)).toEqual({ kind: 'opt-out-required', poolPower: 4000 });
  });

  it('requires an opt-out first when only an opt-in is on record', () => {
    expect(guarded({ action: 'opt-in', status: 'applied' })).toEqual({
      kind: 'opt-out-required',
      poolPower: 4000,
    });
  });

  it('awaits the next run while the opt-out is pending', () => {
    expect(guarded({ action: 'opt-out', status: 'pending' })).toEqual({ kind: 'awaiting-run' });
  });

  it('awaits the next run once the opt-out is applied but the pool still delegates in', () => {
    expect(guarded({ action: 'opt-out', status: 'applied' })).toEqual({ kind: 'awaiting-run' });
  });

  it('guards with an unknown pool amount when the API omits it', () => {
    const pin = pinData({ votingPower: '5000', incomingPower: '4000', delegators: [POOL] });

    expect(guarded(null, pin)).toEqual({ kind: 'opt-out-required', poolPower: null });
  });

  it('guards rather than reporting nothing to delegate when all power comes from the pool', () => {
    const pin = pinData({
      votingPower: '4000',
      incomingPower: '4000',
      delegators: [POOL],
      delegatorTree: [{ delegator: POOL, delegatedPower: 4000 }],
    });

    expect(guarded(null, pin).kind).toBe('opt-out-required');
  });

  it('guards before asking to switch account', () => {
    expect(guarded(null, seatHolder, DELEGATE).kind).toBe('opt-out-required');
  });

  it('guards an address that already delegates to the pool', () => {
    const pin = pinData({
      votingPower: '4000',
      incomingPower: '4000',
      outgoingPower: '1000',
      delegators: [POOL],
      delegatorTree: [{ delegator: POOL, delegatedPower: 4000 }],
      delegateTree: [{ delegate: POOL, delegatedPower: 1000, weight: 10000 }],
    });

    expect(guarded(null, pin).kind).toBe('opt-out-required');
  });

  it('applies the normal states once the pool no longer delegates in, even when opted out', () => {
    const pin = pinData({ votingPower: '1000' });

    expect(guarded({ action: 'opt-out', status: 'applied' }, pin).kind).toBe('ready');
  });
});
