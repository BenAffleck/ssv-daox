import { isAddress } from '@/lib/delegation/logic/address-overview';
import { normalizedEnsName } from '@/lib/delegation/logic/ens';

import type { Delegate } from '../types';

/**
 * The address or ENS name in `query` when no ranked delegate holds it, so the
 * leaderboard can offer its Delegation page; otherwise `null`.
 */
export function lookupTargetOf(
  query: string,
  delegates: Pick<Delegate, 'publicAddress' | 'ensName'>[],
): string | null {
  const target = query.trim();
  if (isAddress(target)) {
    const address = target.toLowerCase();
    return delegates.some((d) => d.publicAddress.toLowerCase() === address) ? null : target;
  }
  const ensName = normalizedEnsName(target);
  if (ensName) {
    return delegates.some((d) => d.ensName?.toLowerCase() === ensName) ? null : target;
  }
  return null;
}
