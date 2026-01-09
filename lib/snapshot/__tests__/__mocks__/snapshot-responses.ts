/**
 * Mock GraphQL responses from Snapshot.org API
 * Used for testing without making actual API calls
 */

import {
  MOCK_GRANTS_COMMITTEE,
  MOCK_OPERATOR_COMMITTEE,
  MOCK_MULTISIG_COMMITTEE,
} from './committee-data';
import {
  MOCK_ALREADY_DELEGATED,
  MOCK_DELEGATION_SOURCE_ADDRESSES,
} from './delegation-data';
import type {
  SnapshotGraphQLResponse,
  SpaceQueryResponse,
  DelegationsQueryResponse,
} from '../../types';

/**
 * Creates a mock Snapshot GraphQL response with a whitelist strategy
 */
export function createMockSpaceResponse(
  spaceId: string,
  spaceName: string,
  addresses: string[]
): SnapshotGraphQLResponse<SpaceQueryResponse> {
  return {
    data: {
      space: {
        id: spaceId,
        name: spaceName,
        strategies: [
          {
            network: '1',
            params: {
              symbol: 'VOTE',
              addresses: addresses,
            },
          },
        ],
      },
    },
  };
}

/**
 * Mock response for Grants Committee space
 */
export const MOCK_GRANTS_SPACE_RESPONSE = createMockSpaceResponse(
  'grants.ssvnetwork.eth',
  'Grants Committee',
  MOCK_GRANTS_COMMITTEE
);

/**
 * Mock response for Operator Committee space
 */
export const MOCK_OPERATOR_SPACE_RESPONSE = createMockSpaceResponse(
  'vo.ssvnetwork.eth',
  'Verified Operators',
  MOCK_OPERATOR_COMMITTEE
);

/**
 * Mock response for Multisig Committee space
 */
export const MOCK_MULTISIG_SPACE_RESPONSE = createMockSpaceResponse(
  'msig.ssvnetwork.eth',
  'Msig',
  MOCK_MULTISIG_COMMITTEE
);

/**
 * Mock response for a non-existent space
 */
export const MOCK_NULL_SPACE_RESPONSE: SnapshotGraphQLResponse<SpaceQueryResponse> =
  {
    data: {
      space: null,
    },
  };

/**
 * Mock response with GraphQL error
 */
export const MOCK_ERROR_RESPONSE: SnapshotGraphQLResponse<SpaceQueryResponse> =
  {
    data: null,
    errors: [
      {
        message: 'Rate limited',
        locations: [{ line: 2, column: 3 }],
        path: ['space'],
      },
    ],
  };

/**
 * Mock response for space with no strategies
 */
export const MOCK_EMPTY_STRATEGIES_RESPONSE: SnapshotGraphQLResponse<SpaceQueryResponse> =
  {
    data: {
      space: {
        id: 'empty.eth',
        name: 'Empty Space',
        strategies: [],
      },
    },
  };

/**
 * Mock response for space with strategy but no addresses
 */
export const MOCK_NO_ADDRESSES_RESPONSE: SnapshotGraphQLResponse<SpaceQueryResponse> =
  {
    data: {
      space: {
        id: 'noaddrs.eth',
        name: 'No Addresses',
        strategies: [
          {
            network: '1',
            params: {
              symbol: 'VOTE',
            },
          },
        ],
      },
    },
  };

/**
 * Mock delegation responses
 */

/**
 * Mock response with delegation data
 * Simulates delegations FROM source addresses TO delegate recipients
 */
export const MOCK_DELEGATIONS_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> =
  {
    data: {
      delegations: [
        {
          id: `${MOCK_DELEGATION_SOURCE_ADDRESSES[0]}-ssv.dao.eth-${MOCK_ALREADY_DELEGATED[0]}`,
          delegator: MOCK_DELEGATION_SOURCE_ADDRESSES[0],
          delegate: MOCK_ALREADY_DELEGATED[0],
          space: 'ssv.dao.eth',
        },
        {
          id: `${MOCK_DELEGATION_SOURCE_ADDRESSES[0]}-ssv.dao.eth-${MOCK_ALREADY_DELEGATED[1]}`,
          delegator: MOCK_DELEGATION_SOURCE_ADDRESSES[0],
          delegate: MOCK_ALREADY_DELEGATED[1],
          space: 'ssv.dao.eth',
        },
        {
          id: `${MOCK_DELEGATION_SOURCE_ADDRESSES[1]}--${MOCK_ALREADY_DELEGATED[2]}`,
          delegator: MOCK_DELEGATION_SOURCE_ADDRESSES[1],
          delegate: MOCK_ALREADY_DELEGATED[2],
          space: '',
        },
        // Add a duplicate delegate to test deduplication
        {
          id: `${MOCK_DELEGATION_SOURCE_ADDRESSES[1]}-ssv.dao.eth-${MOCK_ALREADY_DELEGATED[0]}`,
          delegator: MOCK_DELEGATION_SOURCE_ADDRESSES[1],
          delegate: MOCK_ALREADY_DELEGATED[0], // Same as first delegation
          space: 'ssv.dao.eth',
        },
      ],
    },
  };

/**
 * Mock response with no delegations
 */
export const MOCK_EMPTY_DELEGATIONS_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> =
  {
    data: {
      delegations: [],
    },
  };

/**
 * Mock delegation error response
 */
export const MOCK_DELEGATION_ERROR_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> =
  {
    data: null,
    errors: [
      {
        message: 'Failed to fetch delegations',
        locations: [{ line: 2, column: 3 }],
        path: ['delegations'],
      },
    ],
  };
