/**
 * ICS parsing utilities following RFC 5545
 */

/**
 * Unfold lines in ICS content (RFC 5545 line folding)
 * Lines are folded by inserting CRLF + whitespace
 */
export function unfoldLines(content: string): string {
  // Normalize line endings to \n
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Unfold lines: a line that starts with whitespace is a continuation
  return normalized.replace(/\n[ \t]/g, '');
}

/**
 * Parse a property line into name, parameters, and value
 * Format: NAME;PARAM1=VALUE1;PARAM2=VALUE2:value
 */
export function parsePropertyLine(line: string): {
  name: string;
  params: Record<string, string>;
  value: string;
} {
  // Find the first colon that separates property name/params from value
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return { name: '', params: {}, value: line };
  }

  const namePart = line.substring(0, colonIndex);
  const value = line.substring(colonIndex + 1);

  // Check if there are parameters (semicolon in name part)
  const semiIndex = namePart.indexOf(';');
  if (semiIndex === -1) {
    return { name: namePart, params: {}, value };
  }

  const name = namePart.substring(0, semiIndex);
  const paramsStr = namePart.substring(semiIndex + 1);

  // Parse parameters
  const params: Record<string, string> = {};
  const paramParts = paramsStr.split(';');
  for (const part of paramParts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex !== -1) {
      const paramName = part.substring(0, eqIndex);
      const paramValue = part.substring(eqIndex + 1);
      params[paramName] = paramValue;
    }
  }

  return { name, params, value };
}

/**
 * Parse ICS date/time string
 * Formats:
 * - DATE: 20240115 (all-day)
 * - DATE-TIME: 20240115T100000
 * - DATE-TIME with Z: 20240115T100000Z (UTC)
 */
export function parseICSDate(
  value: string,
  params: Record<string, string>
): { date: Date; isAllDay: boolean } {
  // Check if it's a DATE (all-day) value
  const isAllDay = params.VALUE === 'DATE' || value.length === 8;

  if (isAllDay) {
    // Parse DATE format: YYYYMMDD
    const year = parseInt(value.substring(0, 4), 10);
    const month = parseInt(value.substring(4, 6), 10) - 1;
    const day = parseInt(value.substring(6, 8), 10);
    return {
      date: new Date(year, month, day),
      isAllDay: true,
    };
  }

  // Parse DATE-TIME format: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const isUTC = value.endsWith('Z');
  const dateStr = isUTC ? value.slice(0, -1) : value;

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(dateStr.substring(9, 11), 10);
  const minute = parseInt(dateStr.substring(11, 13), 10);
  const second = parseInt(dateStr.substring(13, 15), 10);

  if (isUTC) {
    return {
      date: new Date(Date.UTC(year, month, day, hour, minute, second)),
      isAllDay: false,
    };
  }

  // Local time or TZID specified (treat as local for now)
  return {
    date: new Date(year, month, day, hour, minute, second),
    isAllDay: false,
  };
}

/**
 * Unescape ICS text values
 * Escape sequences: \n, \N (newline), \\, \, \;
 */
export function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\\\/g, '\\')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';');
}

/**
 * Extract component blocks from ICS content
 */
export function extractComponents(
  content: string,
  componentName: string
): string[] {
  const components: string[] = [];
  const startTag = `BEGIN:${componentName}`;
  const endTag = `END:${componentName}`;

  let startIndex = content.indexOf(startTag);
  while (startIndex !== -1) {
    const endIndex = content.indexOf(endTag, startIndex);
    if (endIndex === -1) break;

    const block = content.substring(
      startIndex + startTag.length,
      endIndex
    );
    components.push(block.trim());

    startIndex = content.indexOf(startTag, endIndex);
  }

  return components;
}
