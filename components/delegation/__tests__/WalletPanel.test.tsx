import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';

import WalletPanel from '../WalletPanel';

const WALLET = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const SIBLING = '0x3333333333333333333333333333333333333333';

let session: WalletSession = { phase: 'connected', address: WALLET };
vi.mock('@/components/wallet/useWalletSession', () => ({ useWalletSession: () => session }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const OPEN = { name: /^Open your address/ };

describe('WalletPanel', () => {
  beforeEach(() => {
    session = { phase: 'connected', address: WALLET };
  });

  it('offers the connected address when none is selected', () => {
    render(<WalletPanel selectedAddress="" identityAddresses={[]} />);

    expect(screen.getByRole('link', OPEN)).toHaveAttribute('href', `/delegation?address=${WALLET}`);
  });

  it("offers the connected address on another address's profile", () => {
    render(<WalletPanel selectedAddress={OTHER} identityAddresses={[OTHER]} />);

    expect(screen.getByRole('link', OPEN)).toHaveAttribute('href', `/delegation?address=${WALLET}`);
  });

  it('asks a sibling wallet to switch instead of offering a link', () => {
    render(<WalletPanel selectedAddress={OTHER} identityAddresses={[OTHER, WALLET]} />);

    expect(screen.getByText(/Switch your wallet to/)).toBeInTheDocument();
    expect(screen.queryByRole('link', OPEN)).not.toBeInTheDocument();
  });

  it('offers nothing on the connected wallet’s own address', () => {
    render(<WalletPanel selectedAddress={WALLET} identityAddresses={[WALLET, SIBLING]} />);

    expect(screen.queryByRole('link', OPEN)).not.toBeInTheDocument();
  });
});
