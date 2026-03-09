import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  ActiveProposalsQueryResponse,
  SnapshotActiveProposal,
} from '../types';

/**
 * GraphQL query to fetch active proposals with voting data
 */
const ACTIVE_PROPOSALS_QUERY = `
  query GetActiveProposals($spaceId: String!) {
    proposals(
      first: 10
      where: { space: $spaceId, state: "active", flagged: false }
      orderBy: "end"
      orderDirection: asc
    ) {
      id
      title
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
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: ACTIVE_PROPOSALS_QUERY,
        variables: { spaceId },
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot API error: ${response.status} ${response.statusText}`
      );
    }

    const result: SnapshotGraphQLResponse<ActiveProposalsQueryResponse> =
      await response.json();

    if (result.errors?.length) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    return result.data?.proposals ?? [];
  } catch (error) {
    console.error(
      `Failed to fetch active proposals for space ${spaceId}:`,
      error
    );
    return [];
  }
}
