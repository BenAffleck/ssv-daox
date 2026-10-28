'use client';

import { useEffect, useState } from 'react';

import NextRoundPower from '@/components/leaderboard/NextRoundPower';
import { useWalletSession } from '@/components/wallet/useWalletSession';
import { SSV_GOVERNANCE_URL } from '@/lib/delegation/config';
import { accountSwitchPrompt } from '@/lib/delegation/logic/address-overview';
import {
  autoDelegationView,
  formatPower,
  type AutoDelegationState,
} from '@/lib/delegation/logic/auto-delegation';
import { sameAddress } from '@/lib/delegation/logic/pool';
import { powerChangeOf } from '@/lib/delegation/logic/power-change';
import type { OptOutStatus } from '@/lib/delegation/opt-out/score-api';
import type { VotingPowerData } from '@/lib/gnosis/types';
import { loadScoreStatus } from '@/lib/leaderboard/api/load-status';
import { nextUpdateEstimate } from '@/lib/leaderboard/logic/freshness';
import type { ScoreStatus } from '@/lib/leaderboard/types';
import { formatAddress } from '@/lib/leaderboard/utils/address';

import ConnectToDelegateButton, { PRIMARY_BUTTON } from './ConnectToDelegateButton';
import DelegateToDaoPanel from './DelegateToDaoPanel';
import {
  DropConfirmation,
  isSubmissionLocked,
  SubmissionStatus,
  useDelegationWrite,
  useSubmissionPhase,
} from './DelegationTransaction';
import OpenOwnAddressLink from './OpenOwnAddressLink';
import OpenStepButton, { SECONDARY_BUTTON } from './OpenStepButton';
import { ownDelegateToDaoUrl, useConnectToDelegate } from './useConnectToDelegate';
import { STILL_INDEXING_NOTE, useRefreshWhile } from './useRefreshWhile';

interface AutoDelegationPathProps {
  address: string;
  /** The selected address and its identity siblings. */
  identityAddresses: string[];
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
  /** The selected address's opt-out request; `null` when it sent none. */
  optOut: OptOutStatus | null;
  /** `false` when the page has no Opt-out step to open, so "opt out" isn't a link. */
  optOutStepAvailable: boolean;
  /** Power the next score run allocates to the address; `null` when it isn't scored. */
  nextPower: number | null;
}

const LAG_NOTE =
  'Your voting power updates once the delegation API picks up the transaction, usually a few minutes after it executes. This page refreshes on its own.';

function powerOrFallback(power: number | null): string {
  return power === null ? 'voting power' : formatPower(power);
}

function blockedReason(state: AutoDelegationState) {
  if (state.kind !== 'nothing-to-delegate') {
    return null;
  }
  return state.reason === 'pool'
    ? 'This is the DAO auto-delegation pool.'
    : 'This address has no voting power to delegate.';
}

