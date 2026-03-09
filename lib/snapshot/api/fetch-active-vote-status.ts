import type { SnapshotActiveProposal } from '../types';
import { fetchActiveProposals } from './fetch-active-proposals';
import { fetchVotes } from './fetch-votes';

export interface ActiveVoteData {
  proposals: SnapshotActiveProposal[];
  voterMap: Map<string, Set<string>>;
}

/**
 * Fetches active proposals and builds a voter lookup map
 * The voterMap allows O(1) lookup: "has address X voted on proposal Y?"
 *
 * @param spaceId - The Snapshot space ID
 * @returns Active proposals and a map of address → Set of proposal IDs they voted on
 */
export async function fetchActiveVoteStatus(
  spaceId: string
): Promise<ActiveVoteData> {
  const proposals = await fetchActiveProposals(spaceId);

  if (proposals.length === 0) {
    return { proposals: [], voterMap: new Map() };
  }

  const proposalIds = proposals.map((p) => p.id);
  const votes = await fetchVotes(proposalIds);

  // Build voter map: lowercase address → Set of proposal IDs voted on
  const voterMap = new Map<string, Set<string>>();

  for (const vote of votes) {
    const address = vote.voter.toLowerCase();
    if (!voterMap.has(address)) {
      voterMap.set(address, new Set());
    }
    voterMap.get(address)!.add(vote.proposal.id);
  }

  return { proposals, voterMap };
}
