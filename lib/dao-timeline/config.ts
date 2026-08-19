import { EventSource, EventSourceConfig } from './types';

/**
 * Cache duration for event data (5 minutes)
 */
export const CACHE_REVALIDATE_SECONDS = 300;

/**
 * How far forward the timeline looks for a series' next occurrence.
 *
 * A series that has not met again within this window has no "next" card; the
 * badge still states its cadence.
 */
export const SERIES_LOOKAHEAD_MONTHS = 6;

/**
 * How far back the timeline looks for a series' most recent occurrence.
 */
export const SERIES_LOOKBEHIND_MONTHS = 6;

/**
 * Iteration ceiling for the occurrence engine, so a malformed rule cannot spin.
 */
export const MAX_OCCURRENCE_ITERATIONS = 2000;

/**
 * Get the Snapshot space ID for timeline proposals
 * Falls back to delegation space filter if timeline-specific not set
 */
export function getSnapshotTimelineSpaceId(): string | null {
  return (
    process.env.SNAPSHOT_TIMELINE_SPACE_ID ||
    process.env.SNAPSHOT_DELEGATION_SPACE_FILTER ||
    null
  );
}

/**
 * Get configured event sources from environment
 * Supports single ICS URL via DAO_CALENDAR_ICS_URL or multiple sources via DAO_TIMELINE_SOURCES
 * Automatically adds Snapshot source when space ID is configured
 */
export function getEventSources(): EventSourceConfig[] {
  // Check for JSON-formatted multiple sources
  const sourcesJson = process.env.DAO_TIMELINE_SOURCES;
  if (sourcesJson) {
    try {
      const sources = JSON.parse(sourcesJson) as EventSourceConfig[];
      return sources.filter((s) => s.enabled);
    } catch {
      console.error('Failed to parse DAO_TIMELINE_SOURCES JSON');
    }
  }

  // Build sources list from individual environment variables
  const sources: EventSourceConfig[] = [];

  // Add ICS source if configured
  const icsUrl = process.env.DAO_CALENDAR_ICS_URL;
  if (icsUrl) {
    sources.push({
      id: 'main-calendar',
      type: EventSource.ICS,
      name: 'DAO Calendar',
      enabled: true,
      url: icsUrl,
      color: 'primary',
    });
  }

  // Add Snapshot source if configured
  const snapshotSpaceId = getSnapshotTimelineSpaceId();
  if (snapshotSpaceId) {
    sources.push({
      id: 'snapshot-proposals',
      type: EventSource.SNAPSHOT_PROPOSALS,
      name: 'Governance',
      enabled: true,
      url: snapshotSpaceId, // Store space ID in url field
      color: 'governance',
    });
  }

  return sources;
}

/**
 * Source color mapping for badges
 */
export const SOURCE_COLORS: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  governance: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  'ai-insights': 'bg-secondary/20 text-secondary',
};

/**
 * Get color class for a source
 */
export function getSourceColorClass(color?: string): string {
  return color && SOURCE_COLORS[color]
    ? SOURCE_COLORS[color]
    : 'bg-muted text-muted-foreground';
}
