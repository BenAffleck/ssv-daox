'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { sameAddress } from '@/lib/delegation/logic/pool';

import { DELEGATE_TO_DAO_ANCHOR } from './DelegateToDaoPanel';

/** The wallet's own "Delegate to the DAO" panel. */
export function ownDelegateToDaoUrl(address: string): string {
  return `/delegation?address=${address}#${DELEGATE_TO_DAO_ANCHOR}`;
}

/**
 * Opens the connect modal to delegate the wallet's own power. Once connected,
 * a wallet other than `viewed` goes to its own address. Dismissing the modal
 * cancels that.
 */
export function useConnectToDelegate(viewed: string): () => void {
  const router = useRouter();
  const session = useWalletSession();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const pending = useRef(false);
  const modalWasOpen = useRef(false);

  useEffect(() => {
    if (!pending.current) {
      return;
    }
    if (session.phase === 'connected') {
      pending.current = false;
      if (!sameAddress(session.address, viewed)) {
        router.push(ownDelegateToDaoUrl(session.address));
      }
    } else if (session.phase === 'disconnected' && modalWasOpen.current && !connectModalOpen) {
      pending.current = false;
    }
    modalWasOpen.current = connectModalOpen;
  }, [session.phase, session.address, connectModalOpen, viewed, router]);

  return () => {
    pending.current = true;
    modalWasOpen.current = false;
    openConnectModal?.();
  };
}
