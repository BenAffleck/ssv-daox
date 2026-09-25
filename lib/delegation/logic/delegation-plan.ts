import { getAddress, zeroAddress, type Address } from 'viem';

import type { ScoreRow } from '@/lib/dao-delegates/types';
import type { DelegationEntry } from '@/lib/gnosis/types';

import type { OptOutStatuses } from '../opt-out/score-api';
import { isAddress, optOutBadgeOf } from './address-overview';

const FULL_BPS = 10000;
export const MAX_SPLIT_TARGETS = 10;

export interface SplitTarget {
  target: string;
  /** As typed: a number with up to 2 decimals. */
  percent: string;
}

/** Targets are addresses; ENS names are resolved before planning. */
export type DelegationInput =
  | { kind: 'all-to-one'; target: string }
  | { kind: 'split'; targets: SplitTarget[] }
  | { kind: 'clear' };

/** Keyed by lowercase address. An address without an entry is unscored. */
export type TargetScoring = Record<string, 'scored' | 'opted_out' | 'opt_out_pending'>;

export interface PlannedDelegation {
  address: Address;
  bps: number;
}

export interface ChangedDelegation {
  address: Address;
  fromBps: number;
  toBps: number;
}

export interface DelegationDiff {
  added: PlannedDelegation[];
  changed: ChangedDelegation[];
  removed: PlannedDelegation[];
}

export interface DelegationPlan {
  /** The delegations to write; empty for a clear. */
  delegations: PlannedDelegation[];
  diff: DelegationDiff;
  /** Current delegates the plan removes; the user must confirm dropping them. */
  droppedDelegates: Address[];
  warnings: string[];
  /** Non-empty when the plan must not be sent. */
  errors: string[];
}

interface PlanRequest {
  /** The account that sends the transaction. */
  delegator: string;
  input: DelegationInput;
  /** Current outgoing delegations from the Gnosis pin endpoint. */
  current: DelegationEntry[];
  scoring: TargetScoring;
}

const EMPTY_DIFF: DelegationDiff = { added: [], changed: [], removed: [] };

function invalid(errors: string[]): DelegationPlan {
  return { delegations: [], diff: EMPTY_DIFF, droppedDelegates: [], warnings: [], errors };
}

function planned(
  delegations: PlannedDelegation[],
  diff: DelegationDiff,
  warnings: string[] = [],
): DelegationPlan {
  return {
    delegations,
    diff,
    droppedDelegates: diff.removed.map((d) => d.address),
    warnings,
    errors: [],
  };
}

/**
 * The scoring state of every leaderboard address. Pass the statuses from
 * `fetchOptOutStatuses`, not `row.opt_out`: the opt-out mock records requests
 * the Score API never sees.
 */
export function targetScoringOf(rows: ScoreRow[], statuses: OptOutStatuses): TargetScoring {
  const scoring: TargetScoring = {};
  for (const row of rows) {
    const address = row.address.toLowerCase();
    const badge = optOutBadgeOf(statuses[address] ?? null);
    if (badge === 'opted_out' || badge === 'opt_out_pending') {
      scoring[address] = badge;
    } else if (row.rank !== null) {
      scoring[address] = 'scored';
    }
  }
  return scoring;
}

function scoringWarnings(delegations: PlannedDelegation[], scoring: TargetScoring): string[] {
  return delegations.flatMap(({ address }) => {
    switch (scoring[address.toLowerCase()]) {
      case 'scored':
        return [];
      case 'opted_out':
        return [
          `${address} opted out of scoring. The power you delegate to it leaves the scored set.`,
        ];
      case 'opt_out_pending':
        return [
          `${address} is opting out of scoring. The power you delegate to it leaves the scored set after the next run.`,
        ];
      default:
        return [`${address} is not scored. The power you delegate to it leaves the scored set.`];
    }
  });
}

/** Uses the pin weight, or the share of delegated power when the weight is missing. */
export function toPlannedDelegations(entries: DelegationEntry[]): PlannedDelegation[] {
  const totalPower = entries.reduce((sum, e) => sum + (e.power ?? 0), 0);
  return entries.map((e) => ({
    address: getAddress(e.address.toLowerCase()),
    bps: e.weight ?? (totalPower > 0 ? Math.round(((e.power ?? 0) / totalPower) * FULL_BPS) : 0),
  }));
}

