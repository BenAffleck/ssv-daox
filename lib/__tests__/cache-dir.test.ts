import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cacheDir } from '../cache-dir';

describe('cacheDir', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is under the OS temp dir on Vercel, whose deployment directory is read-only', () => {
    vi.stubEnv('VERCEL', '1');

    expect(cacheDir()).toBe(path.join(os.tmpdir(), '.cache'));
  });

  it('is in the project directory elsewhere', () => {
    vi.stubEnv('VERCEL', '');

    expect(cacheDir()).toBe(path.join(process.cwd(), '.cache'));
  });
});
