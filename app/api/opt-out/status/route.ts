/**
 * Pending opt-out and opt-in requests for a batch of addresses
 * GET /api/opt-out/status?addresses=0x…,0x…
 */

import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { errorResponse } from '@/lib/delegation/opt-out/http';
import { getOptOutService } from '@/lib/delegation/opt-out/server';

const MAX_ADDRESSES = 1000;

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('addresses') ?? '';
  const addresses = param.split(',').filter(Boolean);
  if (
    addresses.length > MAX_ADDRESSES ||
    !addresses.every((a) => isAddress(a, { strict: false }))
  ) {
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
