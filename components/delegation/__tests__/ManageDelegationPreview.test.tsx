import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletSession } from '@/components/wallet/useWalletSession';

import ManageDelegationPreview from '../ManageDelegationPreview';

let session: WalletSession = { phase: 'disconnected', address: undefined };
vi.mock('@/components/wallet/useWalletSession', () => ({ useWalletSession: () => session }));

describe('ManageDelegationPreview', () => {
  beforeEach(() => {
    session = { phase: 'disconnected', address: undefined };
  });

  it('shows the owner steps disabled and asks to connect a wallet in text only', () => {
    render(<ManageDelegationPreview />);

    expect(screen.getByText('Connect wallet to manage this address.')).toBeInTheDocument();
    for (const title of ['Claim on HighSignal', 'Opt out of delegation', 'Delegate voting power']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
  });

  it('tells a wallet connected as another address to connect as this one', () => {
    session = { phase: 'connected', address: '0x1111111111111111111111111111111111111111' };
    render(<ManageDelegationPreview />);

    expect(screen.getByText('Connect as this address to manage it.')).toBeInTheDocument();
  });

  it('shows nothing while the wallet session restores', () => {
    session = { phase: 'loading', address: undefined };
    const { container } = render(<ManageDelegationPreview />);

    expect(container).toBeEmptyDOMElement();
  });
});
