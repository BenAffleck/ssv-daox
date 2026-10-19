/**
 * Snapshot.org API configuration
 */

import type { GovernanceSpace } from './types';

/**
 * Snapshot GraphQL API endpoint (for spaces, proposals, votes)
 */
export const SNAPSHOT_API_URL = 'https://hub.snapshot.org/graphql';

/**
 * Cache duration in seconds for Snapshot data
 * 5 minutes (consistent with other API caches)
 */
export const SNAPSHOT_CACHE_SECONDS = 300;

export const SNAPSHOT_CONFIG = {
  apiUrl: SNAPSHOT_API_URL,
  cacheSeconds: SNAPSHOT_CACHE_SECONDS,
  delegation: {
    spaceFilter: process.env.SNAPSHOT_DELEGATION_SPACE_FILTER || '',
  },
  voteParticipation: {
    proposalCount: 10,
  },
} as const;

/**
 * The five SSV governance Snapshot spaces aggregated by the "Votes at a glance"
 * view. This is the single source of truth: add or remove a space here and the
 * unified view, badges, and filters update automatically — no component changes.
 *
 * Space IDs come from environment variables. Read dynamically (not at module
 * load) so tests can control them. Spaces with an unset id are filtered out so
 * the view degrades gracefully when a space is not yet configured.
 */
export function getGovernanceSpaces(): GovernanceSpace[] {
  const spaces: GovernanceSpace[] = [
    {
      key: 'main',
      label: 'DAO',
      spaceId: process.env.SNAPSHOT_DELEGATION_SPACE_FILTER || '',
      voteType: 'token',
    },
    {
      key: 'leads',
      label: 'Leads',
      spaceId: process.env.SNAPSHOT_LEADS_SPACE_ID || '',
      voteType: 'member',
    },
    {
      key: 'operator',
      label: 'Operators',
      spaceId: process.env.SNAPSHOT_OPERATOR_SPACE_ID || '',
      voteType: 'member',
    },
    {
      key: 'grants',
      label: 'Grants',
      spaceId: process.env.SNAPSHOT_GRANTS_SPACE_ID || '',
      voteType: 'member',
    },
    {
      key: 'multisig',
      label: 'Multisig',
      spaceId: process.env.SNAPSHOT_MULTISIG_SPACE_ID || '',
      voteType: 'member',
    },
  ];

  return spaces.filter((space) => space.spaceId !== '');
}
