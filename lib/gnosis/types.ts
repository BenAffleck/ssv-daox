/**
 * Type definitions for Gnosis Guild Delegation API
 * API: https://delegate-api.gnosisguild.org
 */

/**
 * Response from the Gnosis delegation API pin endpoint
 */
export interface GnosisDelegationResponse {
  votingPower: string;
  incomingPower: string;
  outgoingPower: string;
  delegators: string[];
  percentOfVotingPower: string;
  blockNumber: string;
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
  percentOfVotingPower: number;
  blockNumber: string;
}

/**
 * Map of delegate addresses to their voting power data
 * Keys are lowercase addresses
 */
export type VotingPowerMap = { [address: string]: VotingPowerData };
