/**
 * The latest opt-out or opt-in request of each address in a batch
 * GET /api/opt-out/status?addresses=0x…,0x…
 */

import { getOptOutHttp } from '@/lib/delegation/opt-out/server';

export function GET(request: Request) {
  return getOptOutHttp().statuses(request);
}
