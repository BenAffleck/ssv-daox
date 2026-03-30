import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  ActiveProposalsQueryResponse,
  SnapshotActiveProposal,
} from '../types';

/**
 * GraphQL query to fetch pending proposals (voting not yet started)
 */
const PENDING_PROPOSALS_QUERY = `
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
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PENDING_PROPOSALS_QUERY,
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
      `Failed to fetch pending proposals for space ${spaceId}:`,
      error
    );
    return [];
  }
}
