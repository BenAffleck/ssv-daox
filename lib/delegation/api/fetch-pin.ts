import {
  fetchVotingPower,
  type DelegationEntry,
  type FetchVotingPowerOptions,
  type VotingPowerData,
} from '@/lib/gnosis';
import { fetchAllocationBasis } from '@/lib/leaderboard/api/fetch-leaderboard';

import { AUTO_DELEGATION_POOL_ADDRESS, DAO_FUNDING_ADDRESS } from '../config';
import { poolPowerOf, summarizePool, type PoolSummary } from '../logic/auto-delegation';
import type { PoolBasis } from '../logic/power-change';

/** Returns `null` when the Gnosis API lookup fails. */
export async function fetchPin(
  address: string,
  options?: FetchVotingPowerOptions,
): Promise<VotingPowerData | null> {
  const votingPower = await fetchVotingPower([address], options);
  return votingPower[address.toLowerCase()] ?? null;
}

/** What the pool delegates to each address now; empty when the Gnosis API lookup fails. */
export async function fetchPoolDelegations(): Promise<DelegationEntry[]> {
  const pool = await fetchPin(AUTO_DELEGATION_POOL_ADDRESS);
  return pool?.outgoingDelegations ?? [];
}

/** Lowercase addresses the pool delegates to; `null` when the Gnosis API lookup fails. */
export async function fetchPoolRecipients(): Promise<string[] | null> {
  const pool = await fetchPin(AUTO_DELEGATION_POOL_ADDRESS);
  return pool && pool.outgoingDelegations.map((entry) => entry.address.toLowerCase());
}

/** Returns `null` when the Gnosis API lookup fails; throws when the Score API fails. */
export async function fetchPoolSummary(): Promise<PoolSummary | null> {
  const [pool, { cap }] = await Promise.all([
    fetchPin(AUTO_DELEGATION_POOL_ADDRESS),
    fetchAllocationBasis(),
  ]);
  return pool && summarizePool(pool, cap, [DAO_FUNDING_ADDRESS]);
}

/**
 * The latest run's allocation beside the live pool, to project its seats onto the pool.
 * Returns `null` when either lookup fails: the next round then shows unscaled.
 */
export async function fetchPoolBasis(): Promise<PoolBasis | null> {
  const [pool, run] = await Promise.all([
    fetchPin(AUTO_DELEGATION_POOL_ADDRESS),
    fetchAllocationBasis().catch((error: unknown) => {
      console.error('[Score API] Allocation basis unavailable:', error);
      return null;
    }),
  ]);
  return pool && run && { ...run, livePool: poolPowerOf(pool) };
}
