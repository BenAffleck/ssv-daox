'use client';

import { createContext, useContext } from 'react';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

/** `true` once wagmi has tried to restore the last session. */
export const WalletRestoredContext = createContext(false);

export type WalletSession =
  | { phase: 'loading'; address: undefined }
  | { phase: 'disconnected'; address: undefined }
  | { phase: 'connected'; address: Address };

/**
 * The wallet's state for rendering. `loading` covers session restore and a
 * connect in progress, so the UI never flashes a connect prompt at a returning user.
 */
export function useWalletSession(): WalletSession {
  const restored = useContext(WalletRestoredContext);
  const { address, status } = useAccount();
  if (status === 'connected' && address) {
    return { phase: 'connected', address };
  }
  if (!restored || status === 'connecting' || status === 'reconnecting') {
    return { phase: 'loading', address: undefined };
  }
  return { phase: 'disconnected', address: undefined };
}
