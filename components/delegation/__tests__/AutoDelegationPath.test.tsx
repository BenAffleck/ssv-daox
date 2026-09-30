import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';
import type { VotingPowerData } from '@/lib/gnosis/types';

import AutoDelegationPath from '../AutoDelegationPath';

const VIEWED = '0x1111111111111111111111111111111111111111';
const SIBLING = '0x2222222222222222222222222222222222222222';
const STRANGER = '0x3333333333333333333333333333333333333333';
const POOL = '0xb35096b074fdb9bBac63E3AdaE0Bbde512B2E6b6';

let session: WalletSession = { phase: 'disconnected', address: undefined };
vi.mock('@/components/wallet/useWalletSession', () => ({ useWalletSession: () => session }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

let connectModalOpen = false;
const openConnectModal = vi.fn(() => {
  connectModalOpen = true;
});
vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal, connectModalOpen }),
}));

// The write hooks need the wagmi provider; this panel only shows them in the `ready` state.
vi.mock('../DelegationTransaction', () => ({
  useDelegationWrite: () => ({ send: vi.fn(), submission: null, awaitingWallet: false }),
  useSubmissionPhase: () => 'idle',
  isSubmissionLocked: () => false,
  DropConfirmation: () => null,
  SubmissionStatus: () => null,
}));

const PIN: VotingPowerData = {
  votingPower: 1000,
  incomingPower: 0,
  outgoingPower: 0,
  delegatorCount: 0,
  delegators: [],
  incomingDelegations: [],
  outgoingDelegations: [],
  percentOfVotingPower: 0,
  blockNumber: '1',
};

const PROPS = {
  address: VIEWED,
  identityAddresses: [VIEWED, SIBLING],
  pin: PIN,
  poolAddress: POOL,
  optOut: null,
  optOutStepAvailable: true,
};

function renderPath() {
  return render(<AutoDelegationPath {...PROPS} />);
}

describe('AutoDelegationPath on another address', () => {
  beforeEach(() => {
    session = { phase: 'disconnected', address: undefined };
    connectModalOpen = false;
    vi.clearAllMocks();
  });

  it('opens the connected wallet after connecting from its button', async () => {
    const { rerender } = renderPath();
    await userEvent.click(screen.getByRole('button', { name: 'Connect wallet to delegate' }));
    expect(openConnectModal).toHaveBeenCalledOnce();

    session = { phase: 'loading', address: undefined };
    connectModalOpen = false;
    rerender(<AutoDelegationPath {...PROPS} />);
    session = { phase: 'connected', address: STRANGER };
    rerender(<AutoDelegationPath {...PROPS} />);

    expect(push).toHaveBeenCalledWith(`/delegation?address=${STRANGER}#delegate-to-dao`);
  });

  it('stays when the connected wallet is the viewed address', async () => {
    const { rerender } = renderPath();
    await userEvent.click(screen.getByRole('button', { name: 'Connect wallet to delegate' }));

    session = { phase: 'connected', address: VIEWED };
    connectModalOpen = false;
    rerender(<AutoDelegationPath {...PROPS} />);

    expect(push).not.toHaveBeenCalled();
  });

  it('does not navigate on a later connect after the modal was dismissed', async () => {
    const { rerender } = renderPath();
    await userEvent.click(screen.getByRole('button', { name: 'Connect wallet to delegate' }));
    rerender(<AutoDelegationPath {...PROPS} />);

    connectModalOpen = false;
    rerender(<AutoDelegationPath {...PROPS} />);
    session = { phase: 'connected', address: STRANGER };
    rerender(<AutoDelegationPath {...PROPS} />);

    expect(push).not.toHaveBeenCalled();
  });

  it('links a wallet outside the identity to its own address instead of asking to switch', () => {
    session = { phase: 'connected', address: STRANGER };
    renderPath();

    expect(screen.queryByText(/Switch your wallet/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to your address' })).toHaveAttribute(
      'href',
      `/delegation?address=${STRANGER}#delegate-to-dao`,
    );
  });

  it('asks a sibling wallet of the same identity to switch', () => {
    session = { phase: 'connected', address: SIBLING };
    renderPath();

    expect(screen.getByText(/Switch your wallet to/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to your address' })).not.toBeInTheDocument();
  });
});
