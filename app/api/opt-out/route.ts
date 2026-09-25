/**
 * Submits a signed opt-out or opt-in request
 * POST /api/opt-out  { typedData, signature }
 */

import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/delegation/opt-out/http';
import { parseSubmission } from '@/lib/delegation/opt-out/schema';
import { getOptOutService } from '@/lib/delegation/opt-out/server';
import type { OptOutErrorCode } from '@/lib/delegation/opt-out/service';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

const HTTP_STATUS: Record<OptOutErrorCode, number> = {
  unknown_nonce: 400,
  nonce_mismatch: 400,
  nonce_expired: 400,
  nonce_address_mismatch: 400,
  nonce_used: 409,
  invalid_signature: 401,
  score_api_unavailable: 502,
};

export async function POST(request: Request) {
  if (!getMainnetRpcUrl()) {
    return errorResponse(503, 'rpc_unconfigured', 'Signature checks need MAINNET_RPC_URL.');
  }
  const submission = parseSubmission(await request.json().catch(() => null));
  if (!submission) {
    return errorResponse(400, 'invalid_request', 'The request is malformed.');
  }

  const result = await getOptOutService().submitOptOut(submission);
  return result.ok
    ? NextResponse.json(result.receipt)
    : errorResponse(HTTP_STATUS[result.error.code], result.error.code, result.error.message);
}
