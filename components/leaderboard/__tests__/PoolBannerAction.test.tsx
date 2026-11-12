import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { track } from '@vercel/analytics';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';
import type { VotingPowerData } from '@/lib/gnosis/types';

import PoolBannerAction from '../PoolBannerAction';

const POOL = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';
const WALLET = '0x1111111111111111111111111111111111111111';

let session: WalletSession = { phase: 'disconnected', address: undefined };
let connectModalOpen = false;
const openConnectModal = vi.fn(() => {
  connectModalOpen = true;
});
vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal, connectModalOpen }),
}));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
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
    connectModalOpen = false;
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers a visitor without a wallet a button that opens the connect modal', () => {
    render(<PoolBannerAction poolAddress={POOL} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'SSV or cSSV holder? Delegate to the DAO →' }),
    );

    expect(openConnectModal).toHaveBeenCalledOnce();
  });

  it('shows nothing while the wallet session is restoring', () => {
    session = { phase: 'loading', address: undefined };
    const { container } = render(<PoolBannerAction poolAddress={POOL} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("names the connected wallet's power and links to its address", async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(pin());
    render(<PoolBannerAction poolAddress={POOL} />);

    const link = await screen.findByRole('link', {
      name: `You Delegate your ${(1234).toLocaleString()} SSV voting power to the DAO →`,
    });
    expect(link).toHaveAttribute('href', `/delegation?via=leaderboard&address=${WALLET}`);
  });

  it('shows the power the wallet already delegates to the DAO and links to its profile', async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(
      pin({
        votingPower: 0,
        outgoingPower: 1234,
        outgoingDelegations: [{ address: POOL, power: 1234 }],
      }),
    );
    render(<PoolBannerAction poolAddress={POOL} />);

    const link = await screen.findByRole('link', { name: /You.*delegated to the DAO/ });
    expect(link).toHaveTextContent(`${(1234).toLocaleString()} SSV`);
    expect(link).toHaveAttribute('href', `/delegation?via=leaderboard&address=${WALLET}`);
    expect(screen.queryByText(/voting power to delegate/)).not.toBeInTheDocument();
  });

  it('disables the action when the wallet has no power at all', async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(pin({ votingPower: 0 }));
    render(<PoolBannerAction poolAddress={POOL} />);

    const button = await screen.findByRole('button', { name: /0 SSV voting power to delegate/ });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the power the DAO delegates to the wallet instead of zero', async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(
      pin({
        votingPower: 500,
        incomingPower: 500,
        incomingDelegations: [{ address: POOL, power: 500 }],
      }),
    );
    render(<PoolBannerAction poolAddress={POOL} />);

    const link = await screen.findByRole('link', {
      name: /You.*received from the DAO/,
    });
    expect(link).toHaveTextContent(`${(500).toLocaleString()} SSV`);
    expect(link).toHaveAttribute('href', `/delegation?via=leaderboard&address=${WALLET}`);
    expect(screen.queryByText(/voting power to delegate/)).not.toBeInTheDocument();
  });

  it('records a click on the connect button', () => {
    render(<PoolBannerAction poolAddress={POOL} />);

    fireEvent.click(screen.getByRole('button', { name: /Delegate to the DAO/ }));

    expect(track).toHaveBeenCalledWith('delegate_cta_clicked', {
      placement: 'banner',
      step: 'connect',
    });
  });

  it('records the connect modal closing without a wallet', () => {
    const { rerender } = render(<PoolBannerAction poolAddress={POOL} />);
    fireEvent.click(screen.getByRole('button', { name: /Delegate to the DAO/ }));
    rerender(<PoolBannerAction poolAddress={POOL} />);

    connectModalOpen = false;
    rerender(<PoolBannerAction poolAddress={POOL} />);

    expect(track).toHaveBeenCalledWith('connect_modal_closed', { placement: 'banner' });
  });

  it('records a click on the delegate link', async () => {
    session = { phase: 'connected', address: WALLET };
    respondWith(pin());
    render(<PoolBannerAction poolAddress={POOL} />);

    fireEvent.click(await screen.findByRole('link', { name: /Delegate your/ }));

    expect(track).toHaveBeenCalledWith('delegate_cta_clicked', {
      placement: 'banner',
      step: 'open',
    });
  });

  it.each([
    ['delegate', pin()],
    ['none', pin({ votingPower: 0 })],
  ] as const)('records the %s offer the wallet sees', async (offer, data) => {
    session = { phase: 'connected', address: WALLET };
    respondWith(data);
    render(<PoolBannerAction poolAddress={POOL} />);

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('delegate_offer_shown', { placement: 'banner', offer }),
    );
  });

  it("records an unavailable offer when the wallet's power can't be loaded", async () => {
    session = { phase: 'connected', address: WALLET };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { container } = render(<PoolBannerAction poolAddress={POOL} />);

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('delegate_offer_shown', {
        placement: 'banner',
        offer: 'unavailable',
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
