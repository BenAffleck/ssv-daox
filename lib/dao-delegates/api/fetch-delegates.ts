import { KARMA_API_URL } from '../config';

/**
 * Fetches delegate data from Karma API
 * Returns CSV string
 */
export async function fetchDelegatesCSV(): Promise<string> {
  try {
    const response = await fetch(KARMA_API_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch delegates: ${response.statusText}`);
    }

    const csvData = await response.text();
    return csvData;
  } catch (error) {
    console.error('Error fetching delegates CSV:', error);
    throw error;
  }
}
