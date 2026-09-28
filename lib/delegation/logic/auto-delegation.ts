import type { DelegationEntry, VotingPowerData } from '@/lib/gnosis/types';

import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';

export const AUTO_DELEGATION_POOL_NAME = 'DAO auto-delegation pool';

export function isAutoDelegationPool(address: string): boolean {
  return address.toLowerCase() === AUTO_DELEGATION_POOL_ADDRESS.toLowerCase();
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
    daoHeldPower: pool.votingPower - pool.incomingPower + pool.outgoingPower,
    communityPower: pool.incomingPower,
    delegatorCount: pool.delegatorCount,
  };
}

export interface OutgoingDelegation extends DelegationEntry {
  isPool: boolean;
}

export interface VotingPowerBreakdown {
  /** SSV + cSSV the address holds itself. */
  ownPower: number;
  incomingPower: number;
  delegatorCount: number;
  incoming: DelegationEntry[];
  /** Incoming power from the pool; `null` when the pool delegates nothing in. */
  fromPoolPower: number | null;
  outgoingPower: number;
  outgoing: OutgoingDelegation[];
  totalPower: number;
}

export interface AutoDelegationInput {
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
}

export interface AutoDelegationView {
  /** `null` when the pin lookup failed. */
  breakdown: VotingPowerBreakdown | null;
}

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function toBreakdown(pin: VotingPowerData, poolAddress: string): VotingPowerBreakdown {
  const fromPoolPower = pin.incomingDelegations
    .filter((entry) => sameAddress(entry.address, poolAddress))
    .reduce((sum, entry) => sum + (entry.power ?? 0), 0);
  return {
    ownPower: pin.votingPower - pin.incomingPower + pin.outgoingPower,
    incomingPower: pin.incomingPower,
    delegatorCount: pin.delegatorCount,
    incoming: pin.incomingDelegations,
    fromPoolPower: fromPoolPower > 0 ? fromPoolPower : null,
    outgoingPower: pin.outgoingPower,
    outgoing: pin.outgoingDelegations.map((entry) => ({
      ...entry,
      isPool: sameAddress(entry.address, poolAddress),
    })),
    totalPower: pin.votingPower,
  };
}

/** The "Let the DAO delegate for you" path for one address. */
export function autoDelegationView({ pin, poolAddress }: AutoDelegationInput): AutoDelegationView {
  return { breakdown: pin && toBreakdown(pin, poolAddress) };
}
