import { unstable_cache } from 'next/cache';
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

/** Primary names change rarely, and the lookup sits on the Delegation page's critical path. */
const REVERSE_ENS_CACHE_SECONDS = 3600;

// A failed lookup throws, so it isn't cached. The RPC URL holds a key, so it stays out of the cache key.
const cachedReverseEnsName = unstable_cache(
  async (address: string) => {
    const client = createPublicClient({ chain: mainnet, transport: http(getMainnetRpcUrl()) });
    return client.getEnsName({ address: address as `0x${string}` });
  },
  ['reverse-ens-name'],
  { revalidate: REVERSE_ENS_CACHE_SECONDS },
);

/** The primary ENS name of `address` on mainnet, or `null` when it has none or the lookup fails. */
export async function reverseEnsName(address: string): Promise<string | null> {
  if (!getMainnetRpcUrl()) {
    return null;
  }
  try {
    return await cachedReverseEnsName(address.toLowerCase());
  } catch (error) {
    console.error(
      'ENS reverse lookup failed:',
      error instanceof Error ? error.name : 'unknown error',
    );
    return null;
  }
}
