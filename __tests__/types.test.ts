import { describe, it, expect } from 'vitest';
import { ModuleStatus, type Module } from '@/lib/types';

describe('Module Types', () => {
  it('should allow creating a valid module', () => {
    const module: Module = {
      id: 'test-1',
      slug: 'test-module',
      name: 'Test Module',
      status: ModuleStatus.ACTIVE,
      sortOrder: 1,
    };

    expect(module.slug).toBe('test-module');
    expect(module.status).toBe(ModuleStatus.ACTIVE);
  });

  it('should have correct enum values', () => {
    expect(ModuleStatus.ACTIVE).toBe('active');
    expect(ModuleStatus.COMING_SOON).toBe('coming_soon');
  });
});
