import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

const ADDRESS = '0x1111111111111111111111111111111111111111';

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
});
