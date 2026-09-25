import type { OptOutStatus } from '@/lib/delegation/opt-out/score-api';

export default function OptOutStatusBadge({ status }: { status: OptOutStatus | null }) {
  if (!status) {
    return <span className="text-xs text-muted">-</span>;
  }
  return status.action === 'opt-out' ? (
    <span className="badge badge-warning whitespace-nowrap">Opt-out pending</span>
  ) : (
    <span className="badge badge-muted whitespace-nowrap">Opt-in pending</span>
  );
}
