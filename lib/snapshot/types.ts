/**
 * Type definitions for Snapshot.org GraphQL API
 * Snapshot Hub API: https://hub.snapshot.org/graphql
 */

/**
 * GraphQL response structure from Snapshot Hub API
 */
export interface SnapshotGraphQLResponse<T> {
  data: T | null;
  errors?: SnapshotGraphQLError[];
}

/**
 * GraphQL error format
 */
export interface SnapshotGraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
}

/**
 * Space query response
 */
export interface SpaceQueryResponse {
  space: SnapshotSpace | null;
}

/**
 * Voting strategy for a Snapshot space
 */
export interface SnapshotStrategy {
  network: string;
  params: {
    symbol?: string;
    addresses?: string[];
    [key: string]: any;
  };
}

/**
 * Snapshot space object
 */
export interface SnapshotSpace {
  id: string;
  name: string;
  strategies: SnapshotStrategy[];
}

/**
 * Committee type enum for type-safe committee identification
 */
export enum CommitteeType {
  GRANTS = 'grantsCommittee',
  OPERATOR = 'operatorCommittee',
  MULTISIG = 'multisigCommittee',
}

/**
 * Configuration for space-to-committee mapping
 */
export interface CommitteeSpaceConfig {
  type: CommitteeType;
  spaceId: string;
  displayName: string;
}

/**
 * Result of fetching all committee members
 */
export interface CommitteeMembersResult {
  grantsCommittee: string[];
  operatorCommittee: string[];
  multisigCommittee: string[];
  fetchedAt: Date;
}

/**
 * Snapshot delegation object
 * Represents a delegation relationship where delegator delegates to delegate
 */
export interface SnapshotDelegation {
  id: string;
  delegator: string;
  delegate: string;
  space: string;
}

/**
 * Response from delegations query
 */
export interface DelegationsQueryResponse {
  delegations: SnapshotDelegation[];
}

/**
 * Snapshot proposal object (basic - for vote participation)
 */
export interface SnapshotProposal {
  id: string;
  title: string;
  end: number;
  state: string;
}

/**
 * Response from proposals query
 */
export interface ProposalsQueryResponse {
  proposals: SnapshotProposal[];
}

/**
 * Snapshot proposal with full details for timeline display
 */
export interface SnapshotTimelineProposal {
  id: string;
  title: string;
  body: string;
  created: number;
  start: number;
  end: number;
  state: string;
  link: string;
}

/**
 * Response from timeline proposals query
 */
export interface TimelineProposalsQueryResponse {
  proposals: SnapshotTimelineProposal[];
}

/**
 * Snapshot vote object
 */
export interface SnapshotVote {
  id: string;
  voter: string;
  proposal: {
    id: string;
  };
}

/**
 * Response from votes query
 */
export interface VotesQueryResponse {
  votes: SnapshotVote[];
}

/**
 * Map of voter addresses to their vote participation rate (0-100)
 */
export type VoteParticipationMap = { [address: string]: number };

/**
 * Snapshot proposal with voting data for active votes display
 */
export interface SnapshotActiveProposal {
  id: string;
  title: string;
  body: string;
  start: number;
  end: number;
  state: string;
  choices: string[];
  scores: number[];
  scores_total: number;
  votes: number;
  quorum: number;
  type: string;
  link: string;
}

/**
 * Response from active proposals query
 */
export interface ActiveProposalsQueryResponse {
  proposals: SnapshotActiveProposal[];
}

/**
 * Voting model of a governance space.
 * - `token`: token-weighted vote with quorum (the main space)
 * - `member`: committee member vote via whitelist strategy, no quorum
 */
export type GovernanceVoteType = 'token' | 'member';

/**
 * A configured SSV governance Snapshot space for the "Votes at a glance" view.
 */
export interface GovernanceSpace {
  /** Stable key used in URLs and filter state (e.g. 'main', 'oc') */
  key: string;
  /** Short label shown on badges/chips (e.g. 'Main', 'OC') */
  label: string;
  /** Snapshot space id (e.g. 'mainnet.ssvnetwork.eth') */
  spaceId: string;
  /** Voting model — drives quorum vs. "No quorum" display */
  voteType: GovernanceVoteType;
}

/**
 * An active/pending proposal tagged with the space it belongs to.
 */
export interface GovernanceProposal extends SnapshotActiveProposal {
  space: GovernanceSpace;
}

/**
 * Result of aggregating governance proposals across all configured spaces.
 * `failedSpaces` holds the labels of spaces whose fetch failed, so the UI can
 * distinguish an outage from a genuinely empty space.
 */
export interface GovernanceProposalsResult {
  proposals: GovernanceProposal[];
  failedSpaces: string[];
}
