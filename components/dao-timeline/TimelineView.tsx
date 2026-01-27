'use client';

import { EventGroup } from '@/lib/dao-timeline/types';
import EventCard from './EventCard';

interface TimelineViewProps {
  groups: EventGroup[];
  sourceColors: Record<string, string | undefined>;
}

export default function TimelineView({
  groups,
  sourceColors,
}: TimelineViewProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <p className="font-body text-lg text-muted">No upcoming events</p>
        <p className="mt-1 text-sm text-muted">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.date.toISOString()}>
          {/* Day header */}
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {group.label}
            </h2>
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted">
              {group.events.length} event{group.events.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Events for this day */}
          <div className="space-y-3">
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                sourceColor={sourceColors[event.sourceId]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
