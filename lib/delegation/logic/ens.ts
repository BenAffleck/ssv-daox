import { normalize } from 'viem/ens';

/**
 * The ENSIP-15 normalized form of `value`, or `null` when it is not an ENS
 * name. A name needs at least two labels, so plain words stay lookups.
 */
export function normalizedEnsName(value: string): string | null {
  const labels = value.split('.');
  if (labels.length < 2 || labels.some((label) => label === '')) {
    return null;
  }
  try {
    return normalize(value);
  } catch {
    return null;
  }
}
