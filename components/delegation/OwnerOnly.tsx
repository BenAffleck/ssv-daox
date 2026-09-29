'use client';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { sameAddress } from '@/lib/delegation/logic/pool';

/** `true` while the connected wallet is `address`. */
export function useIsOwner(address: string): boolean {
  const session = useWalletSession();
  return session.phase === 'connected' && sameAddress(session.address, address);
}

/** Renders its children only for the wallet that owns `address`. */
export default function OwnerOnly({
  address,
  children,
}: {
  address: string;
  children: React.ReactNode;
}) {
  return useIsOwner(address) ? children : null;
}
