import type { Cohort, Identity, ScoreRow } from '@/lib/dao-delegates/types';

/**
 * - `unclaimed`: the identity has no HighSignal username.
 * - `claimed_pending`: claimed, but the Score API has no community pillar for it yet.
 * - `claimed_scored`: claimed and the community pillar is scored.
 */
export type ClaimStatus = 'unclaimed' | 'claimed_pending' | 'claimed_scored';

export interface OverviewAddress {
  address: string;
  ensName: string | null;
  isRequested: boolean;
  // Score fields are `null` for an address without a leaderboard row.
  rank: number | null;
  score: number | null;
  cohort: Cohort | null;
  allocatedPower: number | null;
  claimStatus: ClaimStatus;
}

export interface AddressOverview {
  /** The requested address first, then its siblings in identity order. */
  addresses: OverviewAddress[];
}

export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function claimStatusOf(identity: Identity, row: ScoreRow | undefined): ClaimStatus {
  if (!identity.hs_username) {
    return 'unclaimed';
  }
  const hasCommunity = row !== undefined && row.community !== null && !row.missing_community;
  return hasCommunity ? 'claimed_scored' : 'claimed_pending';
}

/**
 * Resolves an address and its HighSignal identity siblings from leaderboard rows.
 * Returns `null` when neither a row nor an identity has the address.
 */
export function buildAddressOverview(address: string, rows: ScoreRow[]): AddressOverview | null {
  const requestedAddress = address.toLowerCase();
  const rowByAddress = new Map(rows.map((r) => [r.address.toLowerCase(), r]));

  const lists = (i: Identity) =>
    i.addresses.some((a) => a.address.toLowerCase() === requestedAddress);
  const requestedRow = rowByAddress.get(requestedAddress);
  const identity = requestedRow?.identity ?? rows.map((r) => r.identity).find(lists);
  if (!identity) {
    return null;
  }

  // A scored row's own address can be missing from its identity's list.
  const addresses =
    requestedRow && !lists(identity)
      ? [{ address: requestedRow.address, ens_name: null }, ...identity.addresses]
      : identity.addresses;

  const entries = addresses.map(({ address: sibling, ens_name }) => {
    const row = rowByAddress.get(sibling.toLowerCase());
    return {
      address: sibling,
      ensName: ens_name,
      isRequested: sibling.toLowerCase() === requestedAddress,
      rank: row?.rank ?? null,
      score: row?.score ?? null,
      cohort: row?.cohort ?? null,
      allocatedPower: row?.power ?? null,
      claimStatus: claimStatusOf(identity, row),
    };
  });

  const requested = entries.filter((e) => e.isRequested);
  const siblings = entries.filter((e) => !e.isRequested);
  return { addresses: [...requested, ...siblings] };
}

/**
 * - `sibling`: the connected account shares the selected address's identity.
 * - `other`: the connected account is outside that identity.
 */
export type AccountSwitchPrompt = 'sibling' | 'other';

/**
 * Whether the user must switch wallet accounts before signing for `selected`.
 * Returns `null` when no wallet is connected or it already is `selected`.
 */
export function accountSwitchPrompt(
  selected: string,
  connected: string | undefined,
  identityAddresses: string[],
): AccountSwitchPrompt | null {
  if (!connected || connected.toLowerCase() === selected.toLowerCase()) {
    return null;
  }
  const isSibling = identityAddresses.some((a) => a.toLowerCase() === connected.toLowerCase());
  return isSibling ? 'sibling' : 'other';
}
