import type { VotingPowerData } from '@/lib/gnosis/types';

export interface Delegate {
  publicAddress: string;
  name: string;
  ensName: string;
  karmaScore: number;
  delegatedTokens: number;
  delegatorCount: number;
  status: string;

  // Computed
  rank: number;
  displayName: string;
  isAlreadyDelegated: boolean;
  isProfileComplete: boolean;

  // Eligibility
  isVIP: boolean;
  isOnCommittee: boolean;
  isOnFixedList: boolean;
  isEligible: boolean;
  committeeNames: string[];
  fixedListNames: string[];

  // Programs
  delegationPrograms: string[];

  // Vote participation
  voteParticipationRate: number;

  // Voting power from Gnosis delegation API
  votingPowerData: VotingPowerData | null;
}

export interface DelegationProgram {
  id: string;
  name: string;
  displayName: string;
  availableSeats: number;
  requiresEligibility: boolean;
}

export interface KarmaDelegateCSV {
  publicAddress: string;
  name: string;
  ensName: string;
  karmaScore: string;
  delegatedTokens: string;
  delegatorCount: string;
  status: string;
  forumHandle: string;
  discordUsername: string;
  // Additional fields from CSV (not all used)
  [key: string]: string;
}

export interface EligibilityLists {
  vipWallets: Set<string>;
  grantsCommittee: Set<string>;
  operatorCommittee: Set<string>;
  multisigCommittee: Set<string>;
  verifiedOperators: Set<string>;
  grantees: Set<string>;
  professional: Set<string>;
  alreadyDelegated: Set<string>;
}

export interface EligibilityResult {
  isEligible: boolean;
  isVIP: boolean;
  isOnCommittee: boolean;
  isOnFixedList: boolean;
  committeeNames: string[];
  fixedListNames: string[];
}
