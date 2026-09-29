import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { getMainnetRpcUrl } from '@/lib/wallet/config';

/**
 * - `resolved`: the name points at `address`.
 * - `not_found`: the name has no address record.
 * - `unavailable`: `MAINNET_RPC_URL` is unset or the RPC call failed.
 */
export type EnsResolution =
  { status: 'resolved'; address: string } | { status: 'not_found' } | { status: 'unavailable' };

/** Resolves a normalized ENS name on mainnet. */
export async function resolveEnsName(name: string): Promise<EnsResolution> {
  const rpcUrl = getMainnetRpcUrl();
  if (!rpcUrl) {
    // viem's http('') would fall back to a public RPC.
    return { status: 'unavailable' };
  }
  try {
    const client = createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
    const address = await client.getEnsAddress({ name });
    return address ? { status: 'resolved', address } : { status: 'not_found' };
  } catch (error) {
    // The error can carry the upstream URL, which holds the RPC key.
    console.error('ENS lookup failed:', error instanceof Error ? error.name : 'unknown error');
    return { status: 'unavailable' };
  }
}
