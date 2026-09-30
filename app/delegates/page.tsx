import { Suspense } from 'react';

import DelegatesTable from '@/components/dao-delegates/DelegatesTable';
import DelegatesTableSkeleton from '@/components/dao-delegates/DelegatesTableSkeleton';
import PoolBanner from '@/components/dao-delegates/PoolBanner';
import { fetchLeaderboard, fetchScoreHealth } from '@/lib/dao-delegates/api/fetch-leaderboard';
import { DELEGATE_SCORE_CONFIG } from '@/lib/dao-delegates/config';
import { transformDelegates } from '@/lib/dao-delegates/logic/data-transformer';
import type { ScoreRow } from '@/lib/dao-delegates/types';
import { fetchPoolSummary } from '@/lib/delegation/api/fetch-pin';
import { AUTO_DELEGATION_POOL_ADDRESS } from '@/lib/delegation/config';
import { fetchOptOutStatuses } from '@/lib/delegation/opt-out/server';
import { fetchVotingPower } from '@/lib/gnosis';
import { fetchActiveVoteStatus } from '@/lib/snapshot/api/fetch-active-vote-status';
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

async function PoolBannerSection() {
  return <PoolBanner pool={await fetchPoolSummary()} poolAddress={AUTO_DELEGATION_POOL_ADDRESS} />;
}

async function DelegatesTableSection({ rows }: { rows: ScoreRow[] }) {
  const spaceId = SNAPSHOT_CONFIG.delegation.spaceFilter;
  // Voting power starts as soon as the recipients are known, alongside the Snapshot fetches.
  const recipientsWithPower = fetchConfiguredDelegationRecipients().then(
    async (recipients) =>
      [recipients, await fetchVotingPower(prefetchedAddresses(rows, recipients))] as const,
  );
  const [[delegationRecipients, votingPower], voteParticipation, activeVoteData, optOutStatuses] =
    await Promise.all([
      recipientsWithPower,
      fetchVoteParticipation(spaceId),
      fetchActiveVoteStatus(spaceId),
      // Not `row.opt_out`: the opt-out mock records requests the Score API never sees.
      fetchOptOutStatuses(rows.map((row) => row.address)),
    ]);

  const delegates = transformDelegates(
    rows,
    delegationRecipients,
    voteParticipation,
    votingPower,
    activeVoteData,
    optOutStatuses,
  );

  return (
    <Suspense>
      <DelegatesTable delegates={delegates} />
    </Suspense>
  );
}

/**
 * Current recipients (Active, Ending) and cohort holders (Nominated). Other rows fetch voting
 * power on demand via the API to keep the initial load short.
 */
function prefetchedAddresses(rows: ScoreRow[], delegationRecipients: string[]): string[] {
  return [
    ...new Set([
      ...delegationRecipients.map((address) => address.toLowerCase()),
      ...rows.filter((row) => row.cohort !== null).map((row) => row.address.toLowerCase()),
    ]),
  ];
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

  const [leaderboard, health] = await Promise.all([fetchLeaderboard(), fetchScoreHealth()]);

  const isStale = health !== null && health.status !== 'ok';

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader>
        <p className="mt-2 text-[13px] text-muted">
          Scores as of {leaderboard.asOf} UTC, rounded for display.
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

      {/* Both wait on Gnosis pin requests, so they stream in behind the header. */}
      <Suspense>
        <PoolBannerSection />
      </Suspense>

      <Suspense fallback={<DelegatesTableSkeleton />}>
        <DelegatesTableSection rows={leaderboard.rows} />
      </Suspense>
    </div>
  );
}
