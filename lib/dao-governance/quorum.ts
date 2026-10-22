import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

export interface QuorumStatus {
  /** Quorum threshold in voting power; 0 when the space configures none. */
  required: number;
  /** Total voting power cast. */
  cast: number;
  /** Cast / required, capped at 1. */
  progress: number;
  reached: boolean;
}

/**
 * Quorum as configured on the proposal's Snapshot space (Snapshot copies the
 * space quorum onto each proposal). Returns null when the space has no quorum.
 */
export function getQuorumStatus(
  proposal: Pick<SnapshotActiveProposal, 'quorum' | 'scores_total'>,
): QuorumStatus | null {
  if (!(proposal.quorum > 0)) return null;
  const cast = proposal.scores_total;
  return {
    required: proposal.quorum,
    cast,
    progress: Math.min(cast / proposal.quorum, 1),
    reached: cast >= proposal.quorum,
  };
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatVotingPower(value: number): string {
  return compact.format(value);
}
