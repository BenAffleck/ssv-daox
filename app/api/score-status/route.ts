import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import {
  fetchCachedRunId,
  fetchScoreStatus,
  SCORE_DATA_TAG,
} from '@/lib/dao-delegates/api/fetch-leaderboard';

export async function GET() {
  try {
    const status = await fetchScoreStatus();
    // A new run expires the cached run reads, so the page's refresh reads it.
    if (status.latest && status.latest.run_id !== (await fetchCachedRunId())) {
      revalidateTag(SCORE_DATA_TAG, { expire: 0 });
    }
    return NextResponse.json(status);
  } catch (error) {
    console.error('[Delegate Score API] Status check failed:', error);
    return NextResponse.json({ error: 'Failed to fetch score status' }, { status: 502 });
  }
}
