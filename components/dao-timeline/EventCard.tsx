import { SerializedEvent } from '@/lib/dao-timeline/types';
import { formatDateRange } from '@/lib/dao-timeline/utils/date-utils';
import SourceBadge from './SourceBadge';
import RecurringBadge from './RecurringBadge';

interface EventCardProps {
  event: SerializedEvent;
  sourceColor?: string;
}

export default function EventCard({ event, sourceColor }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const timeDisplay = formatDateRange(startDate, endDate, event.isAllDay);

  // Truncate description if too long
  const maxDescLength = 150;
  const truncatedDesc =
    event.description && event.description.length > maxDescLength
      ? event.description.substring(0, maxDescLength) + '...'
      : event.description;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Time */}
          <div className="mb-1 text-sm font-medium text-primary">
            {timeDisplay}
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {event.sourceUrl ? (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                {event.title}
              </a>
            ) : (
              event.title
            )}
          </h3>

          {/* Description */}
          {truncatedDesc && (
            <p className="mt-1 text-sm text-muted">{truncatedDesc}</p>
          )}

          {/* Location */}
          {event.location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-2">
          <SourceBadge name={event.sourceName} color={sourceColor} />
          {event.isRecurring && <RecurringBadge />}
        </div>
      </div>
    </div>
  );
}
