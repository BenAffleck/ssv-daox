import { SNAPSHOT_CONFIG } from '../config';
import type { VoteParticipationMap } from '../types';
import { fetchProposals } from './fetch-proposals';
import { fetchVotes } from './fetch-votes';

/**
 * Fetches vote participation data for all voters on recent proposals
 *
 * @param spaceId - The Snapshot space ID (e.g., 'ssv.dao.eth')
 * @returns Map of voter addresses to their participation rate (0-100)
 */
export async function fetchVoteParticipation(
  spaceId: string
): Promise<VoteParticipationMap> {
  // Fetch recent closed proposals
  const proposals = await fetchProposals(
    spaceId,
    SNAPSHOT_CONFIG.voteParticipation.proposalCount
  );

  if (proposals.length === 0) {
    console.warn(`No closed proposals found for space: ${spaceId}`);
    return {};
  }

  // Fetch all votes for those proposals
  const proposalIds = proposals.map((p) => p.id);
  const votes = await fetchVotes(proposalIds);

  // Build voter participation map: address -> Set of proposal IDs
  const voterProposals = new Map<string, Set<string>>();

  for (const vote of votes) {
    const address = vote.voter.toLowerCase();
    if (!voterProposals.has(address)) {
      voterProposals.set(address, new Set());
    }
    voterProposals.get(address)!.add(vote.proposal.id);
  }

  // Calculate participation rate for each voter
  const totalProposals = proposals.length;
  const participationMap: VoteParticipationMap = {};

  for (const [address, proposalSet] of voterProposals) {
    const votedCount = proposalSet.size;
    participationMap[address] = Math.round(
      (votedCount / totalProposals) * 100
    );
  }

  return participationMap;
}
