import { optOutBadgeOf, type OptOutBadge } from '@/lib/delegation/logic/address-overview';
import type { OptOutStatus } from '@/lib/delegation/opt-out/score-api';

const BADGES: Record<OptOutBadge, { label: string; className: string }> = {
  opt_out_pending: { label: 'Opt-out pending', className: 'badge badge-warning' },
  opted_out: { label: 'Opted out', className: 'badge badge-danger' },
  opt_in_pending: { label: 'Opt-in pending', className: 'badge badge-muted' },
};

export default function OptOutStatusBadge({ status }: { status: OptOutStatus | null }) {
  const badge = optOutBadgeOf(status);
  if (!badge) {
    return <span className="text-xs text-muted">-</span>;
  }
  const { label, className } = BADGES[badge];
  return <span className={`${className} whitespace-nowrap`}>{label}</span>;
}
