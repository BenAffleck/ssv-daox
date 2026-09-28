import { fetchVotingPower, type VotingPowerData } from '@/lib/gnosis';

import { AUTO_DELEGATION_POOL_ADDRESS } from '../config';
import { summarizePool, type PoolSummary } from '../logic/auto-delegation';

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPin(address: string): Promise<VotingPowerData | null> {
  const votingPower = await fetchVotingPower([address]);
  return votingPower[address.toLowerCase()] ?? null;
}

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPoolSummary(): Promise<PoolSummary | null> {
  const pool = await fetchPin(AUTO_DELEGATION_POOL_ADDRESS);
  return pool && summarizePool(pool);
}
