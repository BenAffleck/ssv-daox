import type { VotingPowerData } from '@/lib/gnosis/types';

export type Cohort =
  'ssvCommunity' | 'verifiedOperators' | 'professional' | 'grantRecipients' | 'ethCommunities';

/**
 * A sub-score. `missing` means the pillar is live but had no data for this
 * delegate; the API then scores it 0 and it MUST be shown as "n/a".
 */
export interface PillarScore {
  score: number;
  missing: boolean;
}

export type PillarKey = 'community' | 'holdings' | 'votes';

export interface Delegate {
  publicAddress: string;
  /** Not unique across rows. */
  displayName: string;
  /** Shared by every address of one person. */
  identityId: string;
  /** ENS reverse record of this address. */
  ensName: string | null;
  /** Identity-level handles, current rather than as of the run. */
  forumHandle: string | null;
  discordHandle: string | null;

  // Delegate Score API
  /** `null` when unscored. */
  rank: number | null;
  /** 0 to 100, unrounded. `null` when no pillar is live. */
  score: number | null;
  /** `null` entries are pillars that are not live in this run. */
  pillars: Record<PillarKey, PillarScore | null>;
  cohort: Cohort | null;
  /** Voting power the run allocates to the delegate. */
  allocatedPower: number | null;

  // Computed
  isAlreadyDelegated: boolean;

  // Eligibility
  isOnCommittee: boolean;
  committeeNames: string[];

  // Vote participation
  voteParticipationRate: number;
  activeVoteStatus: { proposalId: string; title: string; hasVoted: boolean; end: number }[];

  // Voting power from Gnosis delegation API
  votingPowerData: VotingPowerData | null;
}

/** A leaderboard row as the Delegate Score API returns it. */
export interface ScoreRow {
  address: string;
  display_name: string;
  rank: number | null;
  score: number | null;
  community: number | null;
  holdings: number | null;
  votes: number | null;
  missing_community: boolean;
  missing_holdings: boolean;
  missing_votes: boolean;
  twab: number | null;
  twab_days: number | null;
  community_raw: number | null;
  voted_count: number | null;
  proposal_count: number | null;
  hs_rank: number | null;
  identity: Identity;
  cohort: Cohort | null;
  power: number | null;
}

/** The person an address belongs to, as linked on HighSignal. */
export interface Identity {
  id: string;
  hs_username: string | null;
  forum_handle: string | null;
  discord_handle: string | null;
  addresses: { address: string; ens_name: string | null }[];
}

/** The run a response was read from. */
export interface RunRef {
  runId: number;
  asOf: string;
}

export interface Leaderboard extends RunRef {
  rows: ScoreRow[];
}

export interface ScoreHealth {
  status: 'ok' | 'stale' | 'no data';
  run_id: number | null;
  as_of: string | null;
  latest_published_as_of: string | null;
  age_hours: number | null;
}

export interface EligibilityLists {
  grantsCommittee: Set<string>;
  operatorCommittee: Set<string>;
  multisigCommittee: Set<string>;
  alreadyDelegated: Set<string>;
}
