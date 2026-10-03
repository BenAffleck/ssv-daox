import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';
import type { VotingPowerData } from '@/lib/gnosis/types';

import PoolBannerAction from '../PoolBannerAction';

const POOL = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';
const WALLET = '0x1111111111111111111111111111111111111111';

let session: WalletSession = { phase: 'disconnected', address: undefined };
vi.mock('@/components/wallet/useWalletSession', () => ({ useWalletSession: () => session }));

function pin(overrides: Partial<VotingPowerData> = {}): VotingPowerData {
  return {
    votingPower: 1234,
    incomingPower: 0,
    outgoingPower: 0,
    delegatorCount: 0,
    delegators: [],
    incomingDelegations: [],
    outgoingDelegations: [],
    percentOfVotingPower: 0,
    blockNumber: '1',
    ...overrides,
  };
}

function respondWith(data: VotingPowerData) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) }),
  );
}

describe('PoolBannerAction', () => {
  beforeEach(() => {
    session = { phase: 'disconnected', address: undefined };
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the generic call to action without a wallet', () => {
    render(<PoolBannerAction poolAddress={POOL} />);

    expect(
      screen.getByRole('link', { name: 'Delegate your voting power to the DAO →' }),
    ).toHaveAttribute('href', '/delegation');
  });

  it("names the connected wallet's power and links to its address", async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(pin());
    render(<PoolBannerAction poolAddress={POOL} />);

    const link = await screen.findByRole('link', {
      name: `Delegate your ${(1234).toLocaleString()} SSV voting power to the DAO →`,
    });
    expect(link).toHaveAttribute('href', `/delegation?address=${WALLET}`);
  });

  it('keeps the generic call to action when the wallet already delegates to the pool', async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(
      pin({
        votingPower: 0,
        outgoingPower: 1234,
        outgoingDelegations: [{ address: POOL, power: 1234 }],
      }),
    );
    render(<PoolBannerAction poolAddress={POOL} />);

    await act(async () => {});
    expect(fetch).toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Delegate your voting power to the DAO →' }),
    ).toBeInTheDocument();
  });
});
