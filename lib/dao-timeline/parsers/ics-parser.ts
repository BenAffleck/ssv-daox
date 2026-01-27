/**
 * ICS (iCalendar) parser following RFC 5545
 */

import { RawICSEvent } from '../types';
import {
  unfoldLines,
  parsePropertyLine,
  parseICSDate,
  unescapeText,
  extractComponents,
} from '../utils/ics-utils';

/**
 * Parse ICS content into an array of raw events
 */
export function parseICS(content: string): RawICSEvent[] {
  // Unfold lines first (handle RFC 5545 line folding)
  const unfolded = unfoldLines(content);

  // Extract VEVENT components
  const eventBlocks = extractComponents(unfolded, 'VEVENT');

  // Parse each event block
  const events: RawICSEvent[] = [];
  for (const block of eventBlocks) {
    const event = parseVEvent(block);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Parse a VEVENT block into a RawICSEvent
 */
function parseVEvent(block: string): RawICSEvent | null {
  const lines = block.split('\n').filter((line) => line.trim());

  // Build a map of properties
  const properties: Record<
    string,
    { params: Record<string, string>; value: string }
  > = {};

  for (const line of lines) {
    const { name, params, value } = parsePropertyLine(line);
    if (name) {
      // Handle multi-value properties by overwriting (last value wins)
      properties[name] = { params, value };
    }
  }

  // UID is required
  const uid = properties.UID?.value;
  if (!uid) {
    return null;
  }

  // SUMMARY is the event title
  const summary = properties.SUMMARY?.value
    ? unescapeText(properties.SUMMARY.value)
    : 'Untitled Event';

  // DESCRIPTION
  const description = properties.DESCRIPTION?.value
    ? unescapeText(properties.DESCRIPTION.value)
    : null;

  // DTSTART is required
  const dtstartProp = properties.DTSTART;
  if (!dtstartProp) {
    return null;
  }
  const { date: dtstart, isAllDay } = parseICSDate(
    dtstartProp.value,
    dtstartProp.params
  );

  // DTEND is optional
  let dtend: Date | null = null;
  const dtendProp = properties.DTEND;
  if (dtendProp) {
    dtend = parseICSDate(dtendProp.value, dtendProp.params).date;
  } else if (properties.DURATION) {
    // If no DTEND, try DURATION
    dtend = parseDuration(dtstart, properties.DURATION.value);
  }

  // LOCATION
  const location = properties.LOCATION?.value
    ? unescapeText(properties.LOCATION.value)
    : null;

  // URL
  const url = properties.URL?.value || null;

  // RRULE (recurrence rule)
  const rrule = properties.RRULE?.value || null;

  return {
    uid,
    summary,
    description,
    dtstart,
    dtend,
    location,
    url,
    rrule,
    isAllDay,
  };
}

/**
 * Parse a DURATION value and add it to a start date
 * Format: P[n]D or P[n]W or PT[n]H[n]M[n]S
 */
function parseDuration(start: Date, duration: string): Date {
  const result = new Date(start);

  // Simple parsing for common formats
  const match = duration.match(
    /P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/
  );

  if (!match) {
    return result;
  }

  const weeks = parseInt(match[1] || '0', 10);
  const days = parseInt(match[2] || '0', 10);
  const hours = parseInt(match[3] || '0', 10);
  const minutes = parseInt(match[4] || '0', 10);
  const seconds = parseInt(match[5] || '0', 10);

  result.setDate(result.getDate() + weeks * 7 + days);
  result.setHours(result.getHours() + hours);
  result.setMinutes(result.getMinutes() + minutes);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
}
