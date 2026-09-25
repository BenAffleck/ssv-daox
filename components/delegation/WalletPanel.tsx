'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import { accountSwitchPrompt, isAddress } from '@/lib/delegation/logic/address-overview';

interface WalletPanelProps {
  /** The `?address=` value; may be empty or invalid. */
  selectedAddress: string;
  /** The selected address and its identity siblings. */
  identityAddresses: string[];
}

/**
 * Connect button that drives the overview. Connecting opens the account unless
 * `?address=` already selects one; an account switch in the wallet always does.
 */
export default function WalletPanel({ selectedAddress, identityAddresses }: WalletPanelProps) {
  const router = useRouter();
  const { address } = useAccount();
  const previousAddress = useRef(address);

  const selectAccount = useCallback(
    (account: string) => {
      if (account.toLowerCase() !== selectedAddress.toLowerCase()) {
        router.replace(`/delegation?address=${account}`);
      }
    },
    [router, selectedAddress],
  );

  useEffect(() => {
    const previous = previousAddress.current;
    previousAddress.current = address;
    if (address && (!isAddress(selectedAddress) || (previous && previous !== address))) {
      selectAccount(address);
    }
  }, [address, selectedAddress, selectAccount]);

  const prompt = isAddress(selectedAddress)
    ? accountSwitchPrompt(selectedAddress, address, identityAddresses)
    : null;

  return (
    <div className="mt-6 space-y-4">
      <ConnectButton showBalance={false} chainStatus="icon" />
      {prompt && address && (
        <div role="status" className="rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="text-[13px] font-medium text-warning">Switch account to sign</p>
          <p className="mt-1 text-[13px] text-foreground">
            Your wallet is connected as <code className="font-mono text-xs">{address}</code>
            {prompt === 'sibling'
              ? ', a sibling of the selected address.'
              : ", which isn't in the selected address's identity."}{' '}
            Switch to <code className="font-mono text-xs">{selectedAddress}</code> in your wallet
            before signing for it.
          </p>
          {prompt === 'other' && (
            <Link
              href={`/delegation?address=${address}`}
              className="mt-2 inline-block text-[13px] text-primary hover:underline"
            >
              View your connected address instead
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
