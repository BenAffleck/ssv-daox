/**
 * Submits a signed opt-out or opt-in request
 * POST /api/opt-out  { typedData, signature }
 */

import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/delegation/opt-out/http';
import { parseSubmission } from '@/lib/delegation/opt-out/schema';
import { getOptOutService } from '@/lib/delegation/opt-out/server';
import { getMainnetRpcUrl } from '@/lib/wallet/config';

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
    : errorResponse(result.error.httpStatus, result.error.code, result.error.message);
}
