/**
 * Issues a single-use opt-out nonce for an address
 * POST /api/opt-out/nonce  { address }
 */

import { NextResponse } from 'next/server';

import { NonceStoreFullError } from '@/lib/delegation/opt-out/file-nonce-store';
import { errorResponse } from '@/lib/delegation/opt-out/http';
import { nonceRequestSchema } from '@/lib/delegation/opt-out/schema';
import { getOptOutService } from '@/lib/delegation/opt-out/server';

export async function POST(request: Request) {
  const parsed = nonceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(400, 'invalid_request', 'The address is not an Ethereum address.');
  }
  try {
    return NextResponse.json(await getOptOutService().issueNonce(parsed.data.address));
  } catch (error) {
    if (error instanceof NonceStoreFullError) {
      return errorResponse(429, 'too_many_requests', error.message);
    }
    throw error;
  }
}
