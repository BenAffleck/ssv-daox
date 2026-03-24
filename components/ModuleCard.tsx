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
        <h3>{module.name}</h3>
        {isComingSoon && (
          <span className="badge-sm-muted font-heading">
            Coming Soon
          </span>
        )}
        {isActive && (
          <svg className="h-5 w-5 text-muted transition-colors group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{module.description}</p>
    </>
  );

  if (isActive) {
    return (
      <Link
        href={`/${module.slug}`}
        className="group block card p-6 transition-all hover:border-primary hover:shadow-lg"
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
