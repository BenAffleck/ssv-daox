import { Repeat } from 'lucide-react';

interface RecurringBadgeProps {
  /** Human-readable cadence, e.g. "Every 2 weeks on Tue". */
  summary: string;
  className?: string;
}

/**
 * States that an event repeats, and how often.
 *
 * The timeline shows a series as only its most recent and next occurrence, so
 * this badge is what tells the reader the rest of the series exists.
 */
export default function RecurringBadge({ summary, className = '' }: RecurringBadgeProps) {
  return (
    <span className={`badge-sm-muted gap-1 ${className}`} title={`Recurring event — ${summary}`}>
      <Repeat className="h-3 w-3" aria-hidden="true" />
      <span>{summary}</span>
    </span>
  );
}
