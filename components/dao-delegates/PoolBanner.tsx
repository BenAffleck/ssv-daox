import { AUTO_DELEGATION_PROGRAM_CAP } from '@/lib/delegation/config';
import {
  formatAmount,
  formatDelegatorCount,
  formatPower,
  type PoolSummary,
} from '@/lib/delegation/logic/auto-delegation';

import PoolBannerAction from './PoolBannerAction';

interface PoolBannerProps {
  /** `null` when the pool lookup failed; the banner is then hidden. */
  pool: PoolSummary | null;
  poolAddress: string;
}

/** Points leaderboard visitors to the DAO auto-delegation pool. */
export default function PoolBanner({ pool, poolAddress }: PoolBannerProps) {
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
              {formatAmount(pool.allocatedPower)}
            </span>{' '}
            of <span className="tabular-nums">{formatPower(AUTO_DELEGATION_PROGRAM_CAP)}</span> cap
            reached
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
      <PoolBannerAction poolAddress={poolAddress} />
    </section>
  );
}
