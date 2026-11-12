'use client';

import { useRouter } from 'next/navigation';

import { useConnectAttempt } from '@/components/wallet/useConnectAttempt';
import { sameAddress } from '@/lib/delegation/logic/pool';
import { trackEvent } from '@/lib/telemetry/events';

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
  const connect = useConnectAttempt((connected) => {
    if (connected === null) {
      trackEvent('connect_modal_closed', { placement: 'panel' });
    } else if (!sameAddress(connected, viewed)) {
      router.push(ownDelegateToDaoUrl(connected));
    }
  });

  return () => {
    trackEvent('delegate_cta_clicked', { placement: 'panel', step: 'connect' });
    connect();
  };
}
