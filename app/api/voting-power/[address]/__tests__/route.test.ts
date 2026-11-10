import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

const ADDRESS = '0x1111111111111111111111111111111111111111';

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag }));

const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

const PIN_RESPONSE = {
  votingPower: '0',
  incomingPower: '0',
  outgoingPower: '5000',
  delegators: [],
  delegates: [],
  delegatorTree: [],
  delegateTree: [],
  percentOfVotingPower: '0',
  blockNumber: '1',
};

function get(query = '') {
  return GET(new Request(`http://localhost/api/voting-power/${ADDRESS}${query}`), {
    params: Promise.resolve({ address: ADDRESS }),
  });
}

describe('GET /api/voting-power/[address]', () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    mockFetch.mockReset().mockResolvedValue({ ok: true, json: async () => PIN_RESPONSE });
  });

  it('reads the cached pin by default', async () => {
    await get();

    expect(mockFetch.mock.calls[0][1].cache).toBeUndefined();
  });

  it('reads the pin uncached with ?fresh=1', async () => {
    const response = await get('?fresh=1');

    expect(response.status).toBe(200);
    expect(mockFetch.mock.calls[0][1].cache).toBe('no-store');
  });

  it('expires the cached pin after a ?fresh=1 read, so the profile stops serving the old value', async () => {
    await get('?fresh=1');

    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith(`gnosis-pin:${ADDRESS}`, { expire: 0 });
  });

  it('keeps the cached pin on a default read', async () => {
    await get();

    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('keeps the cached pin when the ?fresh=1 read fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const response = await get('?fresh=1');

    expect(response.status).toBe(502);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
