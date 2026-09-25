import type { ClaimStatus } from '@/lib/delegation/logic/address-overview';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  unclaimed: 'Unclaimed',
  claimed_pending: 'Claimed, community pending',
  claimed_scored: 'Claimed and scored',
};

const CLASS_NAMES: Record<ClaimStatus, string> = {
  unclaimed: 'badge badge-muted',
  claimed_pending: 'badge badge-warning',
  claimed_scored: 'badge badge-accent',
};

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`${CLASS_NAMES[status]} whitespace-nowrap`}>
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}
