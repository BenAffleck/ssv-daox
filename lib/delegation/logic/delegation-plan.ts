import { getAddress, zeroAddress, type Address } from 'viem';

import type { DelegationEntry } from '@/lib/gnosis/types';

import { isAddress } from './address-overview';

const FULL_BPS = 10000;

/** `target` is an address; ENS names are resolved before planning. */
export type DelegationInput = { kind: 'all-to-one'; target: string } | { kind: 'clear' };

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
}

const EMPTY_DIFF: DelegationDiff = { added: [], changed: [], removed: [] };

function invalid(errors: string[]): DelegationPlan {
  return { delegations: [], diff: EMPTY_DIFF, droppedDelegates: [], warnings: [], errors };
}

function planned(delegations: PlannedDelegation[], diff: DelegationDiff): DelegationPlan {
  return {
    delegations,
    diff,
    droppedDelegates: diff.removed.map((d) => d.address),
    warnings: [],
    errors: [],
  };
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

/**
 * Validates a delegation form input and compares it with the current
 * delegations. The registry overwrites the whole delegation on every write.
 */
export function planDelegation({ delegator, input, current }: PlanRequest): DelegationPlan {
  const before = toPlannedDelegations(current);

  if (input.kind === 'clear') {
    if (before.length === 0) {
      return invalid(['You have no delegation to clear.']);
    }
    return planned([], diffOf(before, []));
  }

  const errors = targetErrors(input.target, delegator);
  if (errors.length > 0) {
    return invalid(errors);
  }

  const delegations = [{ address: getAddress(input.target.toLowerCase()), bps: FULL_BPS }];
  const diff = diffOf(before, delegations);
  if (diff.added.length + diff.changed.length + diff.removed.length === 0) {
    return invalid([`You already delegate everything to ${delegations[0].address}.`]);
  }
  return planned(delegations, diff);
}
