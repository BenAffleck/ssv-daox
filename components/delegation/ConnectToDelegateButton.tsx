'use client';

import { useWalletSession } from '@/components/wallet/useWalletSession';

export const PRIMARY_BUTTON =
  'rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50';

/** Renders nothing unless the wallet is disconnected. */
export default function ConnectToDelegateButton({ onClick }: { onClick: () => void }) {
  const session = useWalletSession();
  if (session.phase !== 'disconnected') {
    return null;
  }
  return (
    <button type="button" onClick={onClick} className={PRIMARY_BUTTON}>
      Connect wallet to delegate
    </button>
  );
}
