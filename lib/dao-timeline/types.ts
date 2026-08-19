/**
 * Event source types - extensible for future integrations
 */
export enum EventSource {
  ICS = 'ics',
  SNAPSHOT_PROPOSALS = 'snapshot_proposals',
  AI_EXTRACTED = 'ai_extracted',
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
 * The recurrence of a series, carried on the single event that represents it.
 *
 * A series is never materialised into one event per occurrence; it travels as
 * one event plus this rule, and the timeline collapses it to the two
 * occurrences worth showing at render time.
 */
export interface SeriesInfo {
  /** RFC 5545 RRULE string - the single source of truth for the cadence. */
  rrule: string;
  /** Human-readable cadence for the badge, e.g. "Every 2 weeks on Tue". */
  summary: string;
  /** Occurrence dates to skip (ICS EXDATE), as YYYY-MM-DD. */
  exceptions: string[];
}

/**
 * Marks an event as one materialised occurrence of a series.
 *
 * Present only on the events the collapse step produces, never on the series
 * event itself.
 */
export interface OccurrenceInfo {
  /** Which half of the collapsed pair this card is. */
  role: 'previous' | 'next';
  /** The other occurrence's date, for the card's context line. ISO string. */
  siblingDate: string | null;
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
  /** The cadence, when this event stands for a whole series. */
  recurrence: SeriesInfo | null;
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
  recurrence: SeriesInfo | null;
  /** Set only on a collapsed occurrence produced by the timeline. */
  occurrence?: OccurrenceInfo;
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
  /** EXDATE values, as YYYY-MM-DD. Accumulated across repeated properties. */
  exdates: string[];
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
