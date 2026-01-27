import { describe, it, expect } from 'vitest';
import { parseICS } from '../parsers/ics-parser';

describe('ics-parser', () => {
  describe('parseICS', () => {
    it('should parse a simple ICS file with one event', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:event-123@example.com
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Test Event
DESCRIPTION:This is a test event
LOCATION:Conference Room A
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.uid).toBe('event-123@example.com');
      expect(event.summary).toBe('Test Event');
      expect(event.description).toBe('This is a test event');
      expect(event.location).toBe('Conference Room A');
      expect(event.isAllDay).toBe(false);
      expect(event.dtstart.getUTCHours()).toBe(10);
      expect(event.dtend?.getUTCHours()).toBe(11);
    });

    it('should parse an all-day event', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:allday-123
DTSTART;VALUE=DATE:20240115
DTEND;VALUE=DATE:20240116
SUMMARY:All Day Event
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.isAllDay).toBe(true);
      expect(event.dtstart.getFullYear()).toBe(2024);
      expect(event.dtstart.getMonth()).toBe(0);
      expect(event.dtstart.getDate()).toBe(15);
    });

    it('should parse an event with RRULE', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:recurring-123
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Weekly Meeting
RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.rrule).toBe('FREQ=WEEKLY;BYDAY=MO;COUNT=10');
    });

    it('should handle escaped text in description', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:escaped-123
DTSTART:20240115T100000Z
SUMMARY:Event with special chars
DESCRIPTION:Line 1\\nLine 2\\, with comma\\; and semicolon
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.description).toBe('Line 1\nLine 2, with comma; and semicolon');
    });

    it('should parse URL property', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:url-123
DTSTART:20240115T100000Z
SUMMARY:Event with URL
URL:https://example.com/event
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.url).toBe('https://example.com/event');
    });

    it('should parse multiple events', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1
DTSTART:20240115T100000Z
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
UID:event-2
DTSTART:20240116T100000Z
SUMMARY:Event 2
END:VEVENT
BEGIN:VEVENT
UID:event-3
DTSTART:20240117T100000Z
SUMMARY:Event 3
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(3);
      expect(events[0].uid).toBe('event-1');
      expect(events[1].uid).toBe('event-2');
      expect(events[2].uid).toBe('event-3');
    });

    it('should skip events without UID', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20240115T100000Z
SUMMARY:Event without UID
END:VEVENT
BEGIN:VEVENT
UID:valid-event
DTSTART:20240116T100000Z
SUMMARY:Valid Event
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);
      expect(events[0].uid).toBe('valid-event');
    });

    it('should use "Untitled Event" for missing summary', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:no-summary
DTSTART:20240115T100000Z
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Untitled Event');
    });

    it('should handle folded lines (RFC 5545)', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:folded-123
DTSTART:20240115T100000Z
SUMMARY:Event with a very long title that needs to be
 folded across multiple lines
DESCRIPTION:This description also has
 \tfolded content with tab
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(icsContent);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain('folded across multiple lines');
    });

    it('should return empty array for empty ICS', () => {
      const events = parseICS('');
      expect(events).toHaveLength(0);
    });
  });
});
