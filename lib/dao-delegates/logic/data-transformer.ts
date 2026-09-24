import type { VotingPowerMap } from '@/lib/gnosis/types';
import type { ActiveVoteData } from '@/lib/snapshot/api/fetch-active-vote-status';
import type { VoteParticipationMap } from '@/lib/snapshot/types';

import { checkEligibility, isAlreadyDelegated } from '../eligibility/checker';
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
    const eligibility = checkEligibility(address, lists);

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

      isVIP: eligibility.isVIP,
      isOnCommittee: eligibility.isOnCommittee,
      isOnFixedList: eligibility.isOnFixedList,
      isEligible: eligibility.isEligible,
      committeeNames: eligibility.committeeNames,
      fixedListNames: eligibility.fixedListNames,

      voteParticipationRate: voteParticipation?.[address] ?? 0,
      activeVoteStatus,

      votingPowerData: votingPower?.[address] ?? null,
    };
  });
}
