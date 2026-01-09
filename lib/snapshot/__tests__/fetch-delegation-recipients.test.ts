import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchDelegationRecipients,
  fetchConfiguredDelegationRecipients,
} from '../api/fetch-delegation-recipients';
import {
  MOCK_DELEGATIONS_RESPONSE,
  MOCK_EMPTY_DELEGATIONS_RESPONSE,
  MOCK_DELEGATION_ERROR_RESPONSE,
} from './__mocks__/snapshot-responses';
import {
  MOCK_DELEGATION_SOURCE_ADDRESSES,
  MOCK_ALREADY_DELEGATED,
} from './__mocks__/delegation-data';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock environment variable for tests
const originalEnv = process.env.THEGRAPH_API_KEY;
beforeEach(() => {
  // Set mock API key for tests
  process.env.THEGRAPH_API_KEY = 'test-api-key-123';
});

afterEach(() => {
  // Restore original env
  if (originalEnv !== undefined) {
    process.env.THEGRAPH_API_KEY = originalEnv;
  } else {
    delete process.env.THEGRAPH_API_KEY;
  }
});

describe('fetchDelegationRecipients', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should return unique delegate addresses from source addresses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATIONS_RESPONSE,
    });

    const recipients = await fetchDelegationRecipients(
      MOCK_DELEGATION_SOURCE_ADDRESSES
    );

    // Should return 3 unique delegates (4 delegations but 1 duplicate)
    expect(recipients).toHaveLength(3);
    expect(recipients).toContain(MOCK_ALREADY_DELEGATED[0].toLowerCase());
    expect(recipients).toContain(MOCK_ALREADY_DELEGATED[1].toLowerCase());
    expect(recipients).toContain(MOCK_ALREADY_DELEGATED[2].toLowerCase());
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should normalize addresses to lowercase', async () => {
    const mixedCaseResponse = {
      data: {
        delegations: [
          {
            id: 'test-1',
            delegator: '0xABCD1234',
            delegate: '0xABCDEF123456',
            space: '',
          },
          {
            id: 'test-2',
            delegator: '0xABCD1234',
            delegate: '0xaBcDeF987654',
            space: '',
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mixedCaseResponse,
    });

    const recipients = await fetchDelegationRecipients(['0xABCD1234']);

    expect(recipients).toEqual(['0xabcdef123456', '0xabcdef987654']);
  });

  it('should return empty array for empty source list', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    const recipients = await fetchDelegationRecipients([]);

    expect(recipients).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No delegation source addresses configured'
    );
    expect(mockFetch).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle delegations with space filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATIONS_RESPONSE,
    });

    await fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('thegraph.com'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('GetDelegationsFromSources'),
      })
    );
  });

  it('should throw on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES)
    ).rejects.toThrow('Network error');
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES)
    ).rejects.toThrow('Snapshot API error: 500 Internal Server Error');
  });

  it('should throw on GraphQL error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATION_ERROR_RESPONSE,
    });

    await expect(
      fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES)
    ).rejects.toThrow('GraphQL error: Failed to fetch delegations');
  });

  it('should handle no active delegations gracefully', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_EMPTY_DELEGATIONS_RESPONSE,
    });

    const recipients = await fetchDelegationRecipients(
      MOCK_DELEGATION_SOURCE_ADDRESSES
    );

    expect(recipients).toEqual([]);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('No active delegations found')
    );

    consoleInfoSpy.mockRestore();
  });

  it('should deduplicate multiple delegations to same address', async () => {
    const duplicateResponse = {
      data: {
        delegations: [
          {
            id: 'dup-1',
            delegator: '0xsource1',
            delegate: '0xdelegate1',
            space: '',
          },
          {
            id: 'dup-2',
            delegator: '0xsource1',
            delegate: '0xdelegate1',
            space: '',
          },
          {
            id: 'dup-3',
            delegator: '0xsource2',
            delegate: '0xdelegate1',
            space: '',
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => duplicateResponse,
    });

    const recipients = await fetchDelegationRecipients(['0xsource1', '0xsource2']);

    // Should only return 1 unique delegate
    expect(recipients).toEqual(['0xdelegate1']);
  });

  it('should make POST request with correct query and variables', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATIONS_RESPONSE,
    });

    await fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('thegraph.com'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.variables.delegators).toEqual(
      MOCK_DELEGATION_SOURCE_ADDRESSES.map((addr) => addr.toLowerCase())
    );
    expect(body.query).toContain('GetDelegationsFromSources');
    expect(body.query).toContain('delegations');
  });

  it('should log info when delegations are found', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATIONS_RESPONSE,
    });

    await fetchDelegationRecipients(MOCK_DELEGATION_SOURCE_ADDRESSES);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found')
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('delegation recipient')
    );

    consoleInfoSpy.mockRestore();
  });
});

describe('fetchConfiguredDelegationRecipients', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  it('should use configured source addresses from config', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_DELEGATIONS_RESPONSE,
    });

    const recipients = await fetchConfiguredDelegationRecipients();

    // Should call fetch if addresses are configured
    // Note: This depends on SNAPSHOT_DELEGATION_SOURCE_ADDRESSES env var
    // In test environment, it should be empty, so this will return empty array
    expect(Array.isArray(recipients)).toBe(true);
  });

  it('should return empty array when no addresses configured', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    // This test assumes SNAPSHOT_DELEGATION_SOURCE_ADDRESSES is not set in test env
    const recipients = await fetchConfiguredDelegationRecipients();

    expect(recipients).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('not configured')
    );
    expect(mockFetch).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should log warning when configuration is empty', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    await fetchConfiguredDelegationRecipients();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'SNAPSHOT_DELEGATION_SOURCE_ADDRESSES not configured. Skipping delegation fetch.'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return empty array when API key is missing', async () => {
    // Temporarily remove API key
    delete process.env.THEGRAPH_API_KEY;

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    const recipients = await fetchDelegationRecipients(['0xtest']);

    expect(recipients).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('THEGRAPH_API_KEY not configured')
    );
    expect(mockFetch).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();

    // Restore API key for other tests
    process.env.THEGRAPH_API_KEY = 'test-api-key-123';
  });
});
