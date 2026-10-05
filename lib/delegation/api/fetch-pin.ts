import { fetchAllocationCap } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { fetchVotingPower, type VotingPowerData } from '@/lib/gnosis';

import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';
import { summarizePool, type PoolSummary } from '../logic/auto-delegation';

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPin(address: string): Promise<VotingPowerData | null> {
  const votingPower = await fetchVotingPower([address]);
  return votingPower[address.toLowerCase()] ?? null;
}

/** Returns `null` when the Gnosis API lookup fails; throws when the Score API fails. */
export async function fetchPoolSummary(): Promise<PoolSummary | null> {
  const [pool, cap] = await Promise.all([
    fetchPin(AUTO_DELEGATION_POOL_ADDRESS),
    fetchAllocationCap(),
  ]);
  return pool && summarizePool(pool, cap);
}
