import { notFound } from 'next/navigation';
import { getModuleBySlug } from '@/lib/data/modules';
import { ModuleStatus } from '@/lib/types';

interface ModulePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);

  if (!module) {
    notFound();
  }

  if (module.status === ModuleStatus.COMING_SOON) {
    return (
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight text-foreground">
            {module.name}
          </h1>
          <div className="mt-10 rounded-lg bg-muted/50 p-14">
            <p className="font-heading text-2xl font-semibold tracking-tight text-muted">Coming Soon</p>
            <p className="mt-4 font-body text-[15px] text-muted">
              This module is currently under development.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 font-heading text-4xl font-bold tracking-tight text-primary">{module.name}</h1>
      <div className="rounded-lg border border-border bg-card p-8">
        <p className="font-body text-[15px] text-muted">
          Module content will be implemented here.
        </p>
      </div>
    </div>
  );
}
