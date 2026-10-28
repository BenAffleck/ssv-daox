'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { loadScoreStatus } from '@/lib/leaderboard/api/load-status';
import {
  describeFreshness,
  formatAge,
  formatAsOf,
  statusPollDelay,
} from '@/lib/leaderboard/logic/freshness';
import type { RunRef, ScoreStatus } from '@/lib/leaderboard/types';

const RETRY_MS = 5 * 60 * 1000;

/**
 * When the score data was published and when it changes next. Polls the
 * status and refreshes the page once a new run has published.
 */
export default function ScoreFreshness({ run, className }: { run: RunRef; className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ScoreStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      const next = await loadScoreStatus();
      if (cancelled) {
        return;
      }
      if (next) {
        setStatus(next);
      }
      timer = setTimeout(poll, next ? statusPollDelay(next, new Date()) : RETRY_MS);
    }
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Repeats on each poll until the refreshed page renders the new run.
  useEffect(() => {
    if (status?.latest && status.latest.run_id !== run.runId) {
      router.refresh();
    }
  }, [status, run.runId, router]);

  const now = new Date();
  return (
    // The age can differ by a render between server and client.
    <p className={className} suppressHydrationWarning>
      {status
        ? describeFreshness(status, now)
        : `Data for ${formatAsOf(run.asOf)}, updated ${formatAge(run.publishedAt, now)}.`}
    </p>
  );
}
