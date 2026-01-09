import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  SpaceQueryResponse,
} from '../types';

/**
 * GraphQL query to fetch space strategies with member addresses
 * Committee members are stored in the first strategy's params.addresses
 */
const SPACE_STRATEGIES_QUERY = `
  query GetSpaceStrategies($spaceId: String!) {
    space(id: $spaceId) {
      id
      name
      strategies {
        network
        params
      }
    }
  }
`;

/**
 * Fetches committee member addresses from a Snapshot space's whitelist strategy
 *
 * @param spaceId - The Snapshot space ID (e.g., 'msig.ssvnetwork.eth')
 * @returns Array of member addresses (normalized to lowercase)
 * @throws Error if the API request fails
 */
export async function fetchSpaceMembers(spaceId: string): Promise<string[]> {
  try {
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: SPACE_STRATEGIES_QUERY,
        variables: { spaceId },
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot API error: ${response.status} ${response.statusText}`
      );
    }

    const result: SnapshotGraphQLResponse<SpaceQueryResponse> =
      await response.json();

    // Check for GraphQL errors
    if (result.errors?.length) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    // Check for null space (invalid space ID)
    if (!result.data?.space) {
      console.warn(`Snapshot space not found: ${spaceId}`);
      return [];
    }

    // Extract addresses from the first strategy's params
    const space = result.data.space;
    if (!space.strategies || space.strategies.length === 0) {
      console.warn(`No strategies found for space: ${spaceId}`);
      return [];
    }

    const firstStrategy = space.strategies[0];
    const addresses = firstStrategy.params?.addresses;

    if (!addresses || !Array.isArray(addresses)) {
      console.warn(
        `No addresses found in strategy params for space: ${spaceId}`
      );
      return [];
    }

    // Normalize addresses to lowercase for consistent comparison
    return addresses.map((addr) => addr.toLowerCase());
  } catch (error) {
    console.error(
      `Failed to fetch Snapshot space members for ${spaceId}:`,
      error
    );
    throw error;
  }
}
