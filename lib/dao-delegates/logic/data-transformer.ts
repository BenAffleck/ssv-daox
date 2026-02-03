import { Delegate, KarmaDelegateCSV, EligibilityLists } from '../types';
import { checkEligibility, isAlreadyDelegated } from '../eligibility/checker';
import { formatAddress } from '../utils/address';
import type { VoteParticipationMap } from '@/lib/snapshot/types';
import type { VotingPowerMap } from '@/lib/gnosis/types';

/**
 * Transforms CSV delegate data into Delegate objects
 * Applies eligibility checking and computes display fields
 */
export function transformDelegates(
  csvDelegates: KarmaDelegateCSV[],
  lists: EligibilityLists,
  voteParticipation?: VoteParticipationMap,
  votingPower?: VotingPowerMap
): Delegate[] {
  return csvDelegates.map((csv) => {
    // Parse numeric fields
    const karmaScore = parseFloat(csv.karmaScore) || 0;
    const delegatedTokens = parseFloat(csv.delegatedTokens) || 0;
    const delegatorCount = parseInt(csv.delegatorCount, 10) || 0;

    // Check eligibility
    const eligibility = checkEligibility(csv.publicAddress, lists);

    // Check if already delegated
    const alreadyDelegated = isAlreadyDelegated(csv.publicAddress, lists);

    // Determine display name (priority: ensName > name > truncated address)
    const displayName =
      csv.ensName || csv.name || formatAddress(csv.publicAddress);

    // Check if profile is complete (forumHandle and discordUsername set)
    const isProfileComplete =
      Boolean(csv.forumHandle && csv.forumHandle.trim()) &&
      Boolean(csv.discordUsername && csv.discordUsername.trim());

    // Get vote participation rate (normalize address to lowercase for lookup)
    const voteParticipationRate =
      voteParticipation?.[csv.publicAddress.toLowerCase()] ?? 0;

    // Get voting power data (normalize address to lowercase for lookup)
    const votingPowerData =
      votingPower?.[csv.publicAddress.toLowerCase()] ?? null;

    const delegate: Delegate = {
      // Raw CSV data
      publicAddress: csv.publicAddress,
      name: csv.name,
      ensName: csv.ensName,
      karmaScore,
      delegatedTokens,
      delegatorCount,
      status: csv.status,

      // Computed fields
      rank: 0, // Will be set by rank calculator
      displayName,
      isAlreadyDelegated: alreadyDelegated,
      isProfileComplete,

      // Eligibility
      isVIP: eligibility.isVIP,
      isOnCommittee: eligibility.isOnCommittee,
      isOnFixedList: eligibility.isOnFixedList,
      isEligible: eligibility.isEligible,
      committeeNames: eligibility.committeeNames,
      fixedListNames: eligibility.fixedListNames,

      // Programs (will be set by program assigner)
      delegationPrograms: [],

      // Vote participation
      voteParticipationRate,

      // Voting power from Gnosis delegation API
      votingPowerData,
    };

    return delegate;
  });
}
