/**
 * Snapshot.org API configuration
 */

/**
 * Snapshot GraphQL API endpoint (for spaces, proposals, votes)
 */
export const SNAPSHOT_API_URL = 'https://hub.snapshot.org/graphql';

/**
 * The Graph Snapshot subgraph ID
 */
const SNAPSHOT_SUBGRAPH_ID = '4YgtogVaqoM8CErHWDK8mKQ825BcVdKB8vBYmb4avAQo';

/**
 * Gets The Graph API endpoint for Snapshot subgraph (for delegations)
 * Requires API key from thegraph.com/studio/apikeys
 * Computed dynamically to support test mocking
 */
export function getSnapshotSubgraphUrl(): string {
  return process.env.THEGRAPH_API_KEY
    ? `https://gateway.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/${SNAPSHOT_SUBGRAPH_ID}`
    : '';
}

/**
 * Cache duration in seconds for Snapshot data
 * 5 minutes (consistent with Karma API cache)
 */
export const SNAPSHOT_CACHE_SECONDS = 300;

/**
 * Parses comma-separated addresses from environment variable
 * Validates and normalizes to lowercase
 *
 * @param envValue - Comma-separated string of Ethereum addresses
 * @returns Array of validated lowercase addresses
 */
function parseAddresses(envValue: string | undefined): string[] {
  if (!envValue || !envValue.trim()) {
    return [];
  }

  return envValue
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter((addr) => {
      const isValid = addr.startsWith('0x') && addr.length === 42;
      if (!isValid && addr) {
        console.warn(`Invalid address filtered out: ${addr}`);
      }
      return isValid;
    });
}

/**
 * Snapshot space IDs for each committee type
 * Can be overridden with environment variables
 */
export const SNAPSHOT_CONFIG = {
  apiUrl: SNAPSHOT_API_URL,
  getSubgraphUrl: getSnapshotSubgraphUrl,
  cacheSeconds: SNAPSHOT_CACHE_SECONDS,
  spaces: {
    grantsCommittee:
      process.env.SNAPSHOT_GRANTS_SPACE_ID || '',
    operatorCommittee:
      process.env.SNAPSHOT_OPERATOR_SPACE_ID || '',
    multisigCommittee:
      process.env.SNAPSHOT_MULTISIG_SPACE_ID || '',
  },
  delegation: {
    sourceAddresses: parseAddresses(
      process.env.SNAPSHOT_DELEGATION_SOURCE_ADDRESSES
    ),
    spaceFilter: process.env.SNAPSHOT_DELEGATION_SPACE_FILTER || '',
    maxResults: 1000,
  },
  fixedLists: {
    vipWallets: parseAddresses(process.env.VIP_WALLETS),
    verifiedOperators: parseAddresses(process.env.VERIFIED_OPERATORS),
    grantees: parseAddresses(process.env.GRANTEES),
    professional: parseAddresses(process.env.PROFESSIONAL),
  },
  voteParticipation: {
    proposalCount: 5,
  },
} as const;
