import { getModulesSorted } from '@/lib/data/modules';
import { getExternalToolsSorted } from '@/lib/data/external-tools';
import ModuleCard from '@/components/ModuleCard';
import ExternalToolsSection from '@/components/ExternalToolsSection';
import ActiveVotes from '@/components/ActiveVotes';
import PendingVotes from '@/components/PendingVotes';
import { fetchGovernanceProposals } from '@/lib/snapshot/api/fetch-governance-proposals';
import { isAISummaryAvailable } from '@/lib/ai-summary';

export default async function Home() {
  const modules = getModulesSorted();
  const externalTools = getExternalToolsSorted();

  // Surface live + upcoming votes across all SSV governance spaces (main +
  // committees). Closed proposals are only shown on the dedicated /governance view.
  const { proposals } = await fetchGovernanceProposals(undefined, { includeClosed: false });
  const activeProposals = proposals.filter((p) => p.state === 'active');
  const pendingProposals = proposals.filter((p) => p.state === 'pending');
  const aiSummaryAvailable = isAISummaryAvailable();

  return (
    <div className="container mx-auto max-w-6xl px-6 py-16">
      <div className="mb-14 text-center">
        <h1 className="mb-3 flex items-center justify-center gap-3 text-5xl text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="40" viewBox="100 60 300 340" fill="none" className="flex-shrink-0">
            <path fill="#2DB1FF" d="m204.141 337.252 37.927-46.64c3.96-4.869 11.415-4.869 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.64a9.856 9.856 0 0 1 0-12.445Z" opacity=".62"/>
            <path fill="#2DB1FF" d="m263.064 223.197 37.927-46.64c3.96-4.869 11.415-4.869 15.376 0l37.926 46.64a9.855 9.855 0 0 1 0 12.446l-37.926 46.639c-3.961 4.87-11.416 4.87-15.376 0l-37.927-46.639a9.858 9.858 0 0 1 0-12.446Zm-117.852 0 37.928-46.64c3.96-4.869 11.415-4.869 15.375 0l37.927 46.64a9.858 9.858 0 0 1 0 12.446l-37.927 46.639c-3.96 4.87-11.415 4.87-15.375 0l-37.928-46.639a9.858 9.858 0 0 1 0-12.446Zm58.929-72.899 37.927-46.646c3.96-4.87 11.415-4.87 15.375 0l37.928 46.64a9.856 9.856 0 0 1 0 12.445l-37.928 46.64c-3.96 4.87-11.415 4.87-15.375 0l-37.927-46.634a9.856 9.856 0 0 1 0-12.445Z"/>
          </svg>
          DAOx
        </h1>
        <p className="font-body text-muted">
          Your governance toolkit for the SSV Network
        </p>
      </div>

      {activeProposals.length > 0 && <ActiveVotes proposals={activeProposals} isAISummaryAvailable={aiSummaryAvailable} />}
      {pendingProposals.length > 0 && <PendingVotes proposals={pendingProposals} isAISummaryAvailable={aiSummaryAvailable} />}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      {externalTools.length > 0 && (
        <ExternalToolsSection tools={externalTools} />
      )}
    </div>
  );
}
