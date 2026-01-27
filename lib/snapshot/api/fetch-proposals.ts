import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  ProposalsQueryResponse,
  SnapshotProposal,
} from '../types';

/**
 * GraphQL query to fetch latest closed proposals from a space
 */
const PROPOSALS_QUERY = `
  query GetLatestProposals($spaceId: String!, $limit: Int!) {
    proposals(
      first: $limit
      where: { space: $spaceId, state: "closed" }
      orderBy: "end"
      orderDirection: desc
    ) {
      id
      title
      end
    }
  }
`;

/**
 * Fetches the latest closed proposals from a Snapshot space
 *
 * @param spaceId - The Snapshot space ID (e.g., 'ssv.dao.eth')
 * @param limit - Number of proposals to fetch (default: 5)
 * @returns Array of proposal objects
 * @throws Error if the API request fails
 */
export async function fetchProposals(
  spaceId: string,
  limit: number = SNAPSHOT_CONFIG.voteParticipation.proposalCount
): Promise<SnapshotProposal[]> {
  try {
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PROPOSALS_QUERY,
        variables: { spaceId, limit },
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot API error: ${response.status} ${response.statusText}`
      );
    }

    const result: SnapshotGraphQLResponse<ProposalsQueryResponse> =
      await response.json();

    // Check for GraphQL errors
    if (result.errors?.length) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    return result.data?.proposals ?? [];
  } catch (error) {
    console.error(
      `Failed to fetch proposals for space ${spaceId}:`,
      error
    );
    throw error;
  }
}
