/**
 * Looks up the finished signature of a Safe opt-out or opt-in request
 * GET /api/opt-out/safe-signature?nonce=…
 */

import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/delegation/opt-out/http';
import { safeSignatureQuerySchema } from '@/lib/delegation/opt-out/schema';
import { getOptOutService } from '@/lib/delegation/opt-out/server';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

export async function GET(request: Request) {
  if (!getMainnetRpcUrl()) {
    return errorResponse(503, 'rpc_unconfigured', 'Signature checks need MAINNET_RPC_URL.');
  }
  const parsed = safeSignatureQuerySchema.safeParse({
    nonce: new URL(request.url).searchParams.get('nonce'),
  });
  if (!parsed.success) {
    return errorResponse(400, 'invalid_request', 'The request needs a nonce.');
  }

  const result = await getOptOutService().findSafeSignature(parsed.data.nonce);
  if (!result.ok) {
    return errorResponse(result.error.httpStatus, result.error.code, result.error.message);
  }
  return NextResponse.json(
    result.status === 'signed'
      ? { status: 'signed', submission: result.submission }
      : { status: 'awaiting', confirmations: result.confirmations, threshold: result.threshold },
  );
}
