'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';

import { useWalletSession } from '@/components/wallet/useWalletSession';

export const PRIMARY_BUTTON =
  'rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50';

/** Opens the connect modal; renders nothing unless the wallet is disconnected. */
export default function ConnectToDelegateButton() {
  const session = useWalletSession();
  const { openConnectModal } = useConnectModal();
  if (session.phase !== 'disconnected') {
    return null;
  }
  return (
    <button type="button" onClick={openConnectModal} className={PRIMARY_BUTTON}>
      Connect wallet to delegate
    </button>
  );
}
