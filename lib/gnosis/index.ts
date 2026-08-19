/**
 * Gnosis Guild Delegation API module
 * Provides voting power data for SSV Network delegates
 */

export { fetchVotingPower } from './api/fetch-voting-power';
export { toVotingPowerData } from './logic/transform-voting-power';
export { GNOSIS_CONFIG } from './config';
export type {
  DelegationEntry,
  GnosisDelegationResponse,
  VotingPowerData,
  VotingPowerMap,
} from './types';
