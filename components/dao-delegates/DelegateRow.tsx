import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import OptOutStatusBadge from '@/components/delegation/OptOutStatusBadge';
import { Delegate, PillarKey } from '@/lib/dao-delegates/types';
import { optOutBadgeOf } from '@/lib/delegation/logic/address-overview';
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
  const optOutBadge = optOutBadgeOf(delegate.optOut);

  return (
    <tr className="border-b border-border transition-colors hover:bg-card-hover">
      <td className="px-3 py-3 text-center font-medium text-foreground tabular-nums">
        {delegate.rank ?? '-'}
      </td>
      <td className="px-3 py-3">
        <NameCell displayName={delegate.displayName} />
        <AddressCell address={delegate.publicAddress} />
      </td>
      <td className="px-3 py-3 text-center">
        <ScoreCell score={delegate.score} />
      </td>
      {livePillars.map((pillar) => (
        <td key={pillar} className="px-3 py-3 text-center">
          <ScoreCell
            score={delegate.pillars[pillar]?.score ?? null}
            missing={delegate.pillars[pillar]?.missing}
          />
        </td>
      ))}
      <td className="px-3 py-3">
        <VotingPowerBadge
          votingPowerData={delegate.votingPowerData}
          address={delegate.publicAddress}
        />
      </td>
      <td className="px-3 py-3">
        <CohortBadge cohort={delegate.cohort} />
      </td>
      <td className="px-3 py-3">
        {optOutBadge === 'opt_out_pending' || optOutBadge === 'opted_out' ? (
          <OptOutStatusBadge status={delegate.optOut} />
        ) : (
          <DelegationStatusBadge
            isAlreadyDelegated={delegate.isAlreadyDelegated}
            hasCohort={hasCohort}
          />
        )}
      </td>
      <td className="px-3 py-3 text-foreground tabular-nums">
        {delegate.allocatedPower ? (
          `${Math.round(delegate.allocatedPower).toLocaleString()} SSV`
        ) : (
          <span className="text-xs text-muted">-</span>
        )}
      </td>
      <td className="px-3 py-3">
        <VoteParticipationCell
          participationRate={delegate.voteParticipationRate}
          proposalCount={SNAPSHOT_CONFIG.voteParticipation.proposalCount}
          activeVoteStatus={delegate.activeVoteStatus}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <Link
          href={`/delegation?address=${delegate.publicAddress}`}
          className="inline-flex items-center gap-1 text-[13px] whitespace-nowrap text-primary hover:underline"
        >
          Open
          <ChevronRight size={14} />
        </Link>
      </td>
    </tr>
  );
}
