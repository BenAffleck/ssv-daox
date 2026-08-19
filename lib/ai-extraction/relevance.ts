/**
 * Which extracted events earn a place on the timeline.
 *
 * The model is generous about dates, and proposals are full of cadences that
 * matter only to the people running them — "the Grants Council meets monthly",
 * "Operators sync every Tuesday". A one-off date is cheap: it appears once and
 * scrolls away. A recurring one is not: it claims a permanent pair of cards
 * and a badge for as long as the series runs. So recurrence has to earn it.
 */

import { AIExtractedEvent } from './types';

/**
 * Words naming a recurring deliverable rather than a meeting.
 *
 * A deliverable is something the DAO is owed; a meeting is something a group
 * holds. Only the first kind can be a public obligation.
 */
const REPORTING_TERMS = [
  'report',
  'reports',
  'reporting',
  'transparency',
  'disclosure',
  'disclosures',
  'statement',
  'statements',
  'audit',
  'accounting',
  'breakdown',
  'balance sheet',
];

/**
 * Words placing that deliverable in front of the community.
 *
 * Required alongside a reporting term, so "the security lead reports to the
 * multisig each month" stays internal while "publish to the forum a quarterly
 * report" does not.
 */
const PUBLIC_TERMS = [
  'public',
  'publicly',
  'publish',
  'publishes',
  'published',
  'publishing',
  'publication',
  'community',
  'dao',
  'forum',
  'snapshot',
  'transparency',
  'open to all',
];

function matches(haystack: string, terms: string[]): boolean {
  return terms.some((term) =>
    new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`).test(haystack)
  );
}

/**
 * Whether a recurring event is a standing obligation to report to the DAO.
 *
 * These are the most valuable recurring events the timeline can carry — a
 * transparency report, a quarterly treasury statement, a public disclosure —
 * and the easiest for the model to misread, because the body producing them is
 * always a specific one. DIP-43's "the Foundation will publish to the
 * ssv.network forum a report" is written entirely in terms of the Foundation,
 * yet the DAO is who it is for.
 *
 * So this is checked before the model's own label and overrides it. The rule
 * is deliberately an allowlist: a false positive keeps one extra event, while
 * a false negative loses a report the DAO is owed.
 */
export function isPublicReportingObligation(event: AIExtractedEvent): boolean {
  const haystack = [event.title, event.description, event.excerpt]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return matches(haystack, REPORTING_TERMS) && matches(haystack, PUBLIC_TERMS);
}

/**
 * Whether an extracted event belongs on the timeline.
 *
 * One-off events are kept as before — this gate exists only to stop
 * role-internal cadences from becoming permanent fixtures.
 */
export function isTimelineWorthy(event: AIExtractedEvent): boolean {
  if (!event.recurrence) return true;

  if (isPublicReportingObligation(event)) return true;

  return event.recurrence.audience === 'community';
}

/**
 * Split events into the ones to show and the count of those dropped.
 */
export function filterTimelineWorthy<T extends AIExtractedEvent>(
  events: T[]
): { kept: T[]; filtered: number } {
  const kept = events.filter(isTimelineWorthy);
  return { kept, filtered: events.length - kept.length };
}