/** Why delegating to the DAO is still closed after an opt-out, and when the Delegate Score update lifts it. */
function OptedOutNote() {
  const [status, setStatus] = useState<ScoreStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadScoreStatus().then((loaded) => {
      if (!cancelled) {
        setStatus(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span suppressHydrationWarning>
      Opted out. The DAO's delegation is removed with the next Delegate Score update
      {status && `, ${nextUpdateEstimate(status, new Date())}`}.
    </span>
  );
}

/** The "Delegate to the DAO" panel with its one-click action for the selected address. */
export default function AutoDelegationPath({
  address,
  identityAddresses,
  pin,
  poolAddress,
  optOut,
  optOutStepAvailable,
  nextPower,
}: AutoDelegationPathProps) {
  const session = useWalletSession();
  const connectToDelegate = useConnectToDelegate(address);
  const isOwner = session.phase === 'connected' && sameAddress(session.address, address);
  const { breakdown, state } = autoDelegationView({
    address,
    connected: session.address,
    pin,
    poolAddress,
    optOut,
  });
  const { send, submission, resetSubmission, awaitingWallet } = useDelegationWrite(
    `ssv-daox:auto-delegation:${address.toLowerCase()}`,
  );
  const phase = useSubmissionPhase(submission);
  const indexed = state.kind === 'already-delegating';
  const gaveUp = useRefreshWhile((phase === 'confirmed' || phase === 'proposed') && !indexed);

  // Once the indexed delegation shows the write, the remembered status has done its job.
  useEffect(() => {
    if (indexed) {
      resetSubmission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetSubmission is recreated each render
  }, [indexed]);
  const [confirmedDrop, setConfirmedDrop] = useState(false);

  const powerLabel = (power: number) => (
    <span className="text-accent tabular-nums">{formatPower(power)}</span>
  );

  function panel(): React.ComponentProps<typeof DelegateToDaoPanel> {
    switch (state.kind) {
      case 'unavailable':
        return {
          children: (
            <p className="text-muted">Voting power couldn&apos;t be loaded. Try again later.</p>
          ),
        };
      case 'already-delegating':
        return {
          title: <>You&apos;re delegating {powerLabel(state.power)} to the DAO</>,
          subtitle:
            "All of this address's voting power goes to the DAO, including SSV it receives later. The DAO spreads it across cohorts of delegates. We don't touch your tokens.",
          action: <OpenStepButton anchor="delegation">Change</OpenStepButton>,
        };
      case 'switch-account':
        if (session.phase === 'loading') {
          return {};
        }
        if (session.phase === 'disconnected') {
          return { action: <ConnectToDelegateButton onClick={connectToDelegate} /> };
        }
        if (accountSwitchPrompt(address, session.address, identityAddresses) === 'sibling') {
          return {
            children: (
              <p className="text-muted">
                Switch your wallet to{' '}
                <code className="font-mono text-xs text-foreground" title={address}>
                  {formatAddress(address)}
                </code>{' '}
                to delegate.
              </p>
            ),
          };
        }
        return {
          action: (
            <OpenOwnAddressLink
              address={session.address}
              href={ownDelegateToDaoUrl(session.address)}
            />
          ),
          children: (
            <p className="text-muted">
              You&apos;re connected as{' '}
              <code className="font-mono text-xs text-foreground" title={session.address}>
                {formatAddress(session.address)}
              </code>
              . Delegate from your own address.
            </p>
          ),
        };
      case 'ready': {
        const locked = isSubmissionLocked(phase);
        const power = (breakdown?.ownPower ?? 0) + (state.movesAlong?.power ?? 0);
        const confirm = !locked && state.droppedDelegates.length > 0;
        return {
          title: <>Delegate your {powerLabel(power)} voting power to the DAO</>,
          action: !locked && (
            <button
              type="button"
              onClick={() => send(state.delegations)}
              disabled={awaitingWallet || (state.droppedDelegates.length > 0 && !confirmedDrop)}
              className={PRIMARY_BUTTON}
            >
              {awaitingWallet
                ? 'Confirm in your wallet…'
                : phase === 'failed' || phase === 'error'
                  ? 'Try again'
                  : 'Delegate to the DAO'}
            </button>
          ),
          children: (confirm || phase !== 'idle') && (
            <>
              {confirm && (
                <DropConfirmation
                  dropped={state.droppedDelegates}
                  checked={confirmedDrop}
                  onChange={setConfirmedDrop}
                />
              )}
              <SubmissionStatus
                submission={submission}
                phase={phase}
                confirmedMessage="You're delegating to the DAO."
                note={gaveUp ? STILL_INDEXING_NOTE : LAG_NOTE}
              />
            </>
          ),
        };
      }
      case 'opt-out-required':
      case 'awaiting-run': {
        const received = breakdown?.fromPool?.power ?? null;
        const optedOut = state.kind === 'awaiting-run';
        const change = powerChangeOf(received, nextPower);
        const who = isOwner ? 'you' : 'this address';
        return {
          title: (
            <>
              The DAO delegates {received === null ? 'voting power' : powerLabel(received)}
              {change && <NextRoundPower change={change} />} to {who}
            </>
          ),
          subtitle: optedOut ? (
            <OptedOutNote />
          ) : isOwner ? (
            <>
              To delegate to the DAO yourself,{' '}
              {optOutStepAvailable ? (
                <OpenStepButton anchor="opt-out" variant="link">
                  opt out
                </OpenStepButton>
              ) : (
                'opt out'
              )}{' '}
              of its delegation first.
            </>
          ) : undefined,
          action: isOwner && !optedOut && (
            <a
              href={SSV_GOVERNANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block ${SECONDARY_BUTTON}`}
            >
              🎉 Start contributing ↗
            </a>
          ),
        };
      }
      default:
        return {
          children: <p className="text-muted">{blockedReason(state)}</p>,
        };
    }
  }

  return <DelegateToDaoPanel {...panel()} />;
}
