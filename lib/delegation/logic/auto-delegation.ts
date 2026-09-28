import type { Address } from 'viem';

import type { DelegationEntry, VotingPowerData } from '@/lib/gnosis/types';

import { planDelegation, toPlannedDelegations, type PlannedDelegation } from './delegation-plan';
import { sameAddress } from './pool';

const FULL_BPS = 10000;
// Own power is total − incoming + outgoing over floats, so exact zero can come out as dust.
const DUST = 1e-9;

/** Tokens the address holds itself, as opposed to power delegated to it. */
function ownPower(pin: VotingPowerData): number {
  return pin.votingPower - pin.incomingPower + pin.outgoingPower;
}

export interface PoolSummary {
  totalPower: number;
  /** The pool's own tokens. */
  daoHeldPower: number;
  /** Power delegated in by the community. */
  communityPower: number;
  delegatorCount: number;
}

export function formatPower(power: number): string {
  return `${Math.round(power).toLocaleString()} SSV`;
}

export function formatDelegatorCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'delegator' : 'delegators'}`;
}

export function summarizePool(pool: VotingPowerData): PoolSummary {
  return {
    totalPower: pool.votingPower,
    daoHeldPower: ownPower(pool),
    communityPower: pool.incomingPower,
    delegatorCount: pool.delegatorCount,
  };
}

export interface BreakdownEntry extends DelegationEntry {
  isPool: boolean;
}

export interface VotingPowerBreakdown {
  /** SSV + cSSV the address holds itself. */
  ownPower: number;
  incomingPower: number;
  delegatorCount: number;
  incoming: BreakdownEntry[];
  /** `null` when the pool delegates nothing in; `power` is `null` when the API omitted it. */
  fromPool: { power: number | null } | null;
  outgoingPower: number;
  outgoing: BreakdownEntry[];
  totalPower: number;
}

export interface AutoDelegationInput {
  /** The selected address. */
  address: string;
  /** The connected wallet; `undefined` when none is connected. */
  connected: string | undefined;
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
}

/** Third-party power delegated in, which the pool delegation passes on too. */
export interface MovesAlong {
  delegatorCount: number;
  /** `null` when the API omitted an amount. */
  power: number | null;
}

/** What the "Delegate to the DAO" action can do for the selected address. */
export type AutoDelegationState =
  | { kind: 'unavailable' }
  | { kind: 'switch-account' }
  | { kind: 'nothing-to-delegate'; reason: 'no-power' | 'pool' }
  | { kind: 'already-delegating'; power: number }
  | {
      kind: 'ready';
      /** The all-to-one pool delegation to write. */
      delegations: PlannedDelegation[];
      /** Current delegates the write removes; the user must confirm dropping them. */
      droppedDelegates: Address[];
      /** `null` when no third party delegates in. */
      movesAlong: MovesAlong | null;
    };

export interface AutoDelegationView {
  /** `null` when the pin lookup failed. */
  breakdown: VotingPowerBreakdown | null;
  state: AutoDelegationState;
}

function flagPool(entries: DelegationEntry[], poolAddress: string): BreakdownEntry[] {
  return entries.map((entry) => ({ ...entry, isPool: sameAddress(entry.address, poolAddress) }));
}

function fromPool(incoming: BreakdownEntry[]): VotingPowerBreakdown['fromPool'] {
  const pool = incoming.filter((entry) => entry.isPool);
  if (pool.some((entry) => entry.power === null)) {
    return { power: null };
  }
  const power = pool.reduce((sum, entry) => sum + (entry.power ?? 0), 0);
  return power > 0 ? { power } : null;
}

function toBreakdown(pin: VotingPowerData, poolAddress: string): VotingPowerBreakdown {
  const incoming = flagPool(pin.incomingDelegations, poolAddress);
  return {
    ownPower: ownPower(pin),
    incomingPower: pin.incomingPower,
    delegatorCount: pin.delegatorCount,
    incoming,
    fromPool: fromPool(incoming),
    outgoingPower: pin.outgoingPower,
    outgoing: flagPool(pin.outgoingDelegations, poolAddress),
    totalPower: pin.votingPower,
  };
}

function movesAlong(incoming: BreakdownEntry[]): MovesAlong | null {
  const thirdParties = incoming.filter((entry) => !entry.isPool);
  const power = thirdParties.some((entry) => entry.power === null)
    ? null
    : thirdParties.reduce((sum, entry) => sum + (entry.power ?? 0), 0);
  if (thirdParties.length === 0 || power === 0) {
    return null;
  }
  return { delegatorCount: thirdParties.length, power };
}

function delegatesAllToPool(outgoing: DelegationEntry[], poolAddress: string): boolean {
  const planned = toPlannedDelegations(outgoing);
  return (
    planned.length === 1 &&
    sameAddress(planned[0].address, poolAddress) &&
    planned[0].bps === FULL_BPS
  );
}

function stateOf(
  { address, connected, poolAddress }: AutoDelegationInput,
  pin: VotingPowerData | null,
  breakdown: VotingPowerBreakdown | null,
): AutoDelegationState {
  if (!pin || !breakdown) {
    return { kind: 'unavailable' };
  }
  if (sameAddress(address, poolAddress)) {
    return { kind: 'nothing-to-delegate', reason: 'pool' };
  }
  if (!connected || !sameAddress(connected, address)) {
    return { kind: 'switch-account' };
  }
  const along = movesAlong(breakdown.incoming);
  if (breakdown.ownPower <= DUST && along === null) {
    return { kind: 'nothing-to-delegate', reason: 'no-power' };
  }
  if (delegatesAllToPool(pin.outgoingDelegations, poolAddress)) {
    return { kind: 'already-delegating', power: breakdown.outgoingPower };
  }
  // Scoring is empty: the pool is a known target and draws no warning.
  const plan = planDelegation({
    delegator: address,
    input: { kind: 'all-to-one', target: poolAddress },
    current: pin.outgoingDelegations,
    scoring: {},
  });
  return {
    kind: 'ready',
    delegations: plan.delegations,
    droppedDelegates: plan.droppedDelegates,
    movesAlong: along,
  };
}

/** The "Let the DAO delegate for you" path for one address. */
export function autoDelegationView(input: AutoDelegationInput): AutoDelegationView {
  const breakdown = input.pin && toBreakdown(input.pin, input.poolAddress);
  return { breakdown, state: stateOf(input, input.pin, breakdown) };
}
