import { Delegate } from '@/lib/dao-delegates/types';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';

import AddressCell from './AddressCell';
import CohortBadge from './CohortBadge';
import DelegationStatusBadge from './DelegationStatusBadge';
import EligibilityBadge from './EligibilityBadge';
import NameCell from './NameCell';
import ScoreCell from './ScoreCell';
import VoteParticipationCell from './VoteParticipationCell';
import VotingPowerBadge from './VotingPowerBadge';

interface DelegateRowProps {
  delegate: Delegate;
}

export default function DelegateRow({ delegate }: DelegateRowProps) {
  const hasCohort = delegate.cohort !== null;

  // Calculate next round action
  let nextRoundAction: 'Delegate' | 'Undelegate' | 'Keep' | null = null;
  let nextRoundBadgeClass = '';

  if (hasCohort && !delegate.isAlreadyDelegated) {
    // Should be added
    nextRoundAction = 'Delegate';
    nextRoundBadgeClass = 'badge-accent';
  } else if (!hasCohort && delegate.isAlreadyDelegated) {
    // Should be removed
    nextRoundAction = 'Undelegate';
    nextRoundBadgeClass = 'badge-primary';
  } else if (hasCohort && delegate.isAlreadyDelegated) {
    // Should be kept
    nextRoundAction = 'Keep';
    nextRoundBadgeClass = 'badge-secondary';
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-card-hover">
      <td className="px-4 py-3 text-center font-medium text-foreground tabular-nums">
        {delegate.rank ?? '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <ScoreCell score={delegate.score} pillars={delegate.pillars} />
      </td>
      <td className="px-4 py-3">
        <VotingPowerBadge
          votingPowerData={delegate.votingPowerData}
          address={delegate.publicAddress}
        />
      </td>
      <td className="px-4 py-3">
        <AddressCell address={delegate.publicAddress} />
      </td>
      <td className="px-4 py-3">
        <NameCell displayName={delegate.displayName} />
      </td>
      <td className="px-4 py-3">
        <DelegationStatusBadge isAlreadyDelegated={delegate.isAlreadyDelegated} />
      </td>
      <td className="px-4 py-3">
        <EligibilityBadge delegate={delegate} />
      </td>
      <td className="px-4 py-3">
        <CohortBadge cohort={delegate.cohort} allocatedPower={delegate.allocatedPower} />
      </td>
      <td className="px-4 py-3">
        <VoteParticipationCell
          participationRate={delegate.voteParticipationRate}
          proposalCount={SNAPSHOT_CONFIG.voteParticipation.proposalCount}
          activeVoteStatus={delegate.activeVoteStatus}
        />
      </td>
      <td className="px-4 py-3">
        {nextRoundAction ? (
          <span className={`badge ${nextRoundBadgeClass}`}>{nextRoundAction}</span>
        ) : (
          <span className="text-xs text-muted">-</span>
        )}
      </td>
    </tr>
  );
}
