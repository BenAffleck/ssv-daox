import { getModulesSorted } from '@/lib/data/modules';
import { getCommunityToolsSorted } from '@/lib/data/community-tools';
import ModuleCard from '@/components/ModuleCard';
import CommunityCard from '@/components/CommunityCard';
import ActiveVotes from '@/components/ActiveVotes';
import { fetchActiveProposals } from '@/lib/snapshot/api/fetch-active-proposals';
import { SNAPSHOT_CONFIG } from '@/lib/snapshot/config';
import { isAISummaryAvailable } from '@/lib/ai-summary';

export default async function Home() {
  const modules = getModulesSorted();
  const communityTools = getCommunityToolsSorted();

  const spaceId = SNAPSHOT_CONFIG.delegation.spaceFilter;
  const activeProposals = spaceId ? await fetchActiveProposals(spaceId) : [];
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      {communityTools.length > 0 && (
        <section className="mt-20">
          <div className="mb-8 text-center">
            <h2 className="mb-1.5 font-heading text-2xl font-semibold tracking-tight text-foreground">
              Featured DAO Community
            </h2>
            <p className="text-sm text-muted">
              Tools built by the SSV community
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {communityTools.map((tool) => (
              <CommunityCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
