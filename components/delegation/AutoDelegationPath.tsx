'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

import {
  autoDelegationView,
  formatDelegatorCount,
  formatPower,
  type AutoDelegationState,
  type MovesAlong,
} from '@/lib/delegation/logic/auto-delegation';
import type { VotingPowerData } from '@/lib/gnosis/types';

import { DropConfirmation, SubmissionStatus, useDelegationWrite } from './DelegationTransaction';
import OpenStepButton from './OpenStepButton';
import VotingPowerBreakdownCard from './VotingPowerBreakdownCard';

interface AutoDelegationPathProps {
  /** The selected address. */
  address: string;
  /** The selected address's pin data; `null` when the lookup failed. */
  pin: VotingPowerData | null;
  poolAddress: string;
  /** `false` without an RPC URL: the breakdown shows, the action doesn't. */
  walletAvailable: boolean;
}

const LAG_NOTE = 'Your voting power card and the pool total update within about 5 minutes.';

function movesAlongNote({ delegatorCount, power }: MovesAlong): string {
  const whose = `${formatDelegatorCount(delegatorCount)}${delegatorCount === 1 ? "'s" : "'"}`;
  const amount = power === null ? 'voting power' : formatPower(power);
  return `${whose} ${amount} moves to the pool too, because delegating passes on power delegated to you.`;
}

function blockedReason(state: AutoDelegationState, connected: boolean, address: string) {
  switch (state.kind) {
    case 'unavailable':
      return "Your current delegations couldn't be loaded, so the action is disabled to avoid overwriting them. Try again in a few minutes.";
    case 'switch-account':
      return (
        <>
          {connected ? 'Switch' : 'Connect'} your wallet to{' '}
          <code className="font-mono text-xs break-all text-foreground">{address}</code> to
          delegate.
        </>
      );
    case 'nothing-to-delegate':
      return state.reason === 'pool'
        ? 'This is the DAO pool.'
        : 'Nothing to delegate on this address.';
    default:
      return null;
  }
}

function DelegateButton({
  disabled,
  awaitingWallet,
  onClick,
}: {
  disabled: boolean;
  awaitingWallet: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {awaitingWallet ? 'Confirm in your wallet…' : 'Delegate to the DAO'}
    </button>
  );
}

/** The selected address's voting power and the one-click "Delegate to the DAO" action. */
export default function AutoDelegationPath({
  address,
  pin,
  poolAddress,
  walletAvailable,
}: AutoDelegationPathProps) {
  const { address: connected } = useAccount();
  const { breakdown, state } = autoDelegationView({ address, connected, pin, poolAddress });
  const { send, submission, awaitingWallet } = useDelegationWrite();
  const [confirmedDrop, setConfirmedDrop] = useState(false);

  return (
    <>
      <VotingPowerBreakdownCard breakdown={breakdown} />
      {walletAvailable && (
        <div className="mt-4 space-y-3 text-[13px]">
          {state.kind === 'already-delegating' ? (
            <p role="status" className="text-foreground">
              <span className="font-medium text-accent">
                You&apos;re delegating {formatPower(state.power)} to the DAO pool.
              </span>{' '}
              <OpenStepButton anchor="delegation" variant="link">
                Change
              </OpenStepButton>
            </p>
          ) : state.kind === 'ready' ? (
            <>
              {state.movesAlong && <p className="text-muted">{movesAlongNote(state.movesAlong)}</p>}
              {state.droppedDelegates.length > 0 && (
                <DropConfirmation
                  dropped={state.droppedDelegates}
                  checked={confirmedDrop}
                  onChange={setConfirmedDrop}
                />
              )}
              <DelegateButton
                disabled={awaitingWallet || (state.droppedDelegates.length > 0 && !confirmedDrop)}
                awaitingWallet={awaitingWallet}
                onClick={() => send(state.delegations)}
              />
              <SubmissionStatus submission={submission} note={LAG_NOTE} />
            </>
          ) : (
            <>
              <DelegateButton disabled awaitingWallet={false} />
              <p className="text-muted">{blockedReason(state, Boolean(connected), address)}</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
