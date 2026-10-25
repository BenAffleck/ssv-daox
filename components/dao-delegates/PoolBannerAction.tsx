'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { autoDelegationView, formatPower } from '@/lib/delegation/logic/auto-delegation';
import type { VotingPowerData } from '@/lib/gnosis/types';

type Offer =
  | { kind: 'delegate'; power: number }
  /** The DAO delegates to the wallet, so it can't delegate back until it opts out. */
  | { kind: 'received'; power: number | null }
  /** The wallet already delegates everything to the DAO. */
  | { kind: 'delegated'; power: number }
  | { kind: 'none' };

function offerFor(address: string, pin: VotingPowerData, poolAddress: string): Offer {
  const { breakdown, state } = autoDelegationView({
    address,
    connected: address,
    pin,
    poolAddress,
    optOut: null,
  });
  if (state.kind === 'opt-out-required' || state.kind === 'awaiting-run') {
    return { kind: 'received', power: breakdown?.fromPool?.power ?? null };
  }
  if (state.kind === 'already-delegating') {
    return { kind: 'delegated', power: state.power };
  }
  if (state.kind !== 'ready' || !breakdown) {
    return { kind: 'none' };
  }
  const power = breakdown.ownPower + (state.movesAlong?.power ?? 0);
  return Math.round(power) > 0 ? { kind: 'delegate', power } : { kind: 'none' };
}

const YOU_BADGE = (
  <>
    <span className="badge-sm-accent mr-1">You</span>{' '}
  </>
);

const ACTION_CLASS =
  'inline-block shrink-0 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:self-auto';

/**
 * The pool banner's action. A visitor without a wallet is asked to connect;
 * a connected wallet sees the power it can delegate, the power it already delegates to the DAO,
 * the power the DAO delegates to it, or a disabled "nothing to delegate".
 */
export default function PoolBannerAction({ poolAddress }: { poolAddress: string }) {
  const session = useWalletSession();
  const { openConnectModal } = useConnectModal();
  const [pin, setPin] = useState<{ address: string; data: VotingPowerData } | null>(null);

  useEffect(() => {
    if (session.phase !== 'connected') {
      return;
    }
    const address = session.address;
    const controller = new AbortController();
    fetch(`/api/voting-power/${address}?fresh=1`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: VotingPowerData | null) => data && setPin({ address, data }))
      .catch(() => {});
    return () => controller.abort();
  }, [session.phase, session.address]);

  const address = session.phase === 'connected' ? session.address : undefined;
  const offer =
    address && pin && pin.address === address ? offerFor(address, pin.data, poolAddress) : null;

  if (session.phase === 'disconnected') {
    return (
      <button type="button" onClick={openConnectModal} className={ACTION_CLASS}>
        SSV holder? Delegate to the DAO →
      </button>
    );
  }
  if (!address || !offer) {
    return null;
  }
  if (offer.kind === 'received') {
    return (
      <Link href={`/delegation?address=${address}`} className={ACTION_CLASS}>
        {YOU_BADGE}
        <span className="text-accent tabular-nums">
          {offer.power === null ? 'Voting power' : formatPower(offer.power)}
        </span>{' '}
        received from the DAO
      </Link>
    );
  }
  if (offer.kind === 'delegated') {
    return (
      <Link href={`/delegation?address=${address}`} className={ACTION_CLASS}>
        {YOU_BADGE}
        <span className="text-accent tabular-nums">{formatPower(offer.power)}</span> delegated to
        the DAO
      </Link>
    );
  }
  if (offer.kind === 'none') {
    return (
      <button type="button" disabled className={`${ACTION_CLASS} cursor-not-allowed opacity-60`}>
        {YOU_BADGE}
        <span className="tabular-nums">{formatPower(0)}</span> voting power to delegate
      </button>
    );
  }
  return (
    <Link href={`/delegation?address=${address}`} className={ACTION_CLASS}>
      {YOU_BADGE}
      Delegate your <span className="text-accent tabular-nums">
        {formatPower(offer.power)}
      </span>{' '}
      voting power to the DAO →
    </Link>
  );
}
