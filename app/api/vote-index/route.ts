/**
 * API route serving the searchable vote index for the global Ctrl+K palette
 * GET /api/vote-index
 *
 * Response: { votes: VoteIndexEntry[], failedSpaces: string[] }
 *
 * The palette lives in the client-side Header, which can't receive
 * server-fetched proposals as props. Fetching them lazily here — rather than
 * awaiting the aggregator in the root layout — keeps a 15-request cache miss
 * off the critical path of every page in the app.
 */

import { NextResponse } from 'next/server';

import { toVoteIndexEntry, type VoteIndexEntry } from '@/lib/dao-governance/vote-search';
import { fetchGovernanceProposals } from '@/lib/snapshot/api/fetch-governance-proposals';

export interface VoteIndexResponse {
  votes: VoteIndexEntry[];
  failedSpaces: string[];
}

export async function GET(): Promise<NextResponse<VoteIndexResponse>> {
  try {
    const { proposals, failedSpaces } = await fetchGovernanceProposals();
    return NextResponse.json({
      votes: proposals.map(toVoteIndexEntry),
      failedSpaces,
    });
  } catch (error) {
    console.error('Failed to build vote index:', error);
    // The palette degrades to modules + tools rather than breaking.
    return NextResponse.json({ votes: [], failedSpaces: [] }, { status: 500 });
  }
}
