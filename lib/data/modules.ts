import { Module, ModuleStatus } from '@/lib/types';

export const modules: Module[] = [
  {
    id: 'dao-delegates',
    slug: 'dao-delegates',
    name: 'DAO Delegates',
    status: ModuleStatus.ACTIVE,
    sortOrder: 1,
  },
  {
    id: 'governance-proposals',
    slug: 'governance-proposals',
    name: 'Governance Proposals',
    status: ModuleStatus.COMING_SOON,
    sortOrder: 2,
  },
];

export function getModulesSorted(): Module[] {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find((module) => module.slug === slug);
}
