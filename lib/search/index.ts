import { ExternalTool, Module, ModuleStatus } from '@/lib/types';

export type SearchItemKind = 'module' | 'tool';

export interface SearchItem {
  kind: SearchItemKind;
  id: string;
  name: string;
  description: string;
  /** Display badge label (e.g. "Module", "Coming Soon", or the first external tool category). */
  category: string;
  /** All searchable category strings — for tools this is every category they belong to. */
  categories: string[];
  host: string;
  url: string;
  /** Internal route or external link target. External tools always open in a new tab. */
  external: boolean;
  featured?: boolean;
}

export function buildSearchIndex(modules: Module[], tools: ExternalTool[]): SearchItem[] {
  const moduleItems: SearchItem[] = modules.map((m) => ({
    kind: 'module',
    id: `module:${m.id}`,
    name: m.name,
    description: m.description,
    category: m.status === ModuleStatus.ACTIVE ? 'Module' : 'Coming Soon',
    categories: ['Module'],
    host: 'daox',
    url: m.status === ModuleStatus.ACTIVE ? `/${m.slug}` : '#',
    external: false,
  }));

  const toolItems: SearchItem[] = tools.map((t) => ({
    kind: 'tool',
    id: `tool:${t.id}`,
    name: t.name,
    description: t.description,
    category: t.categories[0] ?? 'Tool',
    categories: t.categories.slice(),
    host: t.host,
    url: t.url,
    external: true,
    featured: t.featured,
  }));

  return [...moduleItems, ...toolItems];
}

/**
 * Score a search item against a trimmed, lowercased query.
 * Returns a positive number for matches (higher = better) or -1 for no match.
 *
 * Matching tiers:
 *   1. Direct substring on name (best)
 *   2. Direct substring anywhere in haystack
 *   3. Subsequence: every query character appears in order
 */
export function scoreSearchItem(item: SearchItem, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const haystack = (
    item.name +
    ' ' +
    item.description +
    ' ' +
    item.categories.join(' ') +
    ' ' +
    item.host
  ).toLowerCase();

  const direct = haystack.indexOf(q);
  if (direct !== -1) {
    const nameHit = item.name.toLowerCase().indexOf(q);
    return 1000 - direct + (nameHit !== -1 ? 500 - nameHit : 0);
  }

  let i = 0;
  for (const ch of haystack) {
    if (ch === q[i]) i++;
    if (i === q.length) return 100;
  }
  return -1;
}

export interface ScoredItem {
  item: SearchItem;
  score: number;
}

export function searchItems(index: SearchItem[], query: string): ScoredItem[] {
  const trimmed = query.trim();
  if (!trimmed) return index.map((item) => ({ item, score: 0 }));
  return index
    .map((item) => ({ item, score: scoreSearchItem(item, trimmed) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);
}
