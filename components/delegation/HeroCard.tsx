import CohortBadge from '@/components/dao-delegates/CohortBadge';
import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';
import {
  formatDelegatorCount,
  formatPower,
  type PoolSummary,
} from '@/lib/delegation/logic/auto-delegation';

import ClaimStatusBadge from './ClaimStatusBadge';
import OpenStepButton from './OpenStepButton';

interface HeroCardProps {
  /** `null` when the pool lookup failed. */
  pool: PoolSummary | null;
  /** The requested address's overview row; `null` without a scored address. */
  candidate: OverviewAddress | null;
  /** The breakdown and action of "Let the DAO delegate for you"; absent without a valid selected address. */
  autoDelegation?: React.ReactNode;
  /** Where "Become a delegate" leads when the page has no Claim step. */
  highSignalProjectUrl: string;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="font-heading text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-medium text-foreground tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

function PoolTotal({ pool }: { pool: PoolSummary | null }) {
  if (!pool) {
    return (
      <p role="status" className="text-[13px] text-muted">
        The pool total is unavailable right now. Try again in a few minutes.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Total voting power" value={formatPower(pool.totalPower)} />
      <Stat label="DAO-held" value={formatPower(pool.daoHeldPower)} />
      <Stat
        label="Community-delegated"
        value={formatPower(pool.communityPower)}
        note={formatDelegatorCount(pool.delegatorCount)}
      />
    </div>
  );
}

function CandidateStatus({ candidate }: { candidate: OverviewAddress }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
      <ClaimStatusBadge status={candidate.claimStatus} />
      <span className="tabular-nums">
        {candidate.rank !== null ? `Rank ${candidate.rank}` : 'Not ranked'}
      </span>
      <CohortBadge cohort={candidate.cohort} />
    </div>
  );
}

/** Presents the two ways to contribute to governance and the pool's total power. */
export default function HeroCard({
  pool,
  candidate,
  autoDelegation,
  highSignalProjectUrl,
}: HeroCardProps) {
  return (
    <section aria-labelledby="hero-title" className="card mb-6 p-5">
      <h2 id="hero-title">Two ways to shape SSV governance</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-lg border border-border p-4">
          <h3>Become a delegate</h3>
          <p className="mt-1 text-[13px] text-muted">
            Stand out in the community and become an active atom. Claim your addresses on
            HighSignal, climb the leaderboard and earn a cohort seat.
          </p>
          {candidate && <CandidateStatus candidate={candidate} />}
          <div className="mt-4">
            {candidate ? (
              <OpenStepButton anchor="claim">Open the Claim step</OpenStepButton>
            ) : (
              <a
                href={highSignalProjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
              >
                Start on HighSignal ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col rounded-lg border border-border p-4">
          <h3>Let the DAO delegate for you</h3>
          <p className="mt-1 text-[13px] text-muted">
            One transaction puts your tokens to work for decentralization, with nothing else to do.
            Power in the DAO auto-delegation pool goes to cohort delegates at the next score run.
          </p>
          {autoDelegation}
        </div>
      </div>
      <div className="mt-6">
        <h4 className="mb-3 text-foreground">DAO auto-delegation pool</h4>
        <PoolTotal pool={pool} />
      </div>
    </section>
  );
}
