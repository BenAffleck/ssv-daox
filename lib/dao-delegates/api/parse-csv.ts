import { KarmaDelegateCSV } from '../types';

/**
 * Parses CSV string into array of delegate objects
 * Handles quoted fields, empty values, and special characters
 */
export function parseCSV(csvString: string): KarmaDelegateCSV[] {
  const lines = csvString.trim().split('\n');

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const delegates: KarmaDelegateCSV[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      console.warn(`Row ${i} has ${values.length} values, expected ${headers.length}`);
      continue;
    }

    const delegate: KarmaDelegateCSV = {} as KarmaDelegateCSV;

    for (let j = 0; j < headers.length; j++) {
      delegate[headers[j]] = values[j];
    }

    delegates.push(delegate);
  }

  return delegates;
}

/**
 * Parses a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}
