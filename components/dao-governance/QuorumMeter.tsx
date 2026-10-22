import { Check, TriangleAlert } from 'lucide-react';

import { formatVotingPower, getQuorumStatus } from '@/lib/dao-governance/quorum';
import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

interface QuorumMeterProps {
  proposal: Pick<SnapshotActiveProposal, 'quorum' | 'scores_total'>;
}

/**
 * Inline quorum status for a card's footer; the result bar shows the shortfall.
 */
export default function QuorumMeter({ proposal }: QuorumMeterProps) {
  const quorum = getQuorumStatus(proposal);
  if (!quorum) return <span>No quorum</span>;

  const Icon = quorum.reached ? Check : TriangleAlert;
  const label = quorum.reached ? 'Quorum reached' : 'Quorum not reached';

  return (
    // Reached is the normal case and stays quiet; only a miss takes colour.
    <span
      className={`inline-flex items-center gap-1.5 ${quorum.reached ? '' : 'font-medium text-warning'}`}
    >
      <Icon className={`h-3.5 w-3.5 ${quorum.reached ? 'text-accent' : ''}`} aria-hidden />
      {label}
      <span className="font-normal tabular-nums">
        {formatVotingPower(quorum.cast)} / {formatVotingPower(quorum.required)}
      </span>
    </span>
  );
}
