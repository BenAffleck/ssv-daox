/**
 * Issues a single-use opt-out nonce for an address
 * POST /api/opt-out/nonce  { address, action }
 */

import { getOptOutHttp } from '@/lib/delegation/opt-out/server';

export function POST(request: Request) {
  return getOptOutHttp().issueNonce(request);
}
