'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const REFRESH_INTERVAL_MS = 15_000;
/** A tab left open stops polling after this long. */
export const REFRESH_LIMIT_MS = 10 * 60 * 1000;

/** Shown in place of the lag note once polling gave up. */
export const STILL_INDEXING_NOTE =
  "The delegation API hasn't picked up the transaction yet. Reload the page in a few minutes.";

/**
 * Re-renders the page's server components every 15 seconds while `active`,
 * so a write shows once the delegation API indexes it. Returns `true` once it
 * gave up after 10 minutes.
 */
export function useRefreshWhile(active: boolean): boolean {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    const limit = setTimeout(() => {
      clearInterval(interval);
      setGaveUp(true);
    }, REFRESH_LIMIT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(limit);
      setGaveUp(false);
    };
  }, [active, router]);

  return gaveUp;
}
