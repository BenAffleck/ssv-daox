import Link from 'next/link';

import {
  formatDelegatorCount,
  formatPower,
  type PoolSummary,
} from '@/lib/delegation/logic/auto-delegation';

interface PoolBannerProps {
  /** `null` when the pool lookup failed; the banner is then hidden. */
  pool: PoolSummary | null;
}

/** Points leaderboard visitors to the DAO auto-delegation pool. */
export default function PoolBanner({ pool }: PoolBannerProps) {
  if (!pool) {
    return null;
  }
  return (
    <section
      aria-label="DAO auto-delegation pool"
      className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-heading text-xs font-semibold tracking-wide text-muted uppercase">
          DAO auto-delegation pool
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span>
            <span className="font-medium text-foreground tabular-nums">
              {formatPower(pool.totalPower)}
            </span>{' '}
            total
          </span>
          <span>
            <span className="font-medium text-foreground tabular-nums">
              {formatPower(pool.communityPower)}
            </span>{' '}
            community-delegated
          </span>
          <span className="tabular-nums">{formatDelegatorCount(pool.delegatorCount)}</span>
        </p>
      </div>
      <Link
        href="/delegation"
        className="inline-block shrink-0 self-start rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 sm:self-auto"
      >
        Let the DAO delegate for you →
      </Link>
    </section>
  );
}
