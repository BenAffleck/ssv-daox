import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';

import type { DelegationEntry } from '@/lib/gnosis/types';

import { planDelegation } from '../logic/delegation-plan';

const DELEGATOR = '0x1111111111111111111111111111111111111111';
const ALICE = getAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const BOB = getAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

describe('planDelegation', () => {
  describe('all to one', () => {
    it('delegates 10000 bps to the target and adds it when nothing is delegated yet', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
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
        input: { kind: 'all-to-one', target: '0x0000000000000000000000000000000000000000' },
        current: [],
      });
      const self = planDelegation({
        delegator: DELEGATOR,
        input: { kind: 'all-to-one', target: DELEGATOR },
        current: [],
      });

      expect(zero.errors).toEqual(["You can't delegate to the zero address."]);
      expect(self.errors).toEqual(["You can't delegate to your own address."]);
    });

    it('rejects a delegation identical to the current one', () => {
      const plan = planDelegation({
        delegator: DELEGATOR,
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
      const plan = planDelegation({ delegator: DELEGATOR, input: { kind: 'clear' }, current: [] });

      expect(plan.errors).toEqual(['You have no delegation to clear.']);
    });
  });
});
