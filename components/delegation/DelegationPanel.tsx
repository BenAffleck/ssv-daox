'use client';

import { useMemo, useState } from 'react';
import { BaseError, type Address, type Hash } from 'viem';
import { normalize } from 'viem/ens';
import {
  useAccount,
  useEnsAddress,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { mainnet } from 'wagmi/chains';

import {
  planDelegation,
  toPlannedDelegations,
  type PlannedDelegation,
} from '@/lib/delegation/logic/delegation-plan';
import { SSV_SPACE_ID } from '@/lib/gnosis/config';
import {
  NO_EXPIRATION,
  SPLIT_DELEGATION_ABI,
  SPLIT_DELEGATION_REGISTRY,
  toRegistryDelegations,
} from '@/lib/gnosis/registry';
import type { DelegationEntry } from '@/lib/gnosis/types';

interface DelegationPanelProps {
  /** The selected address; only its owner can send the transaction. */
  address: string;
  /** Current outgoing delegations, or `null` when the Gnosis API lookup failed. */
  current: DelegationEntry[] | null;
}

type Mode = 'all-to-one' | 'clear';

type Submission =
  { kind: 'sent'; hash: Hash; safe: Address | null } | { kind: 'error'; message: string };

const EXPLORER_URL = mainnet.blockExplorers.default.url;

function toEnsName(value: string): string | null {
  if (!value.includes('.')) {
    return null;
  }
  try {
    return normalize(value);
  } catch {
    return null;
  }
}

function formatBps(bps: number): string {
  return `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
}

// wagmi wraps the wallet's rejection in a contract-call error.
function isUserRejection(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.walk((e) => (e as Error).name === 'UserRejectedRequestError') !== null;
  }
  return error instanceof Error && error.name === 'UserRejectedRequestError';
}

function DelegationList({ title, items }: { title: string; items: PlannedDelegation[] }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg bg-background p-4">
      <p className="table-col-header">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-[13px] text-muted">No delegation</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((d) => (
            <li key={d.address} className="flex justify-between gap-3 text-[13px]">
              <code className="truncate font-mono text-xs text-foreground">{d.address}</code>
              <span className="shrink-0 text-foreground">{formatBps(d.bps)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TransactionStatus({ hash, safe }: { hash: Hash; safe: Address | null }) {
  const receipt = useWaitForTransactionReceipt({ hash, query: { enabled: safe === null } });

  if (safe) {
    return (
      <p role="status" className="text-[13px] text-foreground">
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
      {confirmed && (
        <p className="text-muted">
          The Gnosis delegation API can take a few minutes to show the new delegation.
        </p>
      )}
    </div>
  );
}

/**
 * Delegates all voting power to one address or ENS name, or clears the
 * delegation, in the SSV Snapshot space of the Split Delegation registry.
 */
export default function DelegationPanel({ address, current }: DelegationPanelProps) {
  const { address: connected } = useAccount();
  const publicClient = usePublicClient({ chainId: mainnet.id });
  const { writeContractAsync, isPending: awaitingWallet } = useWriteContract();

  const currentEntries = useMemo(() => current ?? [], [current]);
  const [mode, setMode] = useState<Mode>('all-to-one');
  const [target, setTarget] = useState(currentEntries[0]?.address ?? '');
  const [confirmedDrop, setConfirmedDrop] = useState(false);
  // Errors show only after an edit, so a prefill that matches the current delegation isn't an error.
  const [edited, setEdited] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const ensName = toEnsName(target.trim());
  const ens = useEnsAddress({
    name: ensName ?? undefined,
    chainId: mainnet.id,
    query: { enabled: ensName !== null },
  });

  const resolvedTarget = ensName ? (ens.data ?? null) : target.trim();
  const plan = useMemo(
    () =>
      planDelegation({
        delegator: address,
        input:
          mode === 'clear'
            ? { kind: 'clear' }
            : { kind: 'all-to-one', target: resolvedTarget ?? '' },
        current: currentEntries,
      }),
    [address, mode, resolvedTarget, currentEntries],
  );
  const before = useMemo(() => toPlannedDelegations(currentEntries), [currentEntries]);

  const isOwner = connected?.toLowerCase() === address.toLowerCase();
  const ensPending = ensName !== null && ens.isLoading;
  const ensMissing = ensName !== null && !ens.isLoading && !ens.data;
  const hasInput = mode === 'clear' || target.trim() !== '';
  const needsDropConfirmation = plan.droppedDelegates.length > 0 && !confirmedDrop;
  const canSend =
    isOwner &&
    current !== null &&
    hasInput &&
    !ensPending &&
    !ensMissing &&
    plan.errors.length === 0 &&
    !needsDropConfirmation &&
    !awaitingWallet;

  // Any edit changes the plan, so a drop confirmation or past submission no longer applies.
  function resetOutcome() {
    setEdited(true);
    setConfirmedDrop(false);
    setSubmission(null);
  }

  function changeMode(next: Mode) {
    setMode(next);
    resetOutcome();
  }

  function changeTarget(value: string) {
    setTarget(value);
    resetOutcome();
  }

  async function send() {
    setSubmission(null);
    try {
      const hash =
        mode === 'clear'
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
              args: [SSV_SPACE_ID, toRegistryDelegations(plan.delegations), NO_EXPIRATION],
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

  const tabClass = (active: boolean) => (active ? 'filter-btn-active' : 'filter-btn');

  return (
    <section className="card mt-6 p-5" aria-labelledby="delegation-title">
      <h3 id="delegation-title">Delegate voting power</h3>
      <p className="mt-1 text-[13px] text-muted">
        Delegate the voting power of{' '}
        <code className="font-mono text-xs text-foreground">{address}</code> in the{' '}
        <code className="font-mono text-xs text-foreground">{SSV_SPACE_ID}</code> Snapshot space
        through the Gnosis Guild Split Delegation registry. Delegation cascades: power delegated to
        you is forwarded too.
      </p>

      {current === null && (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          Current delegations couldn&apos;t be loaded from the Gnosis delegation API, so the form is
          disabled. Reload to try again.
        </p>
      )}

      <div className="mt-4 flex gap-2" role="group" aria-label="Delegation mode">
        <button
          type="button"
          className={tabClass(mode === 'all-to-one')}
          aria-pressed={mode === 'all-to-one'}
          onClick={() => changeMode('all-to-one')}
        >
          All to one
        </button>
        <button
          type="button"
          className={tabClass(mode === 'clear')}
          aria-pressed={mode === 'clear'}
          onClick={() => changeMode('clear')}
        >
          Clear delegation
        </button>
      </div>

      {mode === 'all-to-one' && (
        <div className="mt-4 space-y-1">
          <label htmlFor="delegation-target" className="text-[13px] text-muted">
            Delegate address or ENS name
          </label>
          <input
            id="delegation-target"
            value={target}
            onChange={(e) => changeTarget(e.target.value)}
            placeholder="0x… or name.eth"
            className="filter-input w-full font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          {ensName && (
            <p className="text-[13px] text-muted">
              {ensPending
                ? `Resolving ${ensName}…`
                : ens.data
                  ? `${ensName} resolves to `
                  : `${ensName} doesn't resolve to an address.`}
              {ens.data && <code className="font-mono text-xs text-foreground">{ens.data}</code>}
            </p>
          )}
        </div>
      )}

      {edited && hasInput && !ensPending && !ensMissing && plan.errors.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-[13px] text-danger">
          {plan.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <DelegationList title="Before" items={before} />
        <DelegationList
          title="After"
          items={plan.errors.length === 0 ? plan.delegations : before}
        />
      </div>

      {plan.errors.length === 0 && plan.droppedDelegates.length > 0 && (
        <label className="mt-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-4 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={confirmedDrop}
            onChange={(e) => setConfirmedDrop(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand this removes my delegation to{' '}
            {plan.droppedDelegates.map((d, i) => (
              <span key={d}>
                {i > 0 && ', '}
                <code className="font-mono text-xs">{d}</code>
              </span>
            ))}
            .
          </span>
        </label>
      )}

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {awaitingWallet
            ? 'Confirm in your wallet…'
            : mode === 'clear'
              ? 'Clear delegation'
              : 'Delegate'}
        </button>
        {!isOwner && (
          <p className="text-[13px] text-muted">
            {connected ? 'Switch' : 'Connect'} your wallet to{' '}
            <code className="font-mono text-xs text-foreground">{address}</code> to delegate.
          </p>
        )}
        {submission?.kind === 'sent' && (
          <TransactionStatus hash={submission.hash} safe={submission.safe} />
        )}
        {submission?.kind === 'error' && (
          <p role="alert" className="text-[13px] text-danger">
            {submission.message}
          </p>
        )}
      </div>
    </section>
  );
}
