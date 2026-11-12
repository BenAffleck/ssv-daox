'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import TrackEvent from '@/components/telemetry/TrackEvent';
import { useConnectAttempt } from '@/components/wallet/useConnectAttempt';
import { useWalletSession } from '@/components/wallet/useWalletSession';
import { autoDelegationView, formatPower } from '@/lib/delegation/logic/auto-delegation';
import type { VotingPowerData } from '@/lib/gnosis/types';
import { trackEvent } from '@/lib/telemetry/events';

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

const ACTION_BASE =
  'inline-block shrink-0 self-start rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:self-auto';
const ACTION_CLASS = `${ACTION_BASE} border-border bg-card text-foreground hover:bg-card-hover`;
const BOOSTED_ACTION_CLASS = `${ACTION_BASE} border-primary bg-primary/10 text-primary hover:bg-primary/20`;

/**
 * The pool banner's action. A visitor without a wallet is asked to connect;
 * a connected wallet sees the power it can delegate, the power it already delegates to the DAO,
 * the power the DAO delegates to it, or a disabled "nothing to delegate".
 */
export default function PoolBannerAction({
  poolAddress,
  boosted = false,
}: {
  poolAddress: string;
  /** A campaign runs: the action takes the brand outline, and the delegate offers pulse. */
  boosted?: boolean;
}) {
  const session = useWalletSession();
  const connect = useConnectAttempt((connected) => {
    if (connected === null) {
      trackEvent('connect_modal_closed', { placement: 'banner' });
    }
  });
  /** `data` is `null` when the wallet's power couldn't be loaded. */
  const [pin, setPin] = useState<{ address: string; data: VotingPowerData | null } | null>(null);

  useEffect(() => {
    if (session.phase !== 'connected') {
      return;
    }
    const address = session.address;
    const controller = new AbortController();
    fetch(`/api/voting-power/${address}?fresh=1`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: VotingPowerData | null) => setPin({ address, data }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setPin({ address, data: null });
        }
      });
    return () => controller.abort();
  }, [session.phase, session.address]);

  const address = session.phase === 'connected' ? session.address : undefined;
  const loaded = address && pin && pin.address === address ? pin : null;
  const offer = loaded?.data ? offerFor(loaded.address, loaded.data, poolAddress) : null;
  const offerShownEvent = loaded && (
    <TrackEvent
      name="delegate_offer_shown"
      properties={{ placement: 'banner', offer: offer?.kind ?? 'unavailable' }}
    />
  );
  const profileUrl = `/delegation?via=leaderboard&address=${address}`;

  const actionClass = boosted ? BOOSTED_ACTION_CLASS : ACTION_CLASS;
  const delegateClass = boosted ? `${actionClass} campaign-pulse` : actionClass;

  if (session.phase === 'disconnected') {
    return (
      <button
        type="button"
        onClick={() => {
          trackEvent('delegate_cta_clicked', { placement: 'banner', step: 'connect' });
          connect();
        }}
        className={delegateClass}
      >
        SSV or cSSV holder? Delegate to the DAO →
      </button>
    );
  }
  if (!offer) {
    return offerShownEvent || null;
  }
  if (offer.kind === 'received') {
    return (
      <>
        {offerShownEvent}
        <Link href={profileUrl} className={actionClass}>
          {YOU_BADGE}
          <span className="text-accent tabular-nums">
            {offer.power === null ? 'Voting power' : formatPower(offer.power)}
          </span>{' '}
          received from the DAO
        </Link>
      </>
    );
  }
  if (offer.kind === 'delegated') {
    return (
      <>
        {offerShownEvent}
        <Link href={profileUrl} className={actionClass}>
          {YOU_BADGE}
          <span className="text-accent tabular-nums">{formatPower(offer.power)}</span> delegated to
          the DAO
        </Link>
      </>
    );
  }
  if (offer.kind === 'none') {
    return (
      <>
        {offerShownEvent}
        <button type="button" disabled className={`${actionClass} cursor-not-allowed opacity-60`}>
          {YOU_BADGE}
          <span className="tabular-nums">{formatPower(0)}</span> voting power to delegate
        </button>
      </>
    );
  }
  return (
    <>
      {offerShownEvent}
      <Link
        href={profileUrl}
        onClick={() => trackEvent('delegate_cta_clicked', { placement: 'banner', step: 'open' })}
        className={delegateClass}
      >
        {YOU_BADGE}
        Delegate your <span className="text-accent tabular-nums">
          {formatPower(offer.power)}
        </span>{' '}
        voting power to the DAO →
      </Link>
    </>
  );
}
