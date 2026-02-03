import { Delegate } from '@/lib/dao-delegates/types';
import EligibilityBadge from './EligibilityBadge';
import ProgramBadge from './ProgramBadge';
import DelegationStatusBadge from './DelegationStatusBadge';
import VoteParticipationBadge from './VoteParticipationBadge';
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
    nextRoundBadgeClass = 'bg-accent/20 text-accent';
  } else if (!hasPrograms && delegate.isAlreadyDelegated) {
    // Should be removed
    nextRoundAction = 'Undelegate';
    nextRoundBadgeClass = 'bg-primary/20 text-primary';
  } else if (hasPrograms && delegate.isAlreadyDelegated) {
    // Should be kept
    nextRoundAction = 'Keep';
    nextRoundBadgeClass = 'bg-secondary/20 text-secondary';
  }

  return (
    <tr className={`border-b border-border transition-colors hover:bg-card-hover ${isWithdrawn ? 'opacity-60' : ''}`}>
      <td className="p-4 text-center text-sm font-medium text-foreground">
        {delegate.rank}
      </td>
      <td className="p-4 text-center text-sm text-foreground">
        {delegate.karmaScore.toLocaleString()}
      </td>
      <td className="p-4">
        <VotingPowerBadge
          votingPowerData={delegate.votingPowerData}
          address={delegate.publicAddress}
        />
      </td>
      <td className="p-4">
        <AddressCell address={delegate.publicAddress} />
      </td>
      <td className="p-4">
        <NameCell displayName={delegate.displayName} />
      </td>
      <td className="p-4">
        {isWithdrawn ? (
          <span className="inline-flex items-center rounded-full bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted">
            Withdrawn
          </span>
        ) : (
          <DelegationStatusBadge
            isAlreadyDelegated={delegate.isAlreadyDelegated}
          />
        )}
      </td>
      <td className="p-4">
        <EligibilityBadge delegate={delegate} />
      </td>
      <td className="p-4">
        <ProgramBadge programs={delegate.delegationPrograms} />
      </td>
      <td className="p-4">
        {delegate.isProfileComplete ? (
          <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
            Complete
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted">
            Incomplete
          </span>
        )}
      </td>
      <td className="p-4">
        <VoteParticipationBadge participationRate={delegate.voteParticipationRate} proposalCount={SNAPSHOT_CONFIG.voteParticipation.proposalCount} />
      </td>
      <td className="p-4">
        {nextRoundAction ? (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${nextRoundBadgeClass}`}>
            {nextRoundAction}
          </span>
        ) : (
          <span className="text-xs text-muted">-</span>
        )}
      </td>
    </tr>
  );
}
