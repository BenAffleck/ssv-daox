import { Delegate } from '@/lib/dao-delegates/types';
import EligibilityBadge from './EligibilityBadge';
import ProgramBadge from './ProgramBadge';
import DelegationStatusBadge from './DelegationStatusBadge';
import VoteParticipationCell from './VoteParticipationCell';
import VotingPowerBadge from './VotingPowerBadge';
import AddressCell from './AddressCell';
import NameCell from './NameCell';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';

interface DelegateRowProps {
  delegate: Delegate;
}

export default function DelegateRow({ delegate }: DelegateRowProps) {
  const isWithdrawn = delegate.status.toLowerCase() === 'withdrawn';
  const hasPrograms = delegate.delegationPrograms.length > 0;

  // Calculate next round action
  let nextRoundAction: 'Delegate' | 'Undelegate' | 'Keep' | null = null;
  let nextRoundBadgeClass = '';

  if (hasPrograms && !delegate.isAlreadyDelegated) {
    // Should be added
    nextRoundAction = 'Delegate';
    nextRoundBadgeClass = 'badge-accent';
  } else if (!hasPrograms && delegate.isAlreadyDelegated) {
    // Should be removed
    nextRoundAction = 'Undelegate';
    nextRoundBadgeClass = 'badge-primary';
  } else if (hasPrograms && delegate.isAlreadyDelegated) {
    // Should be kept
    nextRoundAction = 'Keep';
    nextRoundBadgeClass = 'badge-secondary';
  }

  return (
    <tr className={`border-b border-border transition-colors hover:bg-card-hover ${isWithdrawn ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3 text-center font-medium tabular-nums text-foreground">
        {delegate.rank}
      </td>
      <td className="px-4 py-3 text-center tabular-nums text-foreground">
        {delegate.karmaScore.toLocaleString()}
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
        {isWithdrawn ? (
          <span className="badge badge-muted">
            Withdrawn
          </span>
        ) : (
          <DelegationStatusBadge
            isAlreadyDelegated={delegate.isAlreadyDelegated}
          />
        )}
      </td>
      <td className="px-4 py-3">
        <EligibilityBadge delegate={delegate} />
      </td>
      <td className="px-4 py-3">
        <ProgramBadge programs={delegate.delegationPrograms} />
      </td>
      <td className="px-4 py-3">
        {delegate.isProfileComplete ? (
          <span className="badge badge-accent">
            Complete
          </span>
        ) : (
          <span className="badge badge-muted">
            Incomplete
          </span>
        )}
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
          <span className={`badge ${nextRoundBadgeClass}`}>
            {nextRoundAction}
          </span>
        ) : (
          <span className="text-xs text-muted">-</span>
        )}
      </td>
    </tr>
  );
}
