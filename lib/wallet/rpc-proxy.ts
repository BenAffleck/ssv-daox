/**
 * Read-only JSON-RPC methods the browser may call through the DAOx proxy.
 * Wallets broadcast transactions themselves, so no write or signing method is listed.
 */
export const ALLOWED_RPC_METHODS: ReadonlySet<string> = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'net_version',
]);

type JsonRpcId = string | number | null;

export interface RpcProxyResponse {
  status: number;
  body: unknown;
}

export interface RpcProxyDeps {
  rpcUrl: string;
  fetch: typeof fetch;
}

export function rpcError(
  status: number,
  id: JsonRpcId,
  code: number,
  message: string,
): RpcProxyResponse {
  return { status, body: { jsonrpc: '2.0', id, error: { code, message } } };
}

function idOf(request: Record<string, unknown>): JsonRpcId {
  const { id } = request;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

/**
 * Forwards a single JSON-RPC request to `rpcUrl` if its method is allowlisted.
 * Batches are rejected: the client transport never sends them.
 */
export async function proxyRpc(request: unknown, deps: RpcProxyDeps): Promise<RpcProxyResponse> {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) {
    return rpcError(400, null, -32600, 'Invalid request');
  }
  const body = request as Record<string, unknown>;
  const id = idOf(body);
  if (typeof body.method !== 'string') {
    return rpcError(400, id, -32600, 'Invalid request');
  }
  if (!ALLOWED_RPC_METHODS.has(body.method)) {
    return rpcError(403, id, -32601, `Method ${body.method} is not allowed`);
  }

  try {
    const response = await deps.fetch(deps.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } catch (error) {
    // The error can carry the upstream URL, which holds the RPC key.
    console.error(
      'RPC proxy upstream request failed:',
      error instanceof Error ? error.name : error,
    );
    return rpcError(502, id, -32603, 'Upstream RPC unavailable');
  }
}
