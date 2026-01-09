import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSpaceMembers } from '../api/fetch-space-members';
import {
  MOCK_GRANTS_SPACE_RESPONSE,
  MOCK_NULL_SPACE_RESPONSE,
  MOCK_ERROR_RESPONSE,
  MOCK_EMPTY_STRATEGIES_RESPONSE,
  MOCK_NO_ADDRESSES_RESPONSE,
} from './__mocks__/snapshot-responses';
import { MOCK_GRANTS_COMMITTEE } from './__mocks__/committee-data';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchSpaceMembers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should return member addresses from valid space with strategies', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_GRANTS_SPACE_RESPONSE,
    });

    const members = await fetchSpaceMembers('grants.ssvnetwork.eth');

    // Addresses should be normalized to lowercase
    expect(members).toEqual(
      MOCK_GRANTS_COMMITTEE.map((addr) => addr.toLowerCase())
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return empty array for non-existent space', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_NULL_SPACE_RESPONSE,
    });

    const members = await fetchSpaceMembers('invalid.eth');

    expect(members).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Snapshot space not found: invalid.eth'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should throw on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchSpaceMembers('test.eth')).rejects.toThrow(
      'Network error'
    );
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchSpaceMembers('test.eth')).rejects.toThrow(
      'Snapshot API error: 500 Internal Server Error'
    );
  });

  it('should throw on GraphQL error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ERROR_RESPONSE,
    });

    await expect(fetchSpaceMembers('test.eth')).rejects.toThrow(
      'GraphQL error: Rate limited'
    );
  });

  it('should return empty array when space has no strategies', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_EMPTY_STRATEGIES_RESPONSE,
    });

    const members = await fetchSpaceMembers('empty.eth');

    expect(members).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No strategies found for space: empty.eth'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return empty array when strategy has no addresses', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_NO_ADDRESSES_RESPONSE,
    });

    const members = await fetchSpaceMembers('noaddrs.eth');

    expect(members).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No addresses found in strategy params for space: noaddrs.eth'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should normalize addresses to lowercase', async () => {
    const mixedCaseAddresses = [
      '0xABCDEF123456789',
      '0xaBcDeF987654321',
      '0xABCDEF111111111',
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          space: {
            id: 'test.eth',
            name: 'Test',
            strategies: [
              {
                network: '1',
                params: {
                  addresses: mixedCaseAddresses,
                },
              },
            ],
          },
        },
      }),
    });

    const members = await fetchSpaceMembers('test.eth');

    expect(members).toEqual(
      mixedCaseAddresses.map((addr) => addr.toLowerCase())
    );
  });

  it('should make POST request with correct query and variables', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_GRANTS_SPACE_RESPONSE,
    });

    await fetchSpaceMembers('grants.ssvnetwork.eth');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hub.snapshot.org/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('GetSpaceStrategies'),
      })
    );

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.variables).toEqual({ spaceId: 'grants.ssvnetwork.eth' });
  });
});
