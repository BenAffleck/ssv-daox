import { NextResponse } from 'next/server';
import { GNOSIS_CONFIG } from '@/lib/gnosis/config';
import type { GnosisDelegationResponse, VotingPowerData } from '@/lib/gnosis/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
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
        { status: response.status }
      );
    }

    const data: GnosisDelegationResponse = await response.json();

    const votingPowerData: VotingPowerData = {
      votingPower: parseFloat(data.votingPower) || 0,
      incomingPower: parseFloat(data.incomingPower) || 0,
      outgoingPower: parseFloat(data.outgoingPower) || 0,
      delegatorCount: data.delegators?.length || 0,
      delegators: data.delegators || [],
      percentOfVotingPower: parseFloat(data.percentOfVotingPower) || 0,
      blockNumber: data.blockNumber,
    };

    return NextResponse.json(votingPowerData);
  } catch (error) {
    console.error(`[Voting Power API] Error fetching for ${address}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch voting power' },
      { status: 500 }
    );
  }
}
