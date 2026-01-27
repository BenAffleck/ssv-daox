import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  TimelineProposalsQueryResponse,
  SnapshotTimelineProposal,
} from '../types';

/**
 * GraphQL query to fetch proposals with full details for timeline display
 */
const TIMELINE_PROPOSALS_QUERY = `
  query GetTimelineProposals($spaceId: String!, $limit: Int!) {
    proposals(
      first: $limit
      where: { space: $spaceId }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      title
      body
      created
      start
      end
      state
      link
    }
  }
`;

/**
 * Default number of proposals to fetch for timeline
 */
const DEFAULT_PROPOSAL_LIMIT = 50;

/**
 * Fetches proposals from a Snapshot space for timeline display
 * Includes both active and recently closed proposals
 *
 * @param spaceId - The Snapshot space ID (e.g., 'mainnet.ssvnetwork.eth')
 * @param limit - Number of proposals to fetch (default: 50)
 * @returns Array of proposal objects with full details
 */
export async function fetchTimelineProposals(
  spaceId: string,
  limit: number = DEFAULT_PROPOSAL_LIMIT
): Promise<SnapshotTimelineProposal[]> {
  try {
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: TIMELINE_PROPOSALS_QUERY,
        variables: { spaceId, limit },
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot API error: ${response.status} ${response.statusText}`
      );
    }

    const result: SnapshotGraphQLResponse<TimelineProposalsQueryResponse> =
      await response.json();

    // Check for GraphQL errors
    if (result.errors?.length) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    return result.data?.proposals ?? [];
  } catch (error) {
    console.error(
      `Failed to fetch timeline proposals for space ${spaceId}:`,
      error
    );
    // Return empty array instead of throwing to allow other sources to work
    return [];
  }
}
