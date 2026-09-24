import type { VotingPowerMap } from '@/lib/gnosis/types';
import type { ActiveVoteData } from '@/lib/snapshot/api/fetch-active-vote-status';
import type { VoteParticipationMap } from '@/lib/snapshot/types';

import { committeeNamesOf, isAlreadyDelegated } from '../eligibility/checker';
import { Delegate, EligibilityLists, PillarScore, ScoreRow } from '../types';

function toPillar(score: number | null, missing: boolean): PillarScore | null {
  return score === null ? null : { score, missing };
}

/**
 * Transforms Delegate Score API rows into Delegate objects.
 * Rows arrive in rank order and keep it.
 */
export function transformDelegates(
  rows: ScoreRow[],
  lists: EligibilityLists,
  voteParticipation?: VoteParticipationMap,
  votingPower?: VotingPowerMap,
  activeVoteData?: ActiveVoteData,
): Delegate[] {
  return rows.map((row) => {
    const address = row.address;
    const { identity } = row;
    const committeeNames = committeeNamesOf(address, lists);

    const activeVoteStatus = activeVoteData
      ? activeVoteData.proposals.map((p) => ({
          proposalId: p.id,
          title: p.title,
          hasVoted: activeVoteData.voterMap.get(address)?.has(p.id) ?? false,
          end: p.end,
        }))
      : [];

    return {
      publicAddress: address,
      displayName: row.display_name,
      identityId: identity.id,
      ensName: identity.addresses.find((a) => a.address === address)?.ens_name ?? null,
      forumHandle: identity.forum_handle,
      discordHandle: identity.discord_handle,

      rank: row.rank,
      score: row.score,
      pillars: {
        community: toPillar(row.community, row.missing_community),
        holdings: toPillar(row.holdings, row.missing_holdings),
        votes: toPillar(row.votes, row.missing_votes),
      },
      cohort: row.cohort,
      allocatedPower: row.power,

      isAlreadyDelegated: isAlreadyDelegated(address, lists),

      isOnCommittee: committeeNames.length > 0,
      committeeNames,

      voteParticipationRate: voteParticipation?.[address] ?? 0,
      activeVoteStatus,

      votingPowerData: votingPower?.[address] ?? null,
    };
  });
}
