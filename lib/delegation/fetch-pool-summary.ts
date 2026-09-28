import { fetchVotingPower } from '@/lib/gnosis';

import { AUTO_DELEGATION_POOL_ADDRESS } from './config';
import { summarizePool, type PoolSummary } from './logic/auto-delegation';

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPoolSummary(): Promise<PoolSummary | null> {
  const votingPower = await fetchVotingPower([AUTO_DELEGATION_POOL_ADDRESS]);
  const pool = votingPower[AUTO_DELEGATION_POOL_ADDRESS.toLowerCase()];
  return pool ? summarizePool(pool) : null;
}
