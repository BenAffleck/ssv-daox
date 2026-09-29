import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSnapshotProfile } from '../api/fetch-profile';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const ADDRESS = '0x0B399d2667733659F4A5fDCB030F3E26D26cC0Fe';

function respond(body: unknown, ok = true) {
  mockFetch.mockResolvedValueOnce({ ok, status: ok ? 200 : 500, json: async () => body });
}

describe('fetchSnapshotProfile', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns the Snapshot name and the SSV delegate statement', async () => {
    respond({
      data: {
        user: { name: 'spooky.eth' },
        statements: [{ statement: 'I help write DAO proposals.' }],
      },
    });

    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toEqual({
      name: 'spooky.eth',
      statement: 'I help write DAO proposals.',
    });
  });

  it('treats a missing user, blank name and no statement as absent', async () => {
    respond({ data: { user: null, statements: [] } });
    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toEqual({ name: null, statement: null });

    respond({ data: { user: { name: '  ' }, statements: [{ statement: '' }] } });
    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toEqual({ name: null, statement: null });
  });

  it('returns null when the lookup fails', async () => {
    respond({}, false);
    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toBeNull();

    respond({ data: null, errors: [{ message: 'boom' }] });
    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toBeNull();

    mockFetch.mockRejectedValueOnce(new Error('network'));
    await expect(fetchSnapshotProfile(ADDRESS)).resolves.toBeNull();
  });
});
