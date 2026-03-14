import Link from 'next/link';
import { Module, ModuleStatus } from '@/lib/types';

interface ModuleCardProps {
  module: Module;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const isActive = module.status === ModuleStatus.ACTIVE;
  const isComingSoon = module.status === ModuleStatus.COMING_SOON;

  const cardContent = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xl font-semibold text-foreground">{module.name}</h3>
        {isComingSoon && (
          <span className="rounded-full bg-muted/30 px-3 py-1 font-heading text-xs text-muted">
            Coming Soon
          </span>
        )}
        {isActive && (
          <svg className="h-5 w-5 text-muted transition-colors group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{module.description}</p>
    </>
  );

  if (isActive) {
    return (
      <Link
        href={`/${module.slug}`}
        className="group block rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="block rounded-lg border border-border bg-muted/40 p-6 opacity-70">
      {cardContent}
    </div>
  );
}
