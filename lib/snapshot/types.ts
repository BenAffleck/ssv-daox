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
