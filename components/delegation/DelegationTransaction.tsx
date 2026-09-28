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

function TransactionStatus({
  hash,
  safe,
  note,
}: {
  hash: Hash;
  safe: Address | null;
  note: string;
}) {
  const receipt = useWaitForTransactionReceipt({ hash, query: { enabled: safe === null } });

  if (safe) {
    return (
      <div role="status" className="space-y-1 text-[13px]">
        <p className="text-foreground">
          Proposed to your Safe. Your co-signers must approve it before it executes.{' '}
          <a
            href={`https://app.safe.global/transactions/queue?safe=eth:${safe}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open the Safe queue
          </a>
        </p>
        <p className="text-muted">{note}</p>
      </div>
    );
  }

  const failed = receipt.isError || receipt.data?.status === 'reverted';
  const confirmed = receipt.data?.status === 'success';
  const label = failed ? 'Failed' : confirmed ? 'Confirmed' : 'Pending';
  const tone = failed ? 'text-danger' : confirmed ? 'text-accent' : 'text-warning';

  return (
    <div role="status" className="space-y-1 text-[13px]">
      <p>
        <span className={`font-medium ${tone}`}>{label}</span>{' '}
        <a
          href={`${EXPLORER_URL}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          View on Etherscan
        </a>
      </p>
      {confirmed && <p className="text-muted">{note}</p>}
    </div>
  );
}

/**
 * An EOA's receipt (Pending → Confirmed/Failed) or a Safe's queue link, or the
 * send error. `note` explains the indexing lag once the write lands.
 */
export function SubmissionStatus({
  submission,
  note,
}: {
  submission: Submission | null;
  note: string;
}) {
  if (submission?.kind === 'sent') {
    return <TransactionStatus hash={submission.hash} safe={submission.safe} note={note} />;
  }
  if (submission?.kind === 'error') {
    return (
      <p role="alert" className="text-[13px] text-danger">
        {submission.message}
      </p>
    );
  }
  return null;
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
