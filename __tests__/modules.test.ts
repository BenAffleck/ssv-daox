import { describe, it, expect } from 'vitest';
import { modules, getModulesSorted, getModuleBySlug } from '@/lib/data/modules';
import { ModuleStatus } from '@/lib/types';

describe('Module Data', () => {
  it('should have at least two modules', () => {
    expect(modules.length).toBeGreaterThanOrEqual(2);
  });

  it('should return modules sorted by sortOrder', () => {
    const sorted = getModulesSorted();

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder);
    }
  });

  it('should find module by slug', () => {
    const module = getModuleBySlug('dao-delegates');

    expect(module).toBeDefined();
    expect(module?.slug).toBe('dao-delegates');
    expect(module?.status).toBe(ModuleStatus.ACTIVE);
  });

  it('should return undefined for invalid slug', () => {
    const module = getModuleBySlug('non-existent');

    expect(module).toBeUndefined();
  });

  it('should have dao-delegates as first active module', () => {
    const daoModule = modules.find(m => m.slug === 'dao-delegates');

    expect(daoModule?.status).toBe(ModuleStatus.ACTIVE);
    expect(daoModule?.sortOrder).toBe(1);
  });
});
