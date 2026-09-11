import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FROZEN_DELEGATES_CSV_PATH } from '../config';

/**
 * Reads the frozen delegate snapshot shipped with the repo.
 *
 * The Karma API that produced this data is no longer available, so the CSV is
 * a fixed file until a replacement source is wired up.
 */
export function loadDelegatesCSV(): string {
  return readFileSync(join(process.cwd(), FROZEN_DELEGATES_CSV_PATH), 'utf8');
}
