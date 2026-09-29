'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { formatAddress } from '@/lib/dao-delegates/utils/address';
import { accountSwitchPrompt, isAddress } from '@/lib/delegation/logic/address-overview';
import {
  delegationUrlOnWalletChange,
  type SettledWallet,
} from '@/lib/delegation/logic/wallet-navigation';

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

  if (!isAddress(selectedAddress)) {
    return (
      <div className="mt-6">
        <Link
          href={`/delegation?address=${connected}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary/90"
        >
          Open your address <span className="font-mono text-xs">{formatAddress(connected)}</span>
        </Link>
      </div>
    );
  }

  const prompt = accountSwitchPrompt(selectedAddress, connected, identityAddresses);
  if (!prompt) {
    return null;
  }
  return (
    <p role="status" className="mt-4 text-[13px] text-muted">
      <span className="badge-sm-warning mr-2">Read-only</span>
      {prompt === 'sibling' ? (
        <>
          Switch your wallet to <Address value={selectedAddress} /> to manage it.
        </>
      ) : (
        <>
          You&apos;re connected as <Address value={connected} />.{' '}
          <Link href={`/delegation?address=${connected}`} className="text-primary hover:underline">
            Open your address
          </Link>
        </>
      )}
    </p>
  );
}
