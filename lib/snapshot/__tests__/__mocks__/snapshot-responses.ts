/**
 * Mock GraphQL responses from Snapshot.org API
 * Used for testing without making actual API calls
 */

import type { DelegationsQueryResponse, SnapshotGraphQLResponse } from '../../types';
import { MOCK_ALREADY_DELEGATED, MOCK_DELEGATION_SOURCE_ADDRESSES } from './delegation-data';

/**
 * Mock delegation responses
 */

/**
 * Mock response with delegation data
 * Simulates delegations FROM source addresses TO delegate recipients
 */
export const MOCK_DELEGATIONS_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> = {
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
export const MOCK_EMPTY_DELEGATIONS_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> = {
  data: {
    delegations: [],
  },
};

/**
 * Mock delegation error response
 */
export const MOCK_DELEGATION_ERROR_RESPONSE: SnapshotGraphQLResponse<DelegationsQueryResponse> = {
  data: null,
  errors: [
    {
      message: 'Failed to fetch delegations',
      locations: [{ line: 2, column: 3 }],
      path: ['delegations'],
    },
  ],
};
