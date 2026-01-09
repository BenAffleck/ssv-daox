import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should support arithmetic', () => {
    expect(1 + 1).toBe(2);
  });
});
