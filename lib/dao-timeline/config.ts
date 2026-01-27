import { EventSource, EventSourceConfig } from './types';

/**
 * Cache duration for event data (5 minutes)
 */
export const CACHE_REVALIDATE_SECONDS = 300;

/**
 * Default window for event expansion (months)
 */
export const DEFAULT_EXPANSION_MONTHS = 6;

/**
 * Maximum number of recurring instances to generate
 */
export const MAX_RECURRENCE_INSTANCES = 100;

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
};

/**
 * Get color class for a source
 */
export function getSourceColorClass(color?: string): string {
  return color && SOURCE_COLORS[color]
    ? SOURCE_COLORS[color]
    : 'bg-muted text-muted-foreground';
}
