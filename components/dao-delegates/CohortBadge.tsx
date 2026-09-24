import { COHORT_LABELS } from '@/lib/dao-delegates/config';
import type { Cohort } from '@/lib/dao-delegates/types';

interface CohortBadgeProps {
  cohort: Cohort | null;
  allocatedPower: number | null;
}

export default function CohortBadge({ cohort, allocatedPower }: CohortBadgeProps) {
  if (cohort === null) {
    return <span className="text-xs text-muted">Not assigned</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="badge badge-primary whitespace-nowrap">{COHORT_LABELS[cohort]}</span>
      {allocatedPower !== null && (
        <span className="text-[11px] text-muted tabular-nums" title="Voting power allocated">
          {Math.round(allocatedPower).toLocaleString()} SSV
        </span>
      )}
    </div>
  );
}
