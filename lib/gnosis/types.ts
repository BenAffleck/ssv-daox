/**
 * Type definitions for Gnosis Guild Delegation API
 * API: https://delegate-api.gnosisguild.org
 */

/**
 * A single incoming delegation edge as returned by the pin endpoint
 */
export interface GnosisDelegatorTreeNode {
  delegator: string;
  expiration?: number;
  weight?: number;
  delegatedPower: string | number;
  parents?: unknown[];
}

/**
 * A single outgoing delegation edge as returned by the pin endpoint
 */
export interface GnosisDelegateTreeNode {
  delegate: string;
  expiration?: number;
  weight?: number;
  delegatedPower: string | number;
  children?: unknown[];
}

/**
 * Response from the Gnosis delegation API pin endpoint
 */
export interface GnosisDelegationResponse {
  votingPower: string;
  incomingPower: string;
  outgoingPower: string;
  delegators: string[];
  delegates?: string[];
  delegatorTree?: GnosisDelegatorTreeNode[];
  delegateTree?: GnosisDelegateTreeNode[];
  percentOfVotingPower: string;
  blockNumber: string;
}

/**
 * A counterparty address paired with the absolute voting power delegated
 * across that edge (in SSV + cSSV)
 */
export interface DelegationEntry {
  address: string;
  /** Absolute delegated power, or null when the API returned the edge without an amount */
  power: number | null;
  /** The delegator's share across this edge in basis points, when the API returns it */
  weight?: number;
}

/**
 * Processed voting power data for a delegate
 */
export interface VotingPowerData {
  votingPower: number;
  incomingPower: number;
  outgoingPower: number;
  delegatorCount: number;
  delegators: string[];
  /** Addresses delegating power in, with the amount each contributes */
  incomingDelegations: DelegationEntry[];
  /** Addresses this delegate delegates power out to, with the amount each receives */
  outgoingDelegations: DelegationEntry[];
  percentOfVotingPower: number;
  blockNumber: string;
}

/**
 * Map of delegate addresses to their voting power data
 * Keys are lowercase addresses
 */
export type VotingPowerMap = { [address: string]: VotingPowerData };
