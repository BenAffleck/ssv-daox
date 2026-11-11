/**
 * Looks up the finished signature of a Safe opt-out or opt-in request
 * GET /api/opt-out/safe-signature?nonce=…
 */

import { getOptOutHttp } from '@/lib/delegation/opt-out/server';

export function GET(request: Request) {
  return getOptOutHttp().safeSignature(request);
}
