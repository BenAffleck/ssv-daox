/**
 * Gnosis Guild Delegation API configuration
 */

/**
 * Base URL for the Gnosis delegation API
 */
export const GNOSIS_API_BASE_URL = 'https://delegate-api.gnosisguild.org/api/v1';

/**
 * SSV Network space identifier on mainnet
 */
export const SSV_SPACE_ID = 'mainnet.ssvnetwork.eth';

/**
 * Cache duration in seconds for voting power data
 * 5 minutes (consistent with other API caches)
 */
export const GNOSIS_CACHE_SECONDS = 300;

/**
 * Maximum concurrent API requests to avoid rate limiting
 */
export const GNOSIS_BATCH_SIZE = 5;

/**
 * SSV Network voting strategy payload for the pin endpoint
 * Uses split-delegation strategy with vesting balance + ERC20 balance
 */
export const SSV_STRATEGY_PAYLOAD = {
  strategy: {
    name: 'split-delegation',
    network: '1',
    params: {
      delegationOverride: false,
      totalSupply: 0,
      strategies: [
        {
          name: 'contract-call',
          params: {
            symbol: 'SSV',
            address: '0xB8471180C79A0a69C7790A1CCf62e91b3c3559Bf',
            decimals: 18,
            methodABI: {
              name: 'totalVestingBalanceOf',
              type: 'function',
              inputs: [
                {
                  name: '_holder',
                  type: 'address',
                  internalType: 'address',
                },
              ],
              outputs: [
                {
                  name: 'balance',
                  type: 'uint256',
                  internalType: 'uint256',
                },
              ],
              payable: false,
              constant: true,
              stateMutability: 'view',
            },
          },
        },
        {
          name: 'erc20-balance-of',
          params: {
            symbol: 'SSV',
            address: '0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54',
            decimals: 18,
          },
        },
      ],
    },
  },
};

/**
 * Configuration object for Gnosis API
 */
export const GNOSIS_CONFIG = {
  apiBaseUrl: GNOSIS_API_BASE_URL,
  spaceId: SSV_SPACE_ID,
  cacheSeconds: GNOSIS_CACHE_SECONDS,
  batchSize: GNOSIS_BATCH_SIZE,
  strategyPayload: SSV_STRATEGY_PAYLOAD,
} as const;
