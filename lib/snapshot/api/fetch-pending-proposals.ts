import type { SnapshotActiveProposal } from '../types';
import { executeProposalsQuery } from './execute-proposals-query';

/**
 * GraphQL query to fetch pending proposals (voting not yet started)
 */
export const PENDING_PROPOSALS_QUERY = `
  query GetPendingProposals($spaceId: String!) {
    proposals(
      first: 10
      where: { space: $spaceId, state: "pending", flagged: false }
      orderBy: "start"
      orderDirection: asc
    ) {
      id
      title
      body
      start
      end
      state
      choices
      scores
      scores_total
      votes
      quorum
      type
      link
    }
  }
`;

/**
 * Fetches pending proposals from a Snapshot space
 * These are proposals where voting has not yet started
 *
 * @param spaceId - The Snapshot space ID (e.g., 'ssv.dao.eth')
 * @returns Array of pending proposal objects
 */
export async function fetchPendingProposals(
  spaceId: string
): Promise<SnapshotActiveProposal[]> {
  try {
    return await executeProposalsQuery(PENDING_PROPOSALS_QUERY, { spaceId });
  } catch (error) {
    console.error(
      `Failed to fetch pending proposals for space ${spaceId}:`,
      error
    );
    return [];
  }
}
