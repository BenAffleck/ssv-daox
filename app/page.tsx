import { getModulesSorted } from '@/lib/data/modules';
import ModuleCard from '@/components/ModuleCard';

export default function Home() {
  const modules = getModulesSorted();

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
    </div>
  );
}
