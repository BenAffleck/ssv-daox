import { SNAPSHOT_CONFIG } from '../config';
import type {
  SnapshotGraphQLResponse,
  ActiveProposalsQueryResponse,
  SnapshotActiveProposal,
} from '../types';

/**
 * Executes a proposals GraphQL query against the Snapshot Hub API.
 *
 * Unlike the per-feature fetchers (which swallow errors and return `[]` for
 * graceful degradation), this helper **throws** on HTTP or GraphQL errors so
 * callers that need to distinguish a failure from a genuinely empty result
 * (e.g. the cross-space governance aggregator) can detect it.
 *
 * @param query - GraphQL query string returning a `proposals` field
 * @param variables - Query variables (e.g. `{ spaceId }`)
 * @returns The proposals array (full active-proposal shape)
 * @throws Error on network failure or GraphQL errors
 */
export async function executeProposalsQuery(
  query: string,
  variables: Record<string, unknown>
): Promise<SnapshotActiveProposal[]> {
  const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
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
}
