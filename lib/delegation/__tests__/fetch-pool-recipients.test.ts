import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPoolRecipients } from '../api/fetch-pin';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPoolRecipients', () => {
  it('lists the pool delegates in lowercase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          votingPower: 0,
          incomingPower: 0,
          outgoingPower: 300,
          delegators: [],
          delegateTree: [
            { delegate: '0x2de670a1D8c1DE83D8727295284704bB196bA117', delegatedPower: 200 },
            { delegate: '0x015122A625b45f68E6D795C0Ab99fC7107e4c3B9', delegatedPower: 100 },
          ],
        }),
      }),
    );

    expect(await fetchPoolRecipients()).toEqual([
      '0x2de670a1d8c1de83d8727295284704bb196ba117',
      '0x015122a625b45f68e6d795c0ab99fc7107e4c3b9',
    ]);
  });

  it('is null when the Gnosis API lookup fails, not an empty list', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    expect(await fetchPoolRecipients()).toBeNull();
  });
});
