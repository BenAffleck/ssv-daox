import { fetchAllocationCap } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { fetchVotingPower, type DelegationEntry, type VotingPowerData } from '@/lib/gnosis';

import { AUTO_DELEGATION_POOL_ADDRESS, DAO_FUNDING_ADDRESS } from '../config';
import { summarizePool, type PoolSummary } from '../logic/auto-delegation';

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPin(address: string): Promise<VotingPowerData | null> {
  const votingPower = await fetchVotingPower([address]);
  return votingPower[address.toLowerCase()] ?? null;
}

/** What the pool delegates to each address now; empty when the Gnosis API lookup fails. */
export async function fetchPoolDelegations(): Promise<DelegationEntry[]> {
  const pool = await fetchPin(AUTO_DELEGATION_POOL_ADDRESS);
  return pool?.outgoingDelegations ?? [];
}

/** Lowercase addresses the pool delegates to; empty when the Gnosis API lookup fails. */
export async function fetchPoolRecipients(): Promise<string[]> {
  return (await fetchPoolDelegations()).map((entry) => entry.address.toLowerCase());
}

/** Returns `null` when the Gnosis API lookup fails; throws when the Score API fails. */
export async function fetchPoolSummary(): Promise<PoolSummary | null> {
  const [pool, cap] = await Promise.all([
    fetchPin(AUTO_DELEGATION_POOL_ADDRESS),
    fetchAllocationCap(),
  ]);
  return pool && summarizePool(pool, cap, [DAO_FUNDING_ADDRESS]);
}
