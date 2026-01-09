import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  DelegationsQueryResponse,
} from '../types';

/**
 * GraphQL query to fetch delegations FROM specific source addresses
 * Returns all delegation relationships where delegator is one of the source addresses
 *
 * Note: This queries The Graph subgraph, not the Snapshot Hub API
 */
const DELEGATIONS_QUERY = `
  query GetDelegationsFromSources($delegators: [String!]!, $space: String) {
    delegations(
      first: 1000
      where: {
        delegator_in: $delegators
        space: $space
      }
    ) {
      id
      delegator
      delegate
      space
    }
  }
`;

/**
 * Fetches addresses that receive delegation from specified source addresses
 *
 * Use Case: Find who DAO treasury/multisig addresses delegate to.
 * These recipients should be marked as "already delegated" in the delegates list.
 *
 * @param sourceAddresses - Array of delegator addresses to query (e.g., DAO treasury, multisigs)
 * @returns Array of delegate addresses that receive delegation (normalized to lowercase)
 * @throws Error if API request fails
 *
 * @example
 * ```typescript
 * const sourceAddresses = ['0xABCD...', '0xEFGH...'];
 * const recipients = await fetchDelegationRecipients(sourceAddresses);
 * // recipients = ['0x1234...', '0x5678...']
 * ```
 */
export async function fetchDelegationRecipients(
  sourceAddresses: string[]
): Promise<string[]> {
  // If no source addresses configured, return empty array
  if (!sourceAddresses || sourceAddresses.length === 0) {
    console.warn('No delegation source addresses configured');
    return [];
  }

  // Get subgraph URL (checks for API key)
  const subgraphUrl = SNAPSHOT_CONFIG.getSubgraphUrl();

  // Check if The Graph API key is configured
  if (!subgraphUrl) {
    console.warn(
      'THEGRAPH_API_KEY not configured. Cannot fetch delegation data. ' +
      'Get a free API key at https://thegraph.com/studio/apikeys/'
    );
    return [];
  }

  try {
    const variables: any = {
      delegators: sourceAddresses.map((addr) => addr.toLowerCase()),
    };

    // Add space filter if configured (empty string means all spaces)
    if (SNAPSHOT_CONFIG.delegation.spaceFilter) {
      variables.space = SNAPSHOT_CONFIG.delegation.spaceFilter;
    }

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELEGATIONS_QUERY,
        variables,
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot API error: ${response.status} ${response.statusText}`
      );
    }

    const result: SnapshotGraphQLResponse<DelegationsQueryResponse> =
      await response.json();

    // Check for GraphQL errors
    if (result.errors?.length) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    // Extract delegations from response
    const delegations = result.data?.delegations || [];

    if (delegations.length === 0) {
      console.info(
        `No active delegations found from ${sourceAddresses.length} source address(es)`
      );
      return [];
    }

    // Extract unique delegate addresses (recipients)
    const uniqueDelegates = new Set<string>();
    delegations.forEach((delegation) => {
      if (delegation.delegate) {
        uniqueDelegates.add(delegation.delegate.toLowerCase());
      }
    });

    const recipients = Array.from(uniqueDelegates);
    console.info(
      `Found ${recipients.length} delegation recipient(s) from ${sourceAddresses.length} source address(es)`
    );

    return recipients;
  } catch (error) {
    console.error(`Failed to fetch delegation recipients:`, error);
    throw error;
  }
}

/**
 * Fetches delegation recipients using configured source addresses from environment
 *
 * This is a convenience function that reads source addresses from SNAPSHOT_CONFIG.
 * Returns empty array if SNAPSHOT_DELEGATION_SOURCE_ADDRESSES is not configured.
 *
 * @returns Array of delegate addresses that receive delegation (normalized to lowercase)
 * @throws Error if API request fails (but not if configuration is missing)
 *
 * @example
 * ```typescript
 * // In .env: SNAPSHOT_DELEGATION_SOURCE_ADDRESSES=0xABCD...,0xEFGH...
 * const recipients = await fetchConfiguredDelegationRecipients();
 * // recipients = ['0x1234...', '0x5678...']
 * ```
 */
export async function fetchConfiguredDelegationRecipients(): Promise<
  string[]
> {
  const sourceAddresses = SNAPSHOT_CONFIG.delegation.sourceAddresses;

  if (sourceAddresses.length === 0) {
    console.warn(
      'SNAPSHOT_DELEGATION_SOURCE_ADDRESSES not configured. Skipping delegation fetch.'
    );
    return [];
  }

  return fetchDelegationRecipients(sourceAddresses);
}
