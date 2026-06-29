import { getGovernanceSpaces } from '../config';
import type {
  GovernanceProposal,
  GovernanceProposalsResult,
  GovernanceSpace,
} from '../types';
import { executeProposalsQuery } from './execute-proposals-query';
import { ACTIVE_PROPOSALS_QUERY } from './fetch-active-proposals';
import { PENDING_PROPOSALS_QUERY } from './fetch-pending-proposals';
import { CLOSED_PROPOSALS_QUERY } from './fetch-closed-proposals';

/** Number of most-recent closed proposals to fetch per space. */
export const CLOSED_PROPOSALS_PER_SPACE = 20;

/**
 * Fetches active + pending (+ optionally recent closed) proposals for a single
 * space and tags each with the space. Throws if any query fails so the caller
 * can report the space as failed (vs. genuinely empty).
 */
async function fetchSpaceProposals(
  space: GovernanceSpace,
  includeClosed: boolean
): Promise<GovernanceProposal[]> {
  const queries = [
    executeProposalsQuery(ACTIVE_PROPOSALS_QUERY, { spaceId: space.spaceId }),
    executeProposalsQuery(PENDING_PROPOSALS_QUERY, { spaceId: space.spaceId }),
  ];
  if (includeClosed) {
    queries.push(
      executeProposalsQuery(CLOSED_PROPOSALS_QUERY, {
        spaceId: space.spaceId,
        limit: CLOSED_PROPOSALS_PER_SPACE,
      })
    );
  }

  const batches = await Promise.all(queries);
  return batches.flat().map((proposal) => ({ ...proposal, space }));
}

/**
 * Sort order: active proposals first, then pending, then closed. Within actives,
 * soonest deadline (`end`) first; within pendings, soonest opening (`start`)
 * first; within closed, most recently ended first.
 */
function compareProposals(
  a: GovernanceProposal,
  b: GovernanceProposal
): number {
  const stateRank = (state: string) =>
    state === 'active' ? 0 : state === 'pending' ? 1 : 2;
  const rankDiff = stateRank(a.state) - stateRank(b.state);
  if (rankDiff !== 0) return rankDiff;

  if (a.state === 'active') return a.end - b.end;
  if (a.state === 'pending') return a.start - b.start;
  return b.end - a.end; // closed: most recent first
}

/**
 * Aggregates active, pending, and (by default) recent closed proposals across
 * all configured SSV governance spaces into a single, sorted list for the
 * "Votes at a glance" view.
 *
 * Each space is fetched independently and in parallel: a failing space is
 * reported in `failedSpaces` (by label) while the others still render, so the
 * UI can distinguish an outage from an empty result.
 *
 * @param spaces - Governance spaces to aggregate (defaults to configured set)
 * @param options.includeClosed - Fetch recent closed proposals (default true);
 *   pass false for surfaces that only show live/upcoming votes (e.g. the home page).
 */
export async function fetchGovernanceProposals(
  spaces: GovernanceSpace[] = getGovernanceSpaces(),
  options: { includeClosed?: boolean } = {}
): Promise<GovernanceProposalsResult> {
  const { includeClosed = true } = options;
  const results = await Promise.allSettled(
    spaces.map((space) => fetchSpaceProposals(space, includeClosed))
  );

  const proposals: GovernanceProposal[] = [];
  const failedSpaces: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      proposals.push(...result.value);
    } else {
      failedSpaces.push(spaces[index].label);
      console.error(
        `Failed to fetch governance proposals for space ${spaces[index].spaceId}:`,
        result.reason
      );
    }
  });

  proposals.sort(compareProposals);

  return { proposals, failedSpaces };
}
