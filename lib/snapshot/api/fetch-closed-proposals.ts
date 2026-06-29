import type { SnapshotActiveProposal } from '../types';
import { executeProposalsQuery } from './execute-proposals-query';

/**
 * GraphQL query to fetch the most recent closed proposals with full voting data.
 *
 * Note: distinct from `fetchProposals` (in fetch-proposals.ts), which returns
 * only id/title/end for vote-participation. This returns the full proposal
 * shape (choices, scores, quorum, body, …) needed to render result cards.
 */
export const CLOSED_PROPOSALS_QUERY = `
  query GetClosedProposals($spaceId: String!, $limit: Int!) {
    proposals(
      first: $limit
      where: { space: $spaceId, state: "closed", flagged: false }
      orderBy: "end"
      orderDirection: desc
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
 * Fetches the most recent closed proposals from a Snapshot space with full
 * voting data (for rendering past-vote result cards).
 *
 * @param spaceId - The Snapshot space ID
 * @param limit - Max number of closed proposals to fetch
 * @returns Array of closed proposal objects (most recent first)
 */
export async function fetchClosedProposals(
  spaceId: string,
  limit: number
): Promise<SnapshotActiveProposal[]> {
  try {
    return await executeProposalsQuery(CLOSED_PROPOSALS_QUERY, { spaceId, limit });
  } catch (error) {
    console.error(
      `Failed to fetch closed proposals for space ${spaceId}:`,
      error
    );
    return [];
  }
}
