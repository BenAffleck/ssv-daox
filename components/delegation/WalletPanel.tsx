'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import { formatAddress } from '@/lib/dao-delegates/utils/address';
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

  // The connect button already shows the connected address, so the prompt names only the viewed one.
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <ConnectButton showBalance={false} chainStatus="icon" />
      {prompt && address && (
        <p role="status" className="text-[13px] text-muted">
          <span className="font-medium text-warning">Switch account to sign</span> for{' '}
          <code className="font-mono text-xs text-foreground" title={selectedAddress}>
            {formatAddress(selectedAddress)}
          </code>
          {prompt === 'sibling' && ', a sibling of your connected wallet'}.
          {prompt === 'other' && (
            <>
              {' '}
              <Link
                href={`/delegation?address=${address}`}
                className="text-primary hover:underline"
              >
                View your connected address
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