function diffOf(current: PlannedDelegation[], next: PlannedDelegation[]): DelegationDiff {
  const currentBps = new Map(current.map((d) => [d.address, d.bps]));
  const nextAddresses = new Set(next.map((d) => d.address));
  return {
    added: next.filter((d) => !currentBps.has(d.address)),
    changed: next
      .filter((d) => currentBps.has(d.address) && currentBps.get(d.address) !== d.bps)
      .map((d) => ({ address: d.address, fromBps: currentBps.get(d.address)!, toBps: d.bps })),
    removed: current.filter((d) => !nextAddresses.has(d.address)),
  };
}

function targetErrors(target: string, delegator: string): string[] {
  if (!isAddress(target)) {
    return [`${target} is not a valid address.`];
  }
  if (target.toLowerCase() === zeroAddress) {
    return ["You can't delegate to the zero address."];
  }
  if (target.toLowerCase() === delegator.toLowerCase()) {
    return ["You can't delegate to your own address."];
  }
  return [];
}

const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** `null` when the percentage isn't a number with up to 2 decimals. */
function toBps(percent: string): number | null {
  if (!PERCENT_PATTERN.test(percent)) {
    return null;
  }
  // Rounds away float error: 33.33 * 100 is 3332.9999999999995.
  return Math.round(Number(percent) * 100);
}

function splitErrors(targets: SplitTarget[], delegator: string): string[] {
  if (targets.length > MAX_SPLIT_TARGETS) {
    return [`You can split across at most ${MAX_SPLIT_TARGETS} addresses.`];
  }
  if (targets.length < 2) {
    return ['Split across at least 2 addresses, or use All to one.'];
  }

  const errors: string[] = [];
  const addresses = targets.map((t) => t.target.trim());
  if (addresses.some((a) => a === '')) {
    errors.push('Enter an address for every row.');
  }
  errors.push(...addresses.filter((a) => a !== '').flatMap((a) => targetErrors(a, delegator)));

  const seen = new Set<string>();
  for (const address of addresses.filter(isAddress)) {
    const checksummed = getAddress(address.toLowerCase());
    if (seen.has(checksummed)) {
      errors.push(`${checksummed} appears more than once.`);
    }
    seen.add(checksummed);
  }

  const percents = targets.map((t) => t.percent.trim());
  const bps = percents.map(toBps);
  if (percents.some((p) => p === '')) {
    errors.push('Enter a percentage for every address.');
  }
  percents.forEach((p, i) => {
    if (p !== '' && bps[i] === null) {
      errors.push(`${p} is not a valid percentage. Use a number with up to 2 decimals.`);
    }
  });
  if (bps.some((b) => b === 0)) {
    errors.push('Every percentage must be above 0.');
  }
  if (bps.every((b) => b !== null && b > 0)) {
    const total = bps.reduce<number>((sum, b) => sum + b!, 0);
    if (total !== FULL_BPS) {
      errors.push(`The percentages add up to ${formatPercent(total)}, not 100%.`);
    }
  }
  return [...new Set(errors)];
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
}

/**
 * Validates a delegation form input and compares it with the current
 * delegations. The registry overwrites the whole delegation on every write.
 */
export function planDelegation({
  delegator,
  input,
  current,
  scoring,
}: PlanRequest): DelegationPlan {
  const before = toPlannedDelegations(current);

  if (input.kind === 'clear') {
    if (before.length === 0) {
      return invalid(['You have no delegation to clear.']);
    }
    return planned([], diffOf(before, []));
  }

  const targets =
    input.kind === 'split' ? input.targets : [{ target: input.target, percent: '100' }];
  const errors =
    input.kind === 'split'
      ? splitErrors(input.targets, delegator)
      : targetErrors(input.target, delegator);
  if (errors.length > 0) {
    return invalid(errors);
  }

  const delegations = targets.map((t) => ({
    address: getAddress(t.target.trim().toLowerCase()),
    bps: toBps(t.percent.trim())!,
  }));
  const diff = diffOf(before, delegations);
  if (diff.added.length + diff.changed.length + diff.removed.length === 0) {
    return invalid([
      input.kind === 'split'
        ? 'Your delegation already matches this split.'
        : `You already delegate everything to ${delegations[0].address}.`,
    ]);
  }
  return planned(delegations, diff, scoringWarnings(delegations, scoring));
}
