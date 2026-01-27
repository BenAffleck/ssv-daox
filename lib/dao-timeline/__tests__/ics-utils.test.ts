import { describe, it, expect } from 'vitest';
import {
  unfoldLines,
  parsePropertyLine,
  parseICSDate,
  unescapeText,
  extractComponents,
} from '../utils/ics-utils';

describe('ics-utils', () => {
  describe('unfoldLines', () => {
    it('should unfold lines with CRLF and space', () => {
      const input = 'DESCRIPTION:This is a long\r\n  description that continues';
      const result = unfoldLines(input);
      expect(result).toBe('DESCRIPTION:This is a long description that continues');
    });

    it('should unfold lines with LF and tab', () => {
      const input = 'DESCRIPTION:Line one\n\tcontinued';
      const result = unfoldLines(input);
      expect(result).toBe('DESCRIPTION:Line onecontinued');
    });

    it('should not affect regular lines', () => {
      const input = 'LINE1:value1\nLINE2:value2';
      const result = unfoldLines(input);
      expect(result).toBe('LINE1:value1\nLINE2:value2');
    });
  });

  describe('parsePropertyLine', () => {
    it('should parse simple property', () => {
      const result = parsePropertyLine('SUMMARY:My Event');
      expect(result.name).toBe('SUMMARY');
      expect(result.params).toEqual({});
      expect(result.value).toBe('My Event');
    });

    it('should parse property with parameters', () => {
      const result = parsePropertyLine('DTSTART;VALUE=DATE:20240115');
      expect(result.name).toBe('DTSTART');
      expect(result.params).toEqual({ VALUE: 'DATE' });
      expect(result.value).toBe('20240115');
    });

    it('should parse property with multiple parameters', () => {
      const result = parsePropertyLine('DTSTART;VALUE=DATE-TIME;TZID=America/New_York:20240115T100000');
      expect(result.name).toBe('DTSTART');
      expect(result.params).toEqual({
        VALUE: 'DATE-TIME',
        TZID: 'America/New_York',
      });
      expect(result.value).toBe('20240115T100000');
    });
  });

  describe('parseICSDate', () => {
    it('should parse DATE value (all-day)', () => {
      const result = parseICSDate('20240115', { VALUE: 'DATE' });
      expect(result.isAllDay).toBe(true);
      expect(result.date.getFullYear()).toBe(2024);
      expect(result.date.getMonth()).toBe(0); // January
      expect(result.date.getDate()).toBe(15);
    });

    it('should parse DATE-TIME value (local)', () => {
      const result = parseICSDate('20240115T100000', {});
      expect(result.isAllDay).toBe(false);
      expect(result.date.getHours()).toBe(10);
      expect(result.date.getMinutes()).toBe(0);
    });

    it('should parse DATE-TIME value with Z (UTC)', () => {
      const result = parseICSDate('20240115T100000Z', {});
      expect(result.isAllDay).toBe(false);
      // UTC time should be converted
      expect(result.date.getUTCHours()).toBe(10);
      expect(result.date.getUTCMinutes()).toBe(0);
    });

    it('should infer all-day from value length', () => {
      const result = parseICSDate('20240115', {});
      expect(result.isAllDay).toBe(true);
    });
  });

  describe('unescapeText', () => {
    it('should unescape newlines', () => {
      expect(unescapeText('Line 1\\nLine 2')).toBe('Line 1\nLine 2');
      expect(unescapeText('Line 1\\NLine 2')).toBe('Line 1\nLine 2');
    });

    it('should unescape backslashes', () => {
      expect(unescapeText('Path\\\\to\\\\file')).toBe('Path\\to\\file');
    });

    it('should unescape commas and semicolons', () => {
      expect(unescapeText('Value\\,with\\;special')).toBe('Value,with;special');
    });
  });

  describe('extractComponents', () => {
    it('should extract VEVENT components', () => {
      const content = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event1
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
UID:event2
SUMMARY:Event 2
END:VEVENT
END:VCALENDAR`;

      const events = extractComponents(content, 'VEVENT');
      expect(events).toHaveLength(2);
      expect(events[0]).toContain('UID:event1');
      expect(events[1]).toContain('UID:event2');
    });

    it('should return empty array for no matches', () => {
      const events = extractComponents('BEGIN:VCALENDAR\nEND:VCALENDAR', 'VEVENT');
      expect(events).toHaveLength(0);
    });
  });
});
