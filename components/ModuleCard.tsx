import Link from 'next/link';
import { Module, ModuleStatus } from '@/lib/types';

interface ModuleCardProps {
  module: Module;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const isActive = module.status === ModuleStatus.ACTIVE;
  const isComingSoon = module.status === ModuleStatus.COMING_SOON;

  const baseClasses = 'block rounded-lg border p-6 transition-all';
  const activeClasses = isActive
    ? 'cursor-pointer border-border bg-card hover:border-primary hover:shadow-lg'
    : '';
  const comingSoonClasses = isComingSoon
    ? 'border-border bg-muted/40 opacity-70'
    : '';

  const cardContent = (
    <div className="flex items-center justify-between">
      <h3 className="font-heading text-xl font-semibold text-foreground">{module.name}</h3>
      {isComingSoon && (
        <span className="rounded-full bg-muted/30 px-3 py-1 font-heading text-sm text-muted">
          Coming Soon
        </span>
      )}
    </div>
  );

  if (isActive) {
    return (
      <Link
        href={`/${module.slug}`}
        className={`${baseClasses} ${activeClasses}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={`${baseClasses} ${comingSoonClasses}`}>
      {cardContent}
    </div>
  );
}
