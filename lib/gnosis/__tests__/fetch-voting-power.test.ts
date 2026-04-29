import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVotingPower } from '../api/fetch-voting-power';
import { GNOSIS_CONFIG, SSV_STRATEGY_PAYLOAD } from '../config';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const SAMPLE_RESPONSE = {
  votingPower: '1234.5',
  incomingPower: '100.25',
  outgoingPower: '50.75',
  delegators: ['0xaaa1111111111111111111111111111111111111'],
  percentOfVotingPower: '0.42',
  blockNumber: '20000000',
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function notOk(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

describe('fetchVotingPower', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns an empty map for an empty input', async () => {
    const result = await fetchVotingPower([]);
    expect(result).toEqual({});
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('posts the configured strategy payload to the pin endpoint for the given address', async () => {
    mockFetch.mockResolvedValueOnce(ok(SAMPLE_RESPONSE));

    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const result = await fetchVotingPower([address]);

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      `${GNOSIS_CONFIG.apiBaseUrl}/${GNOSIS_CONFIG.spaceId}/pin/${address}`
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(SSV_STRATEGY_PAYLOAD);

    expect(result[address.toLowerCase()]).toEqual({
      votingPower: 1234.5,
      incomingPower: 100.25,
      outgoingPower: 50.75,
      delegatorCount: 1,
      delegators: SAMPLE_RESPONSE.delegators,
      percentOfVotingPower: 0.42,
      blockNumber: '20000000',
    });
  });

  it('keys the result map by lowercased address', async () => {
    mockFetch.mockResolvedValueOnce(ok(SAMPLE_RESPONSE));
    const mixedCase = '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12';
    const result = await fetchVotingPower([mixedCase]);
    expect(Object.keys(result)).toEqual([mixedCase.toLowerCase()]);
  });

  it('batches requests according to GNOSIS_CONFIG.batchSize', async () => {
    const addresses = Array.from(
      { length: 12 },
      (_, i) => `0x${String(i).padStart(40, '0')}`
    );

    mockFetch.mockResolvedValue(ok(SAMPLE_RESPONSE));

    const result = await fetchVotingPower(addresses);

    expect(mockFetch).toHaveBeenCalledTimes(addresses.length);
    expect(Object.keys(result)).toHaveLength(addresses.length);
    for (const addr of addresses) {
      expect(result[addr.toLowerCase()]).toBeDefined();
    }
  });

  it('omits addresses whose fetch returns a non-OK response', async () => {
    const okAddr = '0x1111111111111111111111111111111111111111';
    const badAddr = '0x2222222222222222222222222222222222222222';

    mockFetch
      .mockResolvedValueOnce(ok(SAMPLE_RESPONSE))
      .mockResolvedValueOnce(notOk(429));

    const result = await fetchVotingPower([okAddr, badAddr]);

    expect(result[okAddr.toLowerCase()]).toBeDefined();
    expect(result[badAddr.toLowerCase()]).toBeUndefined();
  });

  it('omits addresses whose fetch throws', async () => {
    const okAddr = '0x1111111111111111111111111111111111111111';
    const errAddr = '0x2222222222222222222222222222222222222222';

    mockFetch
      .mockResolvedValueOnce(ok(SAMPLE_RESPONSE))
      .mockRejectedValueOnce(new Error('network down'));

    const result = await fetchVotingPower([okAddr, errAddr]);

    expect(result[okAddr.toLowerCase()]).toBeDefined();
    expect(result[errAddr.toLowerCase()]).toBeUndefined();
  });
});
