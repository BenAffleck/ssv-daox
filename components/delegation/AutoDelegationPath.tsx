'use client';

import { useState } from 'react';

import { useWalletSession } from '@/components/wallet/useWalletSession';
import { formatAddress } from '@/lib/dao-delegates/utils/address';
import {
  autoDelegationView,
  formatPower,
  type AutoDelegationState,
} from '@/lib/delegation/logic/auto-delegation';
import { sameAddress } from '@/lib/delegation/logic/pool';
import type { OptOutStatus } from '@/lib/delegation/opt-out/score-api';
import type { VotingPowerData } from '@/lib/gnosis/types';

import ConnectToDelegateButton, { PRIMARY_BUTTON } from './ConnectToDelegateButton';
import DelegateToDaoPanel from './DelegateToDaoPanel';
import {
  DropConfirmation,
  isSubmissionLocked,
  SubmissionStatus,
  useDelegationWrite,
  useSubmissionPhase,
} from './DelegationTransaction';
import OpenStepButton from './OpenStepButton';

interface AutoDelegationPathProps {
  address: string;
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
  /** The selected address's opt-out request; `null` when it sent none. */
  optOut: OptOutStatus | null;
  /** `false` when the page has no Opt-out step to open, so "Opt out first" isn't a link. */
  optOutStepAvailable: boolean;
}

const LAG_NOTE = 'Voting power updates within about 5 minutes.';

function powerOrFallback(power: number | null): string {
  return power === null ? 'voting power' : formatPower(power);
}

/** Why the address can't delegate to the pool, worded for its owner or a visitor. */
function blockedReason(state: AutoDelegationState, isOwner: boolean, optOutLink: boolean) {
  switch (state.kind) {
    case 'opt-out-required':
      return isOwner ? (
        <>
          You receive {powerOrFallback(state.poolPower)} from the DAO pool, so delegating to it
          would loop.{' '}
          {optOutLink ? (
            <OpenStepButton anchor="opt-out" variant="link">
              Opt out first
            </OpenStepButton>
          ) : (
            'Opt out first.'
          )}
        </>
      ) : (
        `Receives ${powerOrFallback(state.poolPower)} from the DAO pool, so it can't delegate to it.`
      );
    case 'awaiting-run':
      return "Opted out. Delegating to the pool opens once the next run removes the pool's delegation.";
    case 'nothing-to-delegate':
      return state.reason === 'pool'
        ? 'This is the DAO pool.'
        : 'This address has no voting power to delegate.';
    default:
      return null;
  }
}

/** The "Delegate to the DAO" panel with its one-click action for the selected address. */
export default function AutoDelegationPath({
  address,
  pin,
  poolAddress,
  optOut,
  optOutStepAvailable,
}: AutoDelegationPathProps) {
  const session = useWalletSession();
  const isOwner = session.phase === 'connected' && sameAddress(session.address, address);
  const { breakdown, state } = autoDelegationView({
    address,
    connected: session.address,
    pin,
    poolAddress,
    optOut,
  });
  const { send, submission, awaitingWallet } = useDelegationWrite();
  const phase = useSubmissionPhase(submission);
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
            "The DAO spreads your voting power across cohorts of delegates. We don't touch your tokens.",
          action: <OpenStepButton anchor="delegation">Change</OpenStepButton>,
        };
      case 'switch-account':
        if (session.phase === 'loading') {
          return {};
        }
        if (session.phase === 'disconnected') {
          return { action: <ConnectToDelegateButton /> };
        }
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
                confirmedMessage="You're delegating to the DAO pool."
                note={LAG_NOTE}
              />
            </>
          ),
        };
      }
      default:
        return {
          children: (
            <p className="text-muted">
              {blockedReason(state, isOwner, isOwner && optOutStepAvailable)}
            </p>
          ),
        };
    }
  }

  return <DelegateToDaoPanel {...panel()} />;
}
