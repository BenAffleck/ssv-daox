import type { DelegationEntry, VotingPowerData } from '@/lib/gnosis/types';

import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';

export const AUTO_DELEGATION_POOL_NAME = 'DAO auto-delegation pool';

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function isAutoDelegationPool(address: string): boolean {
  return sameAddress(address, AUTO_DELEGATION_POOL_ADDRESS);
}

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
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
}

export interface AutoDelegationView {
  /** `null` when the pin lookup failed. */
  breakdown: VotingPowerBreakdown | null;
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

/** The "Let the DAO delegate for you" path for one address. */
export function autoDelegationView({ pin, poolAddress }: AutoDelegationInput): AutoDelegationView {
  return { breakdown: pin && toBreakdown(pin, poolAddress) };
}
