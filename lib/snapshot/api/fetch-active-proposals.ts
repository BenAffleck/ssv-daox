import type { SnapshotActiveProposal } from '../types';
import { executeProposalsQuery } from './execute-proposals-query';

/**
 * GraphQL query to fetch active proposals with voting data
 */
export const ACTIVE_PROPOSALS_QUERY = `
  query GetActiveProposals($spaceId: String!) {
    proposals(
      first: 10
      where: { space: $spaceId, state: "active", flagged: false }
      orderBy: "end"
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
 * Fetches currently active proposals from a Snapshot space
 * Includes voting scores, quorum, and choice data for progress display
 *
 * @param spaceId - The Snapshot space ID (e.g., 'ssv.dao.eth')
 * @returns Array of active proposal objects with voting data
 */
export async function fetchActiveProposals(
  spaceId: string
): Promise<SnapshotActiveProposal[]> {
  try {
    return await executeProposalsQuery(ACTIVE_PROPOSALS_QUERY, { spaceId });
  } catch (error) {
    console.error(
      `Failed to fetch active proposals for space ${spaceId}:`,
      error
    );
    return [];
  }
}
