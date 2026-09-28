'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { normalize } from 'viem/ens';
import { useAccount, useConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { getEnsAddressQueryOptions } from 'wagmi/query';

import {
  formatPercent,
  MAX_SPLIT_TARGETS,
  planDelegation,
  toPlannedDelegations,
  type PlannedDelegation,
  type SplitTarget,
  type TargetScoring,
} from '@/lib/delegation/logic/delegation-plan';
import { SSV_SPACE_ID } from '@/lib/gnosis/config';
import type { DelegationEntry } from '@/lib/gnosis/types';

import DelegateName from './DelegateName';
import { DropConfirmation, SubmissionStatus, useDelegationWrite } from './DelegationTransaction';
import StepPanel from './StepPanel';

interface DelegationPanelProps {
  /** The selected address; only its owner can send the transaction. */
  address: string;
  /** Current outgoing delegations, or `null` when the Gnosis API lookup failed. */
  current: DelegationEntry[] | null;
  /** The selected address's identity siblings, offered as consolidation quick picks. */
  ownAddresses: string[];
  scoring: TargetScoring;
  step?: number;
}

type Mode = 'all-to-one' | 'split' | 'clear';

interface ResolvedTarget {
  ensName: string | null;
  /** The typed address, or the ENS name's address; `null` while unresolved. */
  address: string | null;
  pending: boolean;
  missing: boolean;
}

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

/** Resolves each input that contains a dot as an ENS name over the RPC proxy. */
function useResolvedTargets(inputs: string[]): ResolvedTarget[] {
  const config = useConfig();
  const names = inputs.map(toEnsName);
  const results = useQueries({
    queries: names.map((name) => ({
      ...getEnsAddressQueryOptions(config, { name: name ?? undefined, chainId: mainnet.id }),
      enabled: name !== null,
    })),
  });
  return inputs.map((input, i) => {
    const name = names[i];
    if (name === null) {
      return { ensName: null, address: input, pending: false, missing: false };
    }
    const result = results[i];
    return {
      ensName: name,
      address: result.data ?? null,
      pending: result.isLoading,
      missing: !result.isLoading && !result.data,
    };
  });
}

function EnsResolution({ target }: { target: ResolvedTarget }) {
  if (!target.ensName) {
    return null;
  }
  return (
    <p className="text-[13px] text-muted">
      {target.pending
        ? `Resolving ${target.ensName}…`
        : target.address
          ? `${target.ensName} resolves to `
          : `${target.ensName} doesn't resolve to an address.`}
      {target.address && (
        <code className="font-mono text-xs text-foreground">{target.address}</code>
      )}
    </p>
  );
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
              <DelegateName address={d.address} className="truncate text-xs" />
              <span className="shrink-0 text-foreground">{formatPercent(d.bps)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY_ROW: SplitTarget = { target: '', percent: '' };

function toSplitTargets(delegations: PlannedDelegation[]): SplitTarget[] {
  const targets: SplitTarget[] = delegations.map((d) => ({
    target: d.address,
    percent: String(d.bps / 100),
  }));
  while (targets.length < 2) {
    targets.push(EMPTY_ROW);
  }
  return targets;
}

/**
 * Delegates voting power to one address or ENS name, splits it across up to
 * 10, or clears the delegation, in the SSV Snapshot space of the Split
 * Delegation registry.
 */
export default function DelegationPanel({
  address,
  current,
  ownAddresses,
  scoring,
  step,
}: DelegationPanelProps) {
  const { address: connected } = useAccount();
  const { send, submission, resetSubmission, awaitingWallet } = useDelegationWrite();

  const currentEntries = useMemo(() => current ?? [], [current]);
  const before = useMemo(() => toPlannedDelegations(currentEntries), [currentEntries]);
  const [mode, setMode] = useState<Mode>(before.length > 1 ? 'split' : 'all-to-one');
  const [target, setTarget] = useState(currentEntries[0]?.address ?? '');
  const [splitTargets, setSplitTargets] = useState(() => toSplitTargets(before));
  const [confirmedDrop, setConfirmedDrop] = useState(false);
  // Errors show only after an edit, so a prefill that matches the current delegation isn't an error.
  const [edited, setEdited] = useState(false);

  const inputs = mode === 'split' ? splitTargets.map((t) => t.target.trim()) : [target.trim()];
  const resolved = useResolvedTargets(mode === 'clear' ? [] : inputs);
  const addresses = resolved.map((r) => r.address ?? '');

  const plan = planDelegation({
    delegator: address,
    input:
      mode === 'clear'
        ? { kind: 'clear' }
        : mode === 'split'
          ? {
              kind: 'split',
              targets: splitTargets.map((t, i) => ({ ...t, target: addresses[i] ?? '' })),
            }
          : { kind: 'all-to-one', target: addresses[0] ?? '' },
    current: currentEntries,
    scoring,
  });

  const quickPicks = useMemo(() => {
    const own = new Map<string, string>();
    for (const a of [...(connected ? [connected] : []), ...ownAddresses]) {
      if (a.toLowerCase() !== address.toLowerCase()) {
        own.set(a.toLowerCase(), a);
      }
    }
    return [...own.values()];
  }, [connected, ownAddresses, address]);

  const isOwner = connected?.toLowerCase() === address.toLowerCase();
  const ensPending = resolved.some((r) => r.pending);
  const ensMissing = resolved.some((r) => r.missing);
  const hasInput =
    mode === 'clear' ||
    (mode === 'split'
      ? splitTargets.some((t) => t.target.trim() !== '' || t.percent.trim() !== '')
      : target.trim() !== '');
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
    resetSubmission();
  }

  function changeMode(next: Mode) {
    setMode(next);
    resetOutcome();
  }

  function changeTarget(value: string) {
    setTarget(value);
    resetOutcome();
  }

  function changeSplitTargets(next: SplitTarget[]) {
    setSplitTargets(next);
    resetOutcome();
  }

  function updateSplitTarget(index: number, change: Partial<SplitTarget>) {
    changeSplitTargets(splitTargets.map((t, i) => (i === index ? { ...t, ...change } : t)));
  }

  const emptyRow = splitTargets.findIndex((t) => t.target.trim() === '');
  const splitFull = emptyRow < 0 && splitTargets.length >= MAX_SPLIT_TARGETS;

  function addSplitRow(target = '') {
    changeSplitTargets([...splitTargets, { ...EMPTY_ROW, target }]);
  }

  function pick(own: string) {
    if (mode !== 'split') {
      changeTarget(own);
      return;
    }
    if (emptyRow >= 0) {
      updateSplitTarget(emptyRow, { target: own });
    } else if (!splitFull) {
      addSplitRow(own);
    }
  }

  const tabClass = (active: boolean) => (active ? 'filter-btn-active' : 'filter-btn');

  return (
    <StepPanel
      step={step}
      anchor="delegation"
      title="Delegate voting power"
      summary="Optional. Give your Snapshot voting power to one address or split it across several."
      status={
        before.length > 0 && (
          <span className="badge badge-muted whitespace-nowrap">
            Delegated to {before.length === 1 ? '1 address' : `${before.length} addresses`}
          </span>
        )
      }
      openLabel="Delegate"
    >
      <p className="text-[13px] text-muted">
        Delegates <code className="font-mono text-xs text-foreground">{address}</code> in the{' '}
        <code className="font-mono text-xs text-foreground">{SSV_SPACE_ID}</code> Snapshot space
        through the Gnosis Guild Split Delegation registry. Power delegated to you is forwarded too.
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
          className={tabClass(mode === 'split')}
          aria-pressed={mode === 'split'}
          onClick={() => changeMode('split')}
        >
          Split
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
          {resolved[0] && <EnsResolution target={resolved[0]} />}
        </div>
      )}

      {mode === 'split' && (
        <div className="mt-4 space-y-3">
          {splitTargets.map((t, i) => (
            <div key={i} className="space-y-1">
              <div className="flex gap-2">
                <input
                  aria-label={`Delegate ${i + 1} address or ENS name`}
                  value={t.target}
                  onChange={(e) => updateSplitTarget(i, { target: e.target.value })}
                  placeholder="0x… or name.eth"
                  className="filter-input min-w-0 flex-1 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-1">
                  <input
                    aria-label={`Delegate ${i + 1} percentage`}
                    value={t.percent}
                    onChange={(e) => updateSplitTarget(i, { percent: e.target.value })}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="filter-input w-24 text-right"
                    autoComplete="off"
                  />
                  <span className="text-[13px] text-muted">%</span>
                </div>
                <button
                  type="button"
                  className="filter-btn"
                  aria-label={`Remove delegate ${i + 1}`}
                  disabled={splitTargets.length <= 2}
                  onClick={() => changeSplitTargets(splitTargets.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
              {resolved[i] && <EnsResolution target={resolved[i]} />}
            </div>
          ))}
          <button
            type="button"
            className="filter-btn"
            disabled={splitTargets.length >= MAX_SPLIT_TARGETS}
            onClick={() => addSplitRow()}
          >
            Add address
          </button>
          <p className="text-[13px] text-muted">
            Up to {MAX_SPLIT_TARGETS} addresses. Percentages allow 2 decimals and must add up to
            exactly 100%.
          </p>
        </div>
      )}

      {mode !== 'clear' && quickPicks.length > 0 && (
        <div className="mt-3">
          <p className="text-[13px] text-muted">Your addresses</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {quickPicks.map((own) => (
              <button
                key={own}
                type="button"
                className="filter-btn font-mono text-xs"
                disabled={mode === 'split' && splitFull}
                onClick={() => pick(own)}
              >
                {own}
              </button>
            ))}
          </div>
        </div>
      )}

      {edited && hasInput && !ensPending && !ensMissing && plan.errors.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-[13px] text-danger">
          {plan.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {plan.warnings.length > 0 && !ensPending && (
        <ul className="mt-3 space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-4 text-[13px] text-foreground">
          {plan.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {plan.notes.length > 0 && !ensPending && (
        <ul className="mt-3 space-y-1 rounded-lg border border-primary/40 bg-primary/10 p-4 text-[13px] text-foreground">
          {plan.notes.map((n) => (
            <li key={n}>{n}</li>
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
        <div className="mt-4">
          <DropConfirmation
            dropped={plan.droppedDelegates}
            checked={confirmedDrop}
            onChange={setConfirmedDrop}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => send(mode === 'clear' ? 'clear' : plan.delegations)}
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
        <SubmissionStatus
          submission={submission}
          note="The Gnosis delegation API can take a few minutes to show the new delegation."
        />
      </div>
    </StepPanel>
  );
}
