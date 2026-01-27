import { getModulesSorted } from '@/lib/data/modules';
import { getCommunityToolsSorted } from '@/lib/data/community-tools';
import ModuleCard from '@/components/ModuleCard';
import CommunityCard from '@/components/CommunityCard';

export default function Home() {
  const modules = getModulesSorted();
  const communityTools = getCommunityToolsSorted();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-heading text-4xl font-bold text-primary">DAOx</h1>
        <p className="font-body text-lg text-muted">
          Modular hub for SSV Network DAO members
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      {communityTools.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 text-center">
            <h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">
              Featured DAO Community
            </h2>
            <p className="text-sm text-muted">
              Tools built by the SSV community
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {communityTools.map((tool) => (
              <CommunityCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
