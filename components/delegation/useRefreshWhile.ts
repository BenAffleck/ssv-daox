'use client';

import { useEffect, useState } from 'react';

import { refreshPins } from '@/lib/delegation/api/refresh-pins';

export const REFRESH_INTERVAL_MS = 15_000;
/** A tab left open stops polling after this long. */
export const REFRESH_LIMIT_MS = 10 * 60 * 1000;

/** Shown in place of the lag note once polling gave up. */
export const STILL_INDEXING_NOTE =
  "The delegation API hasn't picked up the transaction yet. Reload the page in a few minutes.";

/**
 * Expires the pins of `address` and re-renders the page every 15 seconds while
 * `active`, so a write shows once the delegation API indexes it. Returns `true`
 * once it gave up after 10 minutes.
 */
export function useRefreshWhile(active: boolean, address: string): boolean {
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const interval = setInterval(() => refreshPins(address), REFRESH_INTERVAL_MS);
    const limit = setTimeout(() => {
      clearInterval(interval);
      setGaveUp(true);
    }, REFRESH_LIMIT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(limit);
      setGaveUp(false);
    };
  }, [active, address]);

  return gaveUp;
}
