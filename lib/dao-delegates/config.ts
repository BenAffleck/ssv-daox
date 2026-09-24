import type { Cohort, PillarKey } from './types';

/**
 * Delegate Score API configuration.
 *
 * The API replaces the retired Karma API. It scores every candidate once per
 * as-of day and allocates the DAO's voting power across cohorts.
 */
export const DELEGATE_SCORE_CONFIG = {
  /** Base URL without trailing slash. Empty when unset. */
  get apiBaseUrl(): string {
    return (process.env.DELEGATE_SCORE_API_URL || '').replace(/\/+$/, '');
  },
  cacheSeconds: 300,
  /** The API's maximum page size. */
  pageSize: 1000,
} as const;

export const PILLAR_LABELS: Record<PillarKey, string> = {
  community: 'Community',
  holdings: 'Holdings',
  votes: 'Votes',
};

export const COHORT_LABELS: Record<Cohort, string> = {
  ssvCommunity: 'SSV Community',
  verifiedOperators: 'Verified Operators',
  professional: 'Professional',
  grantRecipients: 'Grant Recipients',
  ethCommunities: 'ETH Communities',
};
