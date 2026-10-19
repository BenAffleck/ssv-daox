'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { formatAddress } from '@/lib/dao-delegates/utils/address';
import { accountSwitchPrompt, isAddress } from '@/lib/delegation/logic/address-overview';
import {
  delegationUrlOnWalletChange,
  type SettledWallet,
} from '@/lib/delegation/logic/wallet-navigation';

import OpenOwnAddressLink from './OpenOwnAddressLink';

interface WalletPanelProps {
  /** The `?address=` value; may be empty or invalid. */
  selectedAddress: string;
  /** The selected address and its identity siblings. */
  identityAddresses: string[];
}

function Address({ value }: { value: string }) {
  return (
    <code className="font-mono text-xs text-foreground" title={value}>
      {formatAddress(value)}
    </code>
  );
}

/**
 * Moves the page with the wallet (connect, account switch, disconnect) and
 * says when the connected wallet can't manage the viewed address.
 */
export default function WalletPanel({ selectedAddress, identityAddresses }: WalletPanelProps) {
  const router = useRouter();
  const session = useWalletSession();
  const previous = useRef<SettledWallet | null>(null);

  useEffect(() => {
    if (session.phase === 'loading') {
      return;
    }
    const current: SettledWallet =
      session.phase === 'connected'
        ? { phase: 'connected', address: session.address }
        : { phase: 'disconnected' };
    const url = delegationUrlOnWalletChange(previous.current, current, selectedAddress);
    previous.current = current;
    if (url) {
      router.replace(url);
    }
  }, [session.phase, session.address, selectedAddress, router]);

  if (session.phase !== 'connected') {
    return null;
  }
  const connected = session.address;

  const prompt = isAddress(selectedAddress)
    ? accountSwitchPrompt(selectedAddress, connected, identityAddresses)
    : 'other';
  if (prompt === 'other') {
    return (
      <div className="mt-4">
        <OpenOwnAddressLink address={connected} />
      </div>
    );
  }
  if (prompt === 'sibling') {
    return (
      <p role="status" className="mt-4 text-[13px] text-muted">
        Switch your wallet to <Address value={selectedAddress} /> to manage it.
      </p>
    );
  }
  return null;
}
