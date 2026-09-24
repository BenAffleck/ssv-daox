import type { Delegate } from '../types';

/**
 * Collects the non-empty handles of the given delegates, once each.
 * Addresses of one identity share its handles, so they would repeat otherwise.
 */
export function collectHandles(
  delegates: Delegate[],
  key: 'forumHandle' | 'discordHandle',
): string[] {
  const handles = new Set<string>();
  for (const delegate of delegates) {
    const handle = delegate[key]?.trim();
    if (handle) {
      handles.add(handle);
    }
  }
  return [...handles];
}
