import { SerializedEvent } from '@/lib/dao-timeline/types';

/**
 * Escape special characters for ICS text fields (RFC 5545 §3.3.11)
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format a Date as ICS UTC datetime (YYYYMMDDTHHMMSSZ)
 */
function formatICSDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format a Date as ICS date-only (YYYYMMDD)
 */
function formatICSDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generate a valid iCalendar (RFC 5545) string from a SerializedEvent
 */
export function generateICS(event: SerializedEvent): string {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DAOx//Timeline//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@daox`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
  ];

  if (event.isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICSDate(startDate)}`);
    if (endDate) {
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(endDate)}`);
    }
  } else {
    lines.push(`DTSTART:${formatICSDateTime(startDate)}`);
    if (endDate) {
      lines.push(`DTEND:${formatICSDateTime(endDate)}`);
    }
  }

  lines.push(`SUMMARY:${escapeICSText(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.sourceUrl) {
    lines.push(`URL:${event.sourceUrl}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger download of an ICS file for the given event
 */
export function downloadICS(event: SerializedEvent): void {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
