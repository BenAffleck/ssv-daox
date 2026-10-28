import { describe, expect, it } from 'vitest';

import { getModuleBySlug, getModulesSorted, modules } from '@/lib/data/modules';
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
    const module = getModuleBySlug('leaderboard');

    expect(module).toBeDefined();
    expect(module?.slug).toBe('leaderboard');
    expect(module?.status).toBe(ModuleStatus.ACTIVE);
  });

  it('should return undefined for invalid slug', () => {
    const module = getModuleBySlug('non-existent');

    expect(module).toBeUndefined();
  });

  it('should have the leaderboard as first active module', () => {
    const daoModule = modules.find((m) => m.slug === 'leaderboard');

    expect(daoModule?.status).toBe(ModuleStatus.ACTIVE);
    expect(daoModule?.sortOrder).toBe(1);
  });
});
