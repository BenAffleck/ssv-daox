import { Suspense } from 'react';
import { fetchGovernanceProposals } from '@/lib/snapshot/api/fetch-governance-proposals';
import { getGovernanceSpaces } from '@/lib/snapshot/config';
import { isAISummaryAvailable } from '@/lib/ai-summary';
import GovernanceView from '@/components/dao-governance/GovernanceView';

export const metadata = {
  title: 'Governance Votes - DAOx',
  description:
    'All active and upcoming SSV governance votes across every Snapshot space in one place.',
};

export default async function GovernanceVotesPage() {
  const spaces = getGovernanceSpaces();
  const { proposals, failedSpaces } = await fetchGovernanceProposals(spaces);
  const aiSummaryAvailable = isAISummaryAvailable();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1 className="mb-2">Governance Votes</h1>
        <p className="text-[15px] text-muted">
          Every active and upcoming vote across the SSV DAO&apos;s Snapshot spaces, at a glance.
        </p>
      </div>

      <Suspense>
        <GovernanceView
          proposals={proposals}
          spaces={spaces}
          failedSpaces={failedSpaces}
          isAISummaryAvailable={aiSummaryAvailable}
        />
      </Suspense>
    </div>
  );
}
