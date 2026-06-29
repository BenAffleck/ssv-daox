import { Module, ModuleStatus } from '@/lib/types';

export const modules: Module[] = [
  {
    id: 'dao-delegates',
    slug: 'delegates',
    name: 'DAO Delegates',
    description: 'Ranked leaderboard of active delegates with voting power, eligibility, and delegation program tracking.',
    status: ModuleStatus.ACTIVE,
    sortOrder: 1,
  },
  {
    id: 'dao-timeline',
    slug: 'timeline',
    name: 'DAO Timeline',
    description: 'Visual timeline of governance events, proposals, and key DAO milestones.',
    status: ModuleStatus.ACTIVE,
    sortOrder: 2,
  },
  {
    id: 'dao-governance',
    slug: 'governance',
    name: 'Governance Votes',
    description: 'All active and upcoming SSV votes across every Snapshot space in one place, with participation, quorum, and AI summaries.',
    status: ModuleStatus.ACTIVE,
    sortOrder: 3,
  },
];

export function getModulesSorted(): Module[] {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find((module) => module.slug === slug);
}

export function getActiveModules(): Module[] {
  return getModulesSorted().filter(m => m.status === ModuleStatus.ACTIVE);
}

export function getComingSoonModules(): Module[] {
  return getModulesSorted().filter(m => m.status === ModuleStatus.COMING_SOON);
}
