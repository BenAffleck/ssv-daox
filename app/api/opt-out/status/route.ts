/**
 * The latest opt-out or opt-in request of each address in a batch
 * GET /api/opt-out/status?addresses=0x…,0x…
 */

import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { errorResponse } from '@/lib/delegation/opt-out/http';
import { MAX_STATUS_ADDRESSES } from '@/lib/delegation/opt-out/score-api';
import { getOptOutService } from '@/lib/delegation/opt-out/server';

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('addresses') ?? '';
  const addresses = param.split(',').filter(Boolean);
  if (addresses.length > MAX_STATUS_ADDRESSES) {
    return errorResponse(
      400,
      'invalid_request',
      `At most ${MAX_STATUS_ADDRESSES} addresses per request.`,
    );
  }
  if (!addresses.every((a) => isAddress(a, { strict: false }))) {
    return errorResponse(400, 'invalid_request', 'The addresses are not Ethereum addresses.');
  }
  try {
    const service = getOptOutService();
    return NextResponse.json({ statuses: await service.getStatuses(addresses) });
  } catch (error) {
    console.error('Opt-out status lookup failed:', error);
    return errorResponse(502, 'score_api_unavailable', 'The Score API is unavailable.');
  }
}
