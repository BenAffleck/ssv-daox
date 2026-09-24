import { Suspense } from 'react';

import DelegatesTable from '@/components/dao-delegates/DelegatesTable';
import { fetchLeaderboard, fetchScoreHealth } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { buildEligibilityLists } from '@/lib/dao-delegates/eligibility/checker';
import { transformDelegates } from '@/lib/dao-delegates/logic/data-transformer';
import { fetchVotingPower } from '@/lib/gnosis';
import { fetchActiveVoteStatus } from '@/lib/snapshot/api/fetch-active-vote-status';
import { fetchAllCommitteeMembers } from '@/lib/snapshot/api/fetch-all-committees';
import { fetchConfiguredDelegationRecipients } from '@/lib/snapshot/api/fetch-delegation-recipients';
import { fetchVoteParticipation } from '@/lib/snapshot/api/fetch-vote-participation';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';

// Without it, a build that lacks DELEGATE_SCORE_API_URL would freeze the notice.
export const revalidate = 300;

export const metadata = {
  title: 'DAO Delegates - DAOx',
  description: 'View and explore DAO delegates leaderboard',
};

function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="mb-2">DAO Delegates</h1>
      <p className="text-[15px] text-muted">
        Explore DAO delegates, their Delegate Score and cohort allocation
      </p>
      {children}
    </div>
  );
}

export default async function DaoDelegatesPage() {
  if (!DELEGATE_SCORE_CONFIG.apiBaseUrl) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <PageHeader />
        <div className="card p-14 text-center">
          <p className="font-body text-[15px] text-muted">
            Delegate data is unavailable: DELEGATE_SCORE_API_URL is not configured.
          </p>
        </div>
      </div>
    );
  }

  const [leaderboard, health, committees, delegationRecipients, voteParticipation, activeVoteData] =
    await Promise.all([
      fetchLeaderboard(),
      fetchScoreHealth(),
      fetchAllCommitteeMembers(),
      fetchConfiguredDelegationRecipients(),
      fetchVoteParticipation(SNAPSHOT_CONFIG.delegation.spaceFilter),
      fetchActiveVoteStatus(SNAPSHOT_CONFIG.delegation.spaceFilter),
    ]);

  const lists = buildEligibilityLists(committees, SNAPSHOT_CONFIG.fixedLists, delegationRecipients);

  // Only fetch voting power for addresses that are already receiving delegation
  // Others can fetch on-demand via the API to reduce initial page load time
  const votingPower = await fetchVotingPower(delegationRecipients);

  const delegates = transformDelegates(
    leaderboard.rows,
    lists,
    voteParticipation,
    votingPower,
    activeVoteData,
  );

  const isStale = health !== null && health.status !== 'ok';

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader>
        <p className="mt-2 text-[13px] text-muted">
          Scores from run {leaderboard.runId}, as of {leaderboard.asOf} (UTC). Scores are rounded
          for display.
        </p>
        {isStale && (
          <p className="mt-2 text-[13px] text-warning">
            Score data is {health.status}
            {health.as_of && ` (latest as-of ${health.as_of}`}
            {health.age_hours !== null && `, ${Math.round(health.age_hours)} h old`}
            {health.as_of && ')'}. Figures may be out of date.
          </p>
        )}
      </PageHeader>

      <Suspense>
        <DelegatesTable delegates={delegates} />
      </Suspense>
    </div>
  );
}
