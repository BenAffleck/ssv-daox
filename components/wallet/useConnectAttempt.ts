'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { useWalletSession } from './useWalletSession';

/**
 * Opens the connect modal and reports how the attempt ends: with the connected
 * address, or `null` once the modal closes without a wallet.
 */
export function useConnectAttempt(onSettled: (connected: string | null) => void): () => void {
  const session = useWalletSession();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const pending = useRef(false);
  const modalWasOpen = useRef(false);
  const settle = useEffectEvent(onSettled);

  useEffect(() => {
    if (!pending.current) {
      return;
    }
    if (session.phase === 'connected') {
      pending.current = false;
      settle(session.address);
    } else if (session.phase === 'disconnected' && modalWasOpen.current && !connectModalOpen) {
      pending.current = false;
      settle(null);
    }
    modalWasOpen.current = connectModalOpen;
  }, [session.phase, session.address, connectModalOpen]);

  return () => {
    pending.current = true;
    modalWasOpen.current = false;
    openConnectModal?.();
  };
}
