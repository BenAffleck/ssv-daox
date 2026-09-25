import type { ClaimStatus } from '@/lib/delegation/logic/address-overview';

const BADGES: Record<ClaimStatus, { label: string; className: string }> = {
  unclaimed: { label: 'Unclaimed', className: 'badge badge-muted' },
  claimed_pending: { label: 'Claimed, community pending', className: 'badge badge-warning' },
  claimed_scored: { label: 'Claimed and scored', className: 'badge badge-accent' },
};

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { label, className } = BADGES[status];
  return <span className={`${className} whitespace-nowrap`}>{label}</span>;
}
