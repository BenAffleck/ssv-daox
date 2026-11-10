import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { fetchPin } from '@/lib/delegation/api/fetch-pin';
import { pinTag } from '@/lib/gnosis';

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  // Shares the leaderboard's cached pin requests, so a prefetched address costs no Gnosis call.
  // `?fresh=1` skips that cache for the connected wallet, whose delegation may have just changed.
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  const votingPowerData = await fetchPin(address, { fresh });
  if (!votingPowerData) {
    return NextResponse.json({ error: 'Failed to fetch voting power' }, { status: 502 });
  }
  // The fresh value isn't cached, so the entry is expired for the page this response links to.
  if (fresh) {
    revalidateTag(pinTag(address), { expire: 0 });
  }
  return NextResponse.json(votingPowerData);
}
