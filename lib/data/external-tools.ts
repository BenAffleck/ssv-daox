import { ExternalTool } from '@/lib/types';
import { externalTools as generatedTools } from '@/lib/data/external-tools.generated';

/**
 * The external-tools catalog.
 *
 * The entries are NOT hand-written here — each tool lives in its own
 * `data/external-tools/<id>.json` file (community-contributable) and is
 * validated + assembled at build time by `scripts/gen-external-tools.ts` into
 * `external-tools.generated.ts`. This module re-exports that array and owns the
 * display-ordering logic, so every existing import site stays unchanged.
 *
 * See CONTRIBUTING.md for how to add a tool.
 */
export const externalTools: ExternalTool[] = generatedTools;

/**
 * Sort featured tools first (pinned to top), then by sortOrder ascending, and
 * finally by name so tools that share (or omit) a sortOrder have a stable,
 * conflict-free order across independently contributed JSON files.
 */
export function getExternalToolsSorted(): ExternalTool[] {
  return [...externalTools].sort((a, b) => {
    const aFeat = a.featured ? 1 : 0;
    const bFeat = b.featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}
