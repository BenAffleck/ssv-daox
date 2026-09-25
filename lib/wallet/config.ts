/**
 * Server-only mainnet RPC URL. It holds the provider key, so it has no
 * `NEXT_PUBLIC_` prefix and the browser reaches it only through `/api/rpc`.
 * Returns an empty string when unset; there is no public fallback.
 */
export function getMainnetRpcUrl(): string {
  return (process.env.MAINNET_RPC_URL || '').trim();
}

/** Same-origin path of the read-only RPC proxy used by the client transport. */
export const RPC_PROXY_PATH = '/api/rpc';
