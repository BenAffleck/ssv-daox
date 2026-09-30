import type { ScoreRow } from '@/lib/dao-delegates/types';

import type { TargetScoring } from './delegation-plan';
import { sameAddress } from './pool';

/** A scored delegate offered as a delegation target. */
export interface DelegateOption {
  address: string;
  name: string;
  ensName: string | null;
  rank: number;
}

const SUBSEQUENCE_SCORE = 1;

export function delegateOptionsOf(rows: ScoreRow[], scoring: TargetScoring): DelegateOption[] {
  return rows
    .filter((r) => r.rank !== null && scoring[r.address.toLowerCase()] === 'scored')
    .map((r) => ({
      address: r.address,
      name: r.display_name,
      ensName:
        r.identity.addresses.find((a) => sameAddress(a.address, r.address))?.ens_name ?? null,
      rank: r.rank as number,
    }))
    .sort((a, b) => a.rank - b.rank);
}

function isSubsequence(query: string, text: string): boolean {
  let i = 0;
  for (const ch of text) {
    if (ch === query[i]) i++;
    if (i === query.length) return true;
  }
  return false;
}

/** Name hits rank above ENS and address hits; loose subsequence hits only count when nothing else matches. */
function scoreOf(option: DelegateOption, query: string): number {
  const name = option.name.toLowerCase();
  const ens = option.ensName?.toLowerCase() ?? '';
  const nameHit = name.indexOf(query);
  if (nameHit !== -1) return 3000 - nameHit;
  const ensHit = ens.indexOf(query);
  if (ensHit !== -1) return 2000 - ensHit;
  const addressHit = option.address.toLowerCase().indexOf(query);
  if (addressHit !== -1) return 1000 - addressHit;
  return isSubsequence(query, `${name} ${ens}`) ? SUBSEQUENCE_SCORE : 0;
}

/** Fuzzy-matches scored delegates by name, ENS name or address; an empty query lists the top ranks. */
export function searchDelegates(
  options: DelegateOption[],
  query: string,
  limit = 8,
): DelegateOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  const scored = options
    .map((option) => ({ option, score: scoreOf(option, q) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.option.rank - b.option.rank);
  const direct = scored.length > 0 && scored[0].score > SUBSEQUENCE_SCORE;
  return scored
    .filter((s) => !direct || s.score > SUBSEQUENCE_SCORE)
    .slice(0, limit)
    .map((s) => s.option);
}
