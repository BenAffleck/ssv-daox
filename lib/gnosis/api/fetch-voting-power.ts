/**
 * Fetches voting power data from Gnosis Guild Delegation API
 */

import { GNOSIS_CONFIG } from '../config';
import type {
  GnosisDelegationResponse,
  VotingPowerData,
  VotingPowerMap,
} from '../types';

/**
 * Fetches voting power for a single address
 * @param address - The delegate address to fetch voting power for
 * @returns VotingPowerData or null if fetch fails
 */
async function fetchSingleVotingPower(
  address: string
): Promise<VotingPowerData | null> {
  const url = `${GNOSIS_CONFIG.apiBaseUrl}/${GNOSIS_CONFIG.spaceId}/pin/${address}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GNOSIS_CONFIG.strategyPayload),
      next: { revalidate: GNOSIS_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      console.warn(
        `[Gnosis API] Failed to fetch voting power for ${address}: ${response.status}`
      );
      return null;
    }

    const data: GnosisDelegationResponse = await response.json();

    return {
      votingPower: parseFloat(data.votingPower) || 0,
      incomingPower: parseFloat(data.incomingPower) || 0,
      outgoingPower: parseFloat(data.outgoingPower) || 0,
      delegatorCount: data.delegators?.length || 0,
      delegators: data.delegators || [],
      percentOfVotingPower: parseFloat(data.percentOfVotingPower) || 0,
      blockNumber: data.blockNumber,
    };
  } catch (error) {
    console.error(`[Gnosis API] Error fetching voting power for ${address}:`, error);
    return null;
  }
}

/**
 * Process a batch of addresses concurrently
 * @param addresses - Array of addresses to process
 * @returns Map of address to voting power data
 */
async function processBatch(addresses: string[]): Promise<VotingPowerMap> {
  const results = await Promise.all(
    addresses.map(async (address) => {
      const data = await fetchSingleVotingPower(address);
      return { address: address.toLowerCase(), data };
    })
  );

  const map: VotingPowerMap = {};
  for (const { address, data } of results) {
    if (data) {
      map[address] = data;
    }
  }
  return map;
}

/**
 * Fetches voting power for multiple addresses with batching
 * @param addresses - Array of delegate addresses
 * @returns Map of lowercase addresses to their voting power data
 */
export async function fetchVotingPower(
  addresses: string[]
): Promise<VotingPowerMap> {
  if (addresses.length === 0) {
    return {};
  }

  const result: VotingPowerMap = {};
  const batchSize = GNOSIS_CONFIG.batchSize;

  // Process in batches to avoid rate limiting
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchResults = await processBatch(batch);

    // Merge batch results
    Object.assign(result, batchResults);
  }

  return result;
}
