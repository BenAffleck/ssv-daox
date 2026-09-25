import { createJsonFile } from './json-file';
import type { OptOutStatus, ScoreApiOptOutClient } from './score-api';

interface MockFile {
  /** Latest request per lowercase address. */
  requests: Record<string, OptOutStatus>;
}

/**
 * Stands in for the Score API opt-out endpoints until they exist. Records the
 * latest request per address in a JSON file, so statuses survive a restart.
 */
export function createMockScoreApiClient(filePath: string): ScoreApiOptOutClient {
  const file = createJsonFile<MockFile>(filePath, () => ({ requests: {} }));

  return {
    mode: 'mock',
    async submit({ typedData }) {
      const { address, action } = typedData.message;
      await file.update((data) => {
        data.requests[address.toLowerCase()] = { action, status: 'pending' };
      });
      return { address, action, status: 'pending' };
    },
    async getStatuses(addresses) {
      const { requests } = await file.read();
      return Object.fromEntries(
        addresses.map((address) => [
          address.toLowerCase(),
          requests[address.toLowerCase()] ?? null,
        ]),
      );
    },
  };
}
