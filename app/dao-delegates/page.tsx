import { fetchDelegatesCSV } from '@/lib/dao-delegates/api/fetch-delegates';
import { parseCSV } from '@/lib/dao-delegates/api/parse-csv';
import { buildEligibilityLists } from '@/lib/dao-delegates/eligibility/checker';
import { transformDelegates } from '@/lib/dao-delegates/logic/data-transformer';
import { calculateRanks } from '@/lib/dao-delegates/logic/rank-calculator';
import { assignDelegationPrograms } from '@/lib/dao-delegates/logic/program-assigner';
import { fetchAllCommitteeMembers } from '@/lib/snapshot/api/fetch-all-committees';
import { fetchConfiguredDelegationRecipients } from '@/lib/snapshot/api/fetch-delegation-recipients';
import { fetchVoteParticipation } from '@/lib/snapshot/api/fetch-vote-participation';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';
import { fetchVotingPower } from '@/lib/gnosis';
import DelegatesTable from '@/components/dao-delegates/DelegatesTable';

export const metadata = {
  title: 'DAO Delegates - DAOx',
  description: 'View and explore DAO delegates leaderboard',
};

export default async function DaoDelegatesPage() {
  // Fetch external data in parallel (CSV, committee data, delegation recipients, and vote participation)
  const [csvData, committees, delegationRecipients, voteParticipation] =
    await Promise.all([
      fetchDelegatesCSV(),
      fetchAllCommitteeMembers(),
      fetchConfiguredDelegationRecipients(),
      fetchVoteParticipation(SNAPSHOT_CONFIG.delegation.spaceFilter),
    ]);

  // Parse CSV into objects
  const csvDelegates = parseCSV(csvData);

  // Build eligibility lists with injected committee, fixed lists, and delegation data
  const lists = buildEligibilityLists(
    committees,
    SNAPSHOT_CONFIG.fixedLists,
    delegationRecipients
  );

  // Only fetch voting power for addresses that are already receiving delegation
  // Others can fetch on-demand via the API to reduce initial page load time
  const votingPower = await fetchVotingPower(delegationRecipients);

  // Transform CSV data to Delegate objects (including vote participation and voting power)
  let delegates = transformDelegates(
    csvDelegates,
    lists,
    voteParticipation,
    votingPower
  );

  // Calculate ranks based on karma score
  delegates = calculateRanks(delegates);

  // Assign delegation programs
  delegates = assignDelegationPrograms(delegates);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-heading text-3xl font-semibold text-foreground">
          DAO Delegates
        </h1>
        <p className="text-muted">
          Explore potential DAO delegates and delegation program assignments
        </p>
      </div>

      <DelegatesTable delegates={delegates} />
    </div>
  );
}
