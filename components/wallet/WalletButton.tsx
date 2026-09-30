'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { useDisconnect } from 'wagmi';

import AccountMenu from './AccountMenu';
import { useWalletSession } from './useWalletSession';

const BASE =
  'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors';

/** Connect, account and wrong-network states of the connected wallet. */
export default function WalletButton() {
  const session = useWalletSession();
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal }) => {
        if (session.phase === 'loading') {
          return (
            <span
              aria-hidden
              className={`${BASE} w-24 animate-pulse border border-border bg-card`}
            />
          );
        }
        if (session.phase === 'disconnected' || !account) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={`${BASE} bg-primary text-white shadow-glow hover:bg-primary/90`}
            >
              <Wallet size={14} />
              Connect<span className="hidden sm:inline"> wallet</span>
            </button>
          );
        }
        if (chain?.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`${BASE} border border-danger/40 bg-danger/10 text-danger`}
            >
              Wrong network
            </button>
          );
        }
        return (
          <AccountMenu
            address={account.address}
            displayName={account.displayName}
            ensAvatar={account.ensAvatar}
            onDisconnect={() => disconnect()}
          />
        );
      }}
    </ConnectButton.Custom>
  );
}
