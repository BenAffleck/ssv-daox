import { describe, expect, it } from 'vitest';

import { loadDelegatesCSV } from '../api/load-delegates';
import { parseCSV } from '../api/parse-csv';

describe('loadDelegatesCSV', () => {
  const delegates = parseCSV(loadDelegatesCSV());

  it('reads the frozen snapshot shipped with the repo', () => {
    expect(delegates.length).toBeGreaterThan(0);
  });

  it('exposes every field the transformer consumes', () => {
    for (const delegate of delegates) {
      expect(delegate.publicAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(delegate).toHaveProperty('name');
      expect(delegate).toHaveProperty('ensName');
      expect(delegate).toHaveProperty('karmaScore');
      expect(delegate).toHaveProperty('delegatedTokens');
      expect(delegate).toHaveProperty('delegatorCount');
      expect(delegate).toHaveProperty('status');
      expect(delegate).toHaveProperty('forumHandle');
      expect(delegate).toHaveProperty('discordUsername');
    }
  });
});
