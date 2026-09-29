'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { autoDelegationView, formatPower } from '@/lib/delegation/logic/auto-delegation';
import type { VotingPowerData } from '@/lib/gnosis/types';

/** Power the pool would receive from `address`; `null` when it can't delegate to the pool now. */
function delegatablePower(address: string, pin: VotingPowerData, poolAddress: string) {
  const { breakdown, state } = autoDelegationView({
    address,
    connected: address,
    pin,
    poolAddress,
    optOut: null,
  });
  if (state.kind !== 'ready' || !breakdown) {
    return null;
  }
  return breakdown.ownPower + (state.movesAlong?.power ?? 0);
}

/** The pool banner's link; names the connected wallet's power when it can delegate. */
export default function PoolBannerAction({ poolAddress }: { poolAddress: string }) {
  const session = useWalletSession();
  const [pin, setPin] = useState<{ address: string; data: VotingPowerData } | null>(null);

  useEffect(() => {
    if (session.phase !== 'connected') {
      return;
    }
    const address = session.address;
    const controller = new AbortController();
    fetch(`/api/voting-power/${address}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: VotingPowerData | null) => data && setPin({ address, data }))
      .catch(() => {});
    return () => controller.abort();
  }, [session.phase, session.address]);

  const address = session.phase === 'connected' ? session.address : undefined;
  const power =
    address && pin && pin.address === address
      ? delegatablePower(address, pin.data, poolAddress)
      : null;
  const shown = power !== null && Math.round(power) > 0;

  return (
    <Link
      href={shown ? `/delegation?address=${address}` : '/delegation'}
      className="inline-block shrink-0 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:self-auto"
    >
      {shown ? (
        <>
          Delegate your <span className="text-accent tabular-nums">{formatPower(power)}</span>{' '}
          voting power to the DAO →
        </>
      ) : (
        'Delegate your voting power to the DAO →'
      )}
    </Link>
  );
}
