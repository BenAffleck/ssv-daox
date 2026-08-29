import { describe, expect, it } from 'vitest';

import { EventSource, SerializedEvent } from '@/lib/dao-timeline/types';
import { generateICS } from '@/lib/dao-timeline/utils/calendar-export';

function makeEvent(overrides: Partial<SerializedEvent> = {}): SerializedEvent {
  return {
    id: 'test-123',
    sourceId: 'src-1',
    title: 'Test Event',
    description: null,
    startDate: '2025-06-15T14:00:00.000Z',
    endDate: '2025-06-15T16:00:00.000Z',
    isAllDay: false,
    source: EventSource.ICS,
    sourceName: 'Test Source',
    sourceUrl: null,
    location: null,
    isRecurring: false,
    recurrenceId: null,
    recurrence: null,
    metadata: {},
    ...overrides,
  };
}

describe('generateICS', () => {
  it('generates valid ICS for a timed event', () => {
    const ics = generateICS(makeEvent());

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20250615T140000Z');
    expect(ics).toContain('DTEND:20250615T160000Z');
    expect(ics).toContain('SUMMARY:Test Event');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('generates VALUE=DATE format for all-day events', () => {
    const ics = generateICS(
      makeEvent({
        isAllDay: true,
        startDate: '2025-06-15T00:00:00.000Z',
        endDate: '2025-06-16T00:00:00.000Z',
      }),
    );

    expect(ics).toContain('DTSTART;VALUE=DATE:20250615');
    expect(ics).toContain('DTEND;VALUE=DATE:20250616');
    expect(ics).not.toMatch(/DTSTART:\d{8}T/);
  });

  it('escapes special characters in title and description', () => {
    const ics = generateICS(
      makeEvent({
        title: 'Meeting; with, commas\\and backslash',
        description: 'Line one\nLine two; semicolons, commas',
      }),
    );

    expect(ics).toContain('SUMMARY:Meeting\\; with\\, commas\\\\and backslash');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two\\; semicolons\\, commas');
  });

  it('omits DTEND when endDate is null', () => {
    const ics = generateICS(makeEvent({ endDate: null }));

    expect(ics).not.toContain('DTEND');
  });

  it('includes location and URL when provided', () => {
    const ics = generateICS(
      makeEvent({
        location: 'Zurich, Switzerland',
        sourceUrl: 'https://example.com/event',
      }),
    );

    expect(ics).toContain('LOCATION:Zurich\\, Switzerland');
    expect(ics).toContain('URL:https://example.com/event');
  });

  it('exports the whole series when the event recurs', () => {
    const ics = generateICS(
      makeEvent({
        id: 'main-calendar-evt::2026-03-18',
        isRecurring: true,
        recurrenceId: 'evt',
        recurrence: {
          rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=WE',
          summary: 'Every 2 weeks on Wed',
          exceptions: ['2026-03-25'],
        },
      }),
    );

    // Adding a collapsed occurrence to a calendar should subscribe the user to
    // the cadence, not to one meeting.
    expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=WE');
    expect(ics).toContain('EXDATE;VALUE=DATE:20260325');
  });

  it('exports every occurrence of a series under one UID', () => {
    const series: Partial<SerializedEvent> = {
      isRecurring: true,
      recurrenceId: 'evt',
      recurrence: {
        rrule: 'FREQ=WEEKLY;BYDAY=WE',
        summary: 'Weekly on Wed',
        exceptions: [],
      },
    };

    const first = generateICS(makeEvent({ ...series, id: 'main-calendar-evt::2026-03-18' }));
    const second = generateICS(makeEvent({ ...series, id: 'main-calendar-evt::2026-03-25' }));

    // Distinct UIDs would make a calendar client file each export as its own
    // separate series.
    expect(first).toContain('UID:main-calendar-evt@daox');
    expect(second).toContain('UID:main-calendar-evt@daox');
  });

  it('omits RRULE for a one-off event', () => {
    expect(generateICS(makeEvent())).not.toContain('RRULE');
  });
});
