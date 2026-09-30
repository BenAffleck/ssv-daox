/**
 * Fetches voting power data from Gnosis Guild Delegation API
 */

import { GNOSIS_CONFIG } from '../config';
import { toVotingPowerData } from '../logic/transform-voting-power';
import type { GnosisDelegationResponse, VotingPowerData, VotingPowerMap } from '../types';

/**
 * Fetches voting power for a single address
 * @param address - The delegate address to fetch voting power for
 * @returns VotingPowerData or null if fetch fails
 */
async function fetchSingleVotingPower(address: string): Promise<VotingPowerData | null> {
  const url = `${GNOSIS_CONFIG.apiBaseUrl}/${GNOSIS_CONFIG.spaceId}/pin/${address.toLowerCase()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GNOSIS_CONFIG.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GNOSIS_CONFIG.strategyPayload),
      signal: controller.signal,
      next: { revalidate: GNOSIS_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      console.warn(`[Gnosis API] Failed to fetch voting power for ${address}: ${response.status}`);
      return null;
    }

    const data: GnosisDelegationResponse = await response.json();

    return toVotingPowerData(data);
  } catch (error) {
    console.error(`[Gnosis API] Error fetching voting power for ${address}:`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches voting power for multiple addresses, at most `GNOSIS_CONFIG.concurrency` at a time
 * @param addresses - Array of delegate addresses
 * @returns Map of lowercase addresses to their voting power data
 */
export async function fetchVotingPower(addresses: string[]): Promise<VotingPowerMap> {
  const result: VotingPowerMap = {};
  let next = 0;

  // A worker takes the next address as soon as its request ends, so a slow one holds a single slot.
  async function worker() {
    while (next < addresses.length) {
      const address = addresses[next++];
      const data = await fetchSingleVotingPower(address);
      if (data) {
        result[address.toLowerCase()] = data;
      }
    }
  }

  const workers = Math.min(GNOSIS_CONFIG.concurrency, addresses.length);
  await Promise.all(Array.from({ length: workers }, worker));
  return result;
}
