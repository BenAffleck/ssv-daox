/**
 * Read-only JSON-RPC proxy for the browser wallet stack
 * POST /api/rpc
 *
 * Keeps MAINNET_RPC_URL server-side and forwards only allowlisted read methods.
 * Wallets broadcast transactions themselves.
 */

import { NextResponse } from 'next/server';

import { getMainnetRpcUrl } from '@/lib/wallet/config';
import { proxyRpc, rpcError, type RpcProxyResponse } from '@/lib/wallet/rpc-proxy';

function toResponse({ status, body }: RpcProxyResponse) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const rpcUrl = getMainnetRpcUrl();
  if (!rpcUrl) {
    return toResponse(rpcError(503, null, -32603, 'RPC is not configured'));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return toResponse(rpcError(400, null, -32700, 'Parse error'));
  }

  return toResponse(await proxyRpc(body, { rpcUrl, fetch }));
}
