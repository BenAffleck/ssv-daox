import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  VotesQueryResponse,
  SnapshotVote,
} from '../types';

/**
 * Maximum votes per page (Snapshot API limit is 1000)
 */
const VOTES_PAGE_SIZE = 1000;

/**
 * GraphQL query to fetch votes for multiple proposals with pagination
 */
const VOTES_QUERY = `
  query GetProposalVotes($proposalIds: [String!]!, $first: Int!, $skip: Int!) {
    votes(first: $first, skip: $skip, where: { proposal_in: $proposalIds }) {
      id
      voter
      proposal {
        id
      }
    }
  }
`;

/**
 * Fetches a single page of votes
 */
async function fetchVotesPage(
  proposalIds: string[],
  skip: number
): Promise<SnapshotVote[]> {
  const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: VOTES_QUERY,
      variables: { proposalIds, first: VOTES_PAGE_SIZE, skip },
    }),
    next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
  });

  if (!response.ok) {
    throw new Error(
      `Snapshot API error: ${response.status} ${response.statusText}`
    );
  }

  const result: SnapshotGraphQLResponse<VotesQueryResponse> =
    await response.json();

  // Check for GraphQL errors
  if (result.errors?.length) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }

  return result.data?.votes ?? [];
}

/**
 * Fetches all votes for the given proposal IDs using pagination
 *
 * @param proposalIds - Array of proposal IDs to fetch votes for
 * @returns Array of vote objects
 * @throws Error if the API request fails
 */
export async function fetchVotes(
  proposalIds: string[]
): Promise<SnapshotVote[]> {
  // Return empty array for empty input
  if (proposalIds.length === 0) {
    return [];
  }

  try {
    const allVotes: SnapshotVote[] = [];
    let skip = 0;
    let hasMore = true;

    // Paginate through all votes
    while (hasMore) {
      const pageVotes = await fetchVotesPage(proposalIds, skip);
      allVotes.push(...pageVotes);

      // If we got fewer than the page size, we've reached the end
      if (pageVotes.length < VOTES_PAGE_SIZE) {
        hasMore = false;
      } else {
        skip += VOTES_PAGE_SIZE;
      }
    }

    return allVotes;
  } catch (error) {
    console.error('Failed to fetch votes:', error);
    throw error;
  }
}
