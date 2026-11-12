'use client';

import { useAccountEffect } from 'wagmi';

import { trackEvent } from '@/lib/telemetry/events';

/** Records fresh wallet connections; restored sessions are not new connections. */
export default function WalletConnectTracker() {
  useAccountEffect({
    onConnect({ connector, isReconnected }) {
      if (!isReconnected) {
        trackEvent('wallet_connected', { connector: connector.name });
      }
    },
  });
  return null;
}
