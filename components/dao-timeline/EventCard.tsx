import { EventSource, SerializedEvent } from '@/lib/dao-timeline/types';
import { formatDateRange } from '@/lib/dao-timeline/utils/date-utils';
import SourceBadge from './SourceBadge';
import RecurringBadge from './RecurringBadge';
import AISourceBadge from './AISourceBadge';

interface EventCardProps {
  event: SerializedEvent;
  sourceColor?: string;
}

/**
 * Get AI extraction metadata from event
 */
function getAIMetadata(event: SerializedEvent): {
  excerpt?: string;
  confidence?: 'high' | 'medium' | 'low';
  sourceProposalTitle?: string;
  sourceProposalUrl?: string;
} | null {
  if (event.source !== EventSource.AI_EXTRACTED) {
    return null;
  }
  const meta = event.metadata as Record<string, unknown>;
  return {
    excerpt: typeof meta.excerpt === 'string' ? meta.excerpt : undefined,
    confidence:
      meta.confidence === 'high' ||
      meta.confidence === 'medium' ||
      meta.confidence === 'low'
        ? meta.confidence
        : undefined,
    sourceProposalTitle:
      typeof meta.sourceProposalTitle === 'string'
        ? meta.sourceProposalTitle
        : undefined,
    sourceProposalUrl:
      typeof meta.sourceProposalUrl === 'string'
        ? meta.sourceProposalUrl
        : undefined,
  };
}

export default function EventCard({ event, sourceColor }: EventCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const timeDisplay = formatDateRange(startDate, endDate, event.isAllDay);

  // Check if this is an AI-extracted event
  const aiMeta = getAIMetadata(event);
  const isAIEvent = aiMeta !== null;

  // For AI events, show the excerpt as description
  // For other events, truncate the description if too long
  const maxDescLength = 150;
  const displayDesc = isAIEvent
    ? aiMeta.excerpt
      ? `"${aiMeta.excerpt}"`
      : event.description
    : event.description;
  const truncatedDesc =
    displayDesc && displayDesc.length > maxDescLength
      ? displayDesc.substring(0, maxDescLength) + '...'
      : displayDesc;

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

          {/* Description or Excerpt for AI events */}
          {truncatedDesc && (
            <p className={`mt-1 text-sm ${isAIEvent ? 'italic text-muted/80' : 'text-muted'}`}>
              {truncatedDesc}
            </p>
          )}

          {/* Source proposal link for AI events */}
          {isAIEvent && aiMeta.sourceProposalTitle && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              <span>Source: </span>
              {aiMeta.sourceProposalUrl ? (
                <a
                  href={aiMeta.sourceProposalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {aiMeta.sourceProposalTitle}
                </a>
              ) : (
                <span>{aiMeta.sourceProposalTitle}</span>
              )}
            </div>
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
          {isAIEvent ? (
            <AISourceBadge confidence={aiMeta.confidence} />
          ) : (
            <SourceBadge name={event.sourceName} color={sourceColor} />
          )}
          {event.isRecurring && <RecurringBadge />}
        </div>
      </div>
    </div>
  );
}
