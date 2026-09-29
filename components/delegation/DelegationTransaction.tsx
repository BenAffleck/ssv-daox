'use client';

import { useState } from 'react';
import { BaseError, type Address, type Hash } from 'viem';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';

import type { PlannedDelegation } from '@/lib/delegation/logic/delegation-plan';
import { SSV_SPACE_ID } from '@/lib/gnosis/config';
import {
  NO_EXPIRATION,
  SPLIT_DELEGATION_ABI,
  SPLIT_DELEGATION_REGISTRY,
  toRegistryDelegations,
} from '@/lib/gnosis/registry';

import DelegateName from './DelegateName';

export type Submission =
  { kind: 'sent'; hash: Hash; safe: Address | null } | { kind: 'error'; message: string };

/** The delegations to write with `setDelegation`, or `'clear'` for `clearDelegation`. */
export type DelegationWrite = PlannedDelegation[] | 'clear';

const EXPLORER_URL = mainnet.blockExplorers.default.url;

// wagmi wraps the wallet's rejection in a contract-call error.
function isUserRejection(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.walk((e) => (e as Error).name === 'UserRejectedRequestError') !== null;
  }
  return error instanceof Error && error.name === 'UserRejectedRequestError';
}

/**
 * Writes the connected account's delegation in the SSV Snapshot space of the
 * Split Delegation registry. The registry overwrites the whole delegation.
 */
export function useDelegationWrite() {
  const { address: connected } = useAccount();
  const publicClient = usePublicClient({ chainId: mainnet.id });
  const { writeContractAsync, isPending: awaitingWallet } = useWriteContract();
  const [submission, setSubmission] = useState<Submission | null>(null);

  async function send(write: DelegationWrite) {
    setSubmission(null);
    try {
      const hash =
        write === 'clear'
          ? await writeContractAsync({
              address: SPLIT_DELEGATION_REGISTRY,
              abi: SPLIT_DELEGATION_ABI,
              functionName: 'clearDelegation',
              args: [SSV_SPACE_ID],
              chainId: mainnet.id,
            })
          : await writeContractAsync({
              address: SPLIT_DELEGATION_REGISTRY,
              abi: SPLIT_DELEGATION_ABI,
              functionName: 'setDelegation',
              args: [SSV_SPACE_ID, toRegistryDelegations(write), NO_EXPIRATION],
              chainId: mainnet.id,
            });
      // A contract account (Safe) returns a Safe transaction hash that is never mined as-is.
      const code = connected ? await publicClient?.getCode({ address: connected }) : undefined;
      setSubmission({
        kind: 'sent',
        hash,
        safe: connected && code && code !== '0x' ? connected : null,
      });
    } catch (error) {
      setSubmission({
        kind: 'error',
        message: isUserRejection(error)
          ? 'The transaction was rejected in your wallet.'
          : 'The transaction could not be sent. Try again.',
      });
    }
  }

  return { send, submission, resetSubmission: () => setSubmission(null), awaitingWallet };
}

export type SubmissionPhase = 'idle' | 'pending' | 'confirmed' | 'failed' | 'proposed' | 'error';

/** Where a submission stands; an EOA's transaction is followed to its receipt. */
export function useSubmissionPhase(submission: Submission | null): SubmissionPhase {
  const hash = submission?.kind === 'sent' && !submission.safe ? submission.hash : undefined;
  const receipt = useWaitForTransactionReceipt({ hash, query: { enabled: hash !== undefined } });
  if (!submission) {
    return 'idle';
  }
  if (submission.kind === 'error') {
    return 'error';
  }
  if (submission.safe) {
    return 'proposed';
  }
  if (receipt.isError || receipt.data?.status === 'reverted') {
    return 'failed';
  }
  return receipt.data?.status === 'success' ? 'confirmed' : 'pending';
}

/** `true` once the write is on its way or done, so it can't be sent twice. */
export function isSubmissionLocked(phase: SubmissionPhase): boolean {
  return phase === 'pending' || phase === 'confirmed' || phase === 'proposed';
}

const TONES = {
  pending: 'border-warning/40 bg-warning/10',
  confirmed: 'border-accent/40 bg-accent/10',
  failed: 'border-danger/40 bg-danger/10',
  proposed: 'border-primary/40 bg-primary/10',
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
}

/**
 * The submission's outcome: an EOA's receipt (pending, confirmed, failed), a
 * Safe proposal with its queue link, or the send error. `note` explains the
 * indexing lag once the write lands.
 */
export function SubmissionStatus({
  submission,
  phase,
  confirmedMessage,
  note,
}: {
  submission: Submission | null;
  phase: SubmissionPhase;
  confirmedMessage: string;
  note: string;
}) {
  if (submission?.kind === 'error') {
    return (
      <p role="alert" className="text-[13px] text-danger">
        {submission.message}
      </p>
    );
  }
  if (submission?.kind !== 'sent' || phase === 'idle' || phase === 'error') {
    return null;
  }
  const etherscan = (
    <ExternalLink href={`${EXPLORER_URL}/tx/${submission.hash}`}>View on Etherscan</ExternalLink>
  );
  return (
    <div role="status" className={`space-y-1 rounded-lg border p-4 text-[13px] ${TONES[phase]}`}>
      {phase === 'proposed' && submission.safe && (
        <>
          <p className="font-medium text-foreground">Proposed to your Safe</p>
          <p className="text-muted">
            Your co-signers must approve it before it executes.{' '}
            <ExternalLink
              href={`https://app.safe.global/transactions/queue?safe=eth:${submission.safe}`}
            >
              Open the Safe queue
            </ExternalLink>
          </p>
          <p className="text-muted">{note}</p>
        </>
      )}
      {phase === 'pending' && (
        <p>
          <span className="font-medium text-warning">Transaction pending…</span> {etherscan}
        </p>
      )}
      {phase === 'confirmed' && (
        <>
          <p>
            <span className="font-medium text-accent">{confirmedMessage}</span> {etherscan}
          </p>
          <p className="text-muted">{note}</p>
        </>
      )}
      {phase === 'failed' && (
        <p>
          <span className="font-medium text-danger">Transaction failed.</span> {etherscan}
        </p>
      )}
    </div>
  );
}

/** The user must tick this before a write that removes current delegates. */
export function DropConfirmation({
  dropped,
  checked,
  onChange,
}: {
  dropped: Address[];
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-4 text-[13px] text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        I understand this removes my delegation to{' '}
        {dropped.map((d, i) => (
          <span key={d}>
            {i > 0 && ', '}
            <DelegateName address={d} className="text-xs" />
          </span>
        ))}
        .
      </span>
    </label>
  );
}
