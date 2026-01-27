/**
 * Event source types - extensible for future integrations
 */
export enum EventSource {
  ICS = 'ics',
  SNAPSHOT_PROPOSALS = 'snapshot_proposals',
}

/**
 * Configuration for an event source
 */
export interface EventSourceConfig {
  id: string;
  type: EventSource;
  name: string;
  enabled: boolean;
  url: string;
  color?: string;
}

/**
 * Unified event structure that all sources transform into
 */
export interface UnifiedEvent {
  id: string;
  sourceId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  isAllDay: boolean;
  source: EventSource;
  sourceName: string;
  sourceUrl: string | null;
  location: string | null;
  isRecurring: boolean;
  recurrenceId: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Serializable version of UnifiedEvent for passing from server to client
 */
export interface SerializedEvent {
  id: string;
  sourceId: string;
  title: string;
  description: string | null;
  startDate: string; // ISO string
  endDate: string | null; // ISO string
  isAllDay: boolean;
  source: EventSource;
  sourceName: string;
  sourceUrl: string | null;
  location: string | null;
  isRecurring: boolean;
  recurrenceId: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Raw parsed ICS event before transformation
 */
export interface RawICSEvent {
  uid: string;
  summary: string;
  description: string | null;
  dtstart: Date;
  dtend: Date | null;
  location: string | null;
  url: string | null;
  rrule: string | null;
  isAllDay: boolean;
}

/**
 * Recurrence rule components
 */
export interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: string[] | null;
  byMonthDay: number[] | null;
  byMonth: number[] | null;
}

/**
 * Filter state for timeline UI
 */
export interface TimelineFilters {
  sources: string[]; // source IDs
  startDate: Date | null;
  endDate: Date | null;
  showPastEvents: boolean;
}

/**
 * Events grouped by day for display
 */
export interface EventGroup {
  date: Date;
  label: string; // "Today", "Tomorrow", or formatted date
  events: SerializedEvent[];
}
