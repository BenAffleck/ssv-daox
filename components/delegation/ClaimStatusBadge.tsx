import type { ClaimStatus } from '@/lib/delegation/logic/address-overview';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  unclaimed: 'Unclaimed',
  claimed_pending: 'Claimed, pending',
  claimed_scored: 'Claimed',
};

const TITLES: Record<ClaimStatus, string> = {
  unclaimed: 'Not linked on HighSignal.',
  claimed_pending: 'Linked on HighSignal. Community activity counts from the next score run.',
  claimed_scored: 'Linked on HighSignal. Community activity counts toward the score.',
};

const CLASS_NAMES: Record<ClaimStatus, string> = {
  unclaimed: 'badge badge-muted',
  claimed_pending: 'badge badge-warning',
  claimed_scored: 'badge badge-accent',
};

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`${CLASS_NAMES[status]} whitespace-nowrap`} title={TITLES[status]}>
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}
