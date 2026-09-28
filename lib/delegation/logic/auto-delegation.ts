import type { VotingPowerData } from '@/lib/gnosis/types';

export interface PoolSummary {
  totalPower: number;
  /** The pool's own tokens. */
  daoHeldPower: number;
  /** Power delegated in by the community. */
  communityPower: number;
  delegatorCount: number;
}

export function summarizePool(pool: VotingPowerData): PoolSummary {
  return {
    totalPower: pool.votingPower,
    daoHeldPower: pool.votingPower - pool.incomingPower + pool.outgoingPower,
    communityPower: pool.incomingPower,
    delegatorCount: pool.delegatorCount,
  };
}
