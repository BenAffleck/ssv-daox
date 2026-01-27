/**
 * Fetch and parse ICS calendar data
 */

import { CACHE_REVALIDATE_SECONDS } from '../config';
import { parseICS } from '../parsers/ics-parser';
import { RawICSEvent } from '../types';

/**
 * Fetch ICS data from a URL with caching
 */
export async function fetchICSFromUrl(url: string): Promise<RawICSEvent[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
      headers: {
        Accept: 'text/calendar, application/calendar+json, */*',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ICS from ${url}: ${response.status}`);
      return [];
    }

    const content = await response.text();
    return parseICS(content);
  } catch (error) {
    console.error(`Error fetching ICS from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch ICS data from multiple URLs in parallel
 */
export async function fetchMultipleICS(
  urls: string[]
): Promise<Map<string, RawICSEvent[]>> {
  const results = new Map<string, RawICSEvent[]>();

  const fetchPromises = urls.map(async (url) => {
    const events = await fetchICSFromUrl(url);
    return { url, events };
  });

  const resolved = await Promise.all(fetchPromises);

  for (const { url, events } of resolved) {
    results.set(url, events);
  }

  return results;
}
