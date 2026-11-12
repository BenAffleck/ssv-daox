import os from 'os';
import path from 'path';

/** Where server-side JSON caches live. Vercel functions can write only to `/tmp`. */
export function cacheDir(): string {
  return path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), '.cache');
}
