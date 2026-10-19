import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';
import type { VotingPowerData } from '@/lib/gnosis/types';

import AutoDelegationPath from '../AutoDelegationPath';

const VIEWED = '0x1111111111111111111111111111111111111111';
const SIBLING = '0x2222222222222222222222222222222222222222';
const STRANGER = '0x3333333333333333333333333333333333333333';
const POOL = '0x9a62c932F5a8Eb807F655E3D948EdaE174D39D3B';

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
    expect(screen.getByRole('link', { name: /^Open your address/ })).toHaveAttribute(
      'href',
      `/delegation?address=${STRANGER}#delegate-to-dao`,
    );
  });

  it('asks a sibling wallet of the same identity to switch', () => {
    session = { phase: 'connected', address: SIBLING };
    renderPath();

    expect(screen.getByText(/Switch your wallet to/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Open your address/ })).not.toBeInTheDocument();
  });
});

describe('AutoDelegationPath on an address the DAO delegates to', () => {
  const RECEIVING = {
    ...PROPS,
    pin: {
      ...PIN,
      incomingPower: 500,
      incomingDelegations: [{ address: POOL, power: 500 }],
    },
  };

  beforeEach(() => {
    session = { phase: 'disconnected', address: undefined };
    vi.clearAllMocks();
  });

  it('tells a visitor without a wallet how much the DAO delegates, without an action', () => {
    render(<AutoDelegationPath {...RECEIVING} />);

    expect(screen.getByRole('heading')).toHaveTextContent(
      `The DAO delegates ${(500).toLocaleString()} SSV to this address`,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('tells the owner how much the DAO delegates and offers to opt out', () => {
    session = { phase: 'connected', address: VIEWED };
    render(<AutoDelegationPath {...RECEIVING} />);

    expect(screen.getByRole('heading')).toHaveTextContent(
      `The DAO delegates ${(500).toLocaleString()} SSV to you`,
    );
    expect(screen.getByRole('button', { name: 'Opt out first' })).toBeInTheDocument();
  });

  it('tells a connected visitor the address cannot delegate back, without an action', () => {
    session = { phase: 'connected', address: STRANGER };
    render(<AutoDelegationPath {...RECEIVING} />);

    expect(screen.getByRole('heading')).toHaveTextContent('to this address');
    expect(screen.getByText("It can't delegate to the DAO in return.")).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
