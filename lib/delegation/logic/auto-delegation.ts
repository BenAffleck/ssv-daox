import type { VotingPowerData } from '@/lib/gnosis/types';

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
