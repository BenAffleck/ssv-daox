/**
 * Submits a signed opt-out or opt-in request
 * POST /api/opt-out  { typedData, signature }
 */

import { getOptOutHttp } from '@/lib/delegation/opt-out/server';

export function POST(request: Request) {
  return getOptOutHttp().submit(request);
}
