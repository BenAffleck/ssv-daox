import { NextResponse } from 'next/server';

import { GNOSIS_CONFIG } from '@/lib/gnosis/config';
import { toVotingPowerData } from '@/lib/gnosis/logic/transform-voting-power';
import type { GnosisDelegationResponse, VotingPowerData } from '@/lib/gnosis/types';

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const url = `${GNOSIS_CONFIG.apiBaseUrl}/${GNOSIS_CONFIG.spaceId}/pin/${address}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GNOSIS_CONFIG.strategyPayload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gnosis API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data: GnosisDelegationResponse = await response.json();

    const votingPowerData: VotingPowerData = toVotingPowerData(data);

    return NextResponse.json(votingPowerData);
  } catch (error) {
    console.error(`[Voting Power API] Error fetching for ${address}:`, error);
    return NextResponse.json({ error: 'Failed to fetch voting power' }, { status: 500 });
  }
}
