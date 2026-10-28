import { COHORT_LABELS } from '@/lib/leaderboard/config';
import type { Cohort } from '@/lib/leaderboard/types';

interface CohortBadgeProps {
  cohort: Cohort | null;
}

export default function CohortBadge({ cohort }: CohortBadgeProps) {
  if (cohort === null) {
    return <span className="text-xs text-muted">Not assigned</span>;
  }

  return <span className="badge badge-primary whitespace-nowrap">{COHORT_LABELS[cohort]}</span>;
}
