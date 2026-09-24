import { Delegate, PillarKey } from '@/lib/dao-delegates/types';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';

import AddressCell from './AddressCell';
import CohortBadge from './CohortBadge';
import DelegationStatusBadge from './DelegationStatusBadge';
import NameCell from './NameCell';
import ScoreCell from './ScoreCell';
import VoteParticipationCell from './VoteParticipationCell';
import VotingPowerBadge from './VotingPowerBadge';

interface DelegateRowProps {
  delegate: Delegate;
  livePillars: PillarKey[];
}

export default function DelegateRow({ delegate, livePillars }: DelegateRowProps) {
  const hasCohort = delegate.cohort !== null;

  return (
    <tr className="border-b border-border transition-colors hover:bg-card-hover">
      <td className="px-4 py-3 text-center font-medium text-foreground tabular-nums">
        {delegate.rank ?? '-'}
      </td>
      <td className="px-4 py-3">
        <NameCell displayName={delegate.displayName} />
      </td>
      <td className="px-4 py-3 text-center">
        <ScoreCell score={delegate.score} />
      </td>
      {livePillars.map((pillar) => (
        <td key={pillar} className="px-4 py-3 text-center">
          <ScoreCell
            score={delegate.pillars[pillar]?.score ?? null}
            missing={delegate.pillars[pillar]?.missing}
          />
        </td>
      ))}
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
        <CohortBadge cohort={delegate.cohort} />
      </td>
      <td className="px-4 py-3">
        <DelegationStatusBadge
          isAlreadyDelegated={delegate.isAlreadyDelegated}
          hasCohort={hasCohort}
        />
      </td>
      <td className="px-4 py-3 text-foreground tabular-nums">
        {delegate.allocatedPower ? (
          `${Math.round(delegate.allocatedPower).toLocaleString()} SSV`
        ) : (
          <span className="text-xs text-muted">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <VoteParticipationCell
          participationRate={delegate.voteParticipationRate}
          proposalCount={SNAPSHOT_CONFIG.voteParticipation.proposalCount}
          activeVoteStatus={delegate.activeVoteStatus}
        />
      </td>
    </tr>
  );
}
