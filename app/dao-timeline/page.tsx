import {
  fetchAllEvents,
  getSourcesMetadata,
} from '@/lib/dao-timeline/api/event-source-registry';
import { serializeEvents } from '@/lib/dao-timeline/logic/event-transformer';
import { sortEventsByDate } from '@/lib/dao-timeline/logic/event-aggregator';
import Timeline from '@/components/dao-timeline/Timeline';

export const metadata = {
  title: 'DAO Timeline - DAOx',
  description: 'View upcoming DAO events and calendar',
};

export default async function DaoTimelinePage() {
  // Fetch events from all configured sources
  const events = await fetchAllEvents();

  // Sort events chronologically
  const sortedEvents = sortEventsByDate(events);

  // Serialize for client component
  const serializedEvents = serializeEvents(sortedEvents);

  // Get source metadata for filters
  const sources = getSourcesMetadata();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-heading text-3xl font-semibold text-foreground">
          DAO Timeline
        </h1>
        <p className="text-muted">
          Upcoming events and important dates for the DAO community
        </p>
      </div>

      {sources.length === 0 ? (
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="font-body text-lg text-muted">
            No calendar sources configured
          </p>
          <p className="mt-2 text-sm text-muted">
            Set the <code className="rounded bg-muted/20 px-1">DAO_CALENDAR_ICS_URL</code>{' '}
            environment variable to add a calendar.
          </p>
        </div>
      ) : (
        <Timeline events={serializedEvents} sources={sources} />
      )}
    </div>
  );
}
