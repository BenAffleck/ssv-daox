import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';

import type { ProposalSource, SourceProposal } from './features';

const PROPOSAL_QUERY = `
  query GetProposal($id: String!) {
    proposal(id: $id) {
      id
      title
      body
      choices
      end
      link
      flagged
      space { id }
    }
  }
`;

interface ProposalQueryResponse {
  data?: {
    proposal: (SourceProposal & { flagged: boolean | null; space: { id: string } | null }) | null;
  };
  errors?: Array<{ message: string }>;
}

/**
 * The proposals of `spaceIds`, looked up by id. Proposals of other spaces and
 * flagged ones are not found.
 */
export function createSnapshotProposalSource({
  spaceIds,
  fetch,
}: {
  spaceIds: string[];
  fetch: typeof globalThis.fetch;
}): ProposalSource {
  const allowed = new Set(spaceIds.filter(Boolean).map((id) => id.toLowerCase()));

  return {
    async find(id) {
      if (allowed.size === 0) {
        return null;
      }
      const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: PROPOSAL_QUERY, variables: { id } }),
        next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
      });
      if (!response.ok) {
        throw new Error(`Snapshot API error: ${response.status} ${response.statusText}`);
      }
      const result: ProposalQueryResponse = await response.json();
      if (result.errors?.length) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      const proposal = result.data?.proposal;
      if (!proposal || proposal.flagged || !allowed.has(proposal.space?.id.toLowerCase() ?? '')) {
        return null;
      }
      const { title, body, choices, end, link } = proposal;
      return { id: proposal.id, title, body, choices, end, link };
    },
  };
}
