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
 * Get configured event sources from environment
 * Supports single ICS URL via DAO_CALENDAR_ICS_URL or multiple sources via DAO_TIMELINE_SOURCES
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

  // Fall back to single ICS URL
  const icsUrl = process.env.DAO_CALENDAR_ICS_URL;
  if (icsUrl) {
    return [
      {
        id: 'main-calendar',
        type: EventSource.ICS,
        name: 'DAO Calendar',
        enabled: true,
        url: icsUrl,
        color: 'primary',
      },
    ];
  }

  // Return empty array if no sources configured
  return [];
}

/**
 * Source color mapping for badges
 */
export const SOURCE_COLORS: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  // Add more as needed
};

/**
 * Get color class for a source
 */
export function getSourceColorClass(color?: string): string {
  return color && SOURCE_COLORS[color]
    ? SOURCE_COLORS[color]
    : 'bg-muted text-muted-foreground';
}
