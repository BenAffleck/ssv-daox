'use client';

// PROTOTYPE: story-telling variants of the DAO auto-delegation pool banner, switched via
// `?variant=` on /leaderboard. Question: which layout makes the pool stats read as one story
// ("N SSV provided by X community delegators; the DAO assigned Y of its Z cap to delegates")?
// Throwaway: fold the winner into PoolBanner and move this file to a prototype branch.
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Handshake, Landmark, Users, Vote } from 'lucide-react';

import CampaignRibbon from '@/components/delegation/CampaignRibbon';
import PrototypeSwitcher from '@/components/prototype/PrototypeSwitcher';
import {
  formatAmount,
  formatDelegatorCount,
  formatPower,
  type PoolSummary,
} from '@/lib/delegation/logic/auto-delegation';

import PoolBannerAction from './PoolBannerAction';

interface Props {
  pool: PoolSummary;
  poolAddress: string;
  campaignUrl?: string;
}

const VARIANTS = [
  { key: 'A', name: 'Two-line story' },
  { key: 'B', name: 'Flow pipeline' },
  { key: 'C', name: 'Headline + tiles' },
  { key: 'D', name: 'Cap meter' },
];

const Num = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-foreground tabular-nums">{children}</span>
);

function IconDot({
  icon: Icon,
  tone,
}: {
  icon: typeof Users;
  tone: 'secondary' | 'primary' | 'accent';
}) {
  const toneClass = {
    secondary: 'bg-secondary/15 text-secondary',
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
  }[tone];
  return (
    <span
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full ${toneClass}`}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

function capOf(pool: PoolSummary) {
  return pool.cap ?? pool.totalPower;
}

function percent(part: number, whole: number) {
  return whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-xs font-semibold tracking-wide text-muted uppercase">
      {children}
    </p>
  );
}

/* A: two sentences, each led by an icon; a thin cap bar under the second. */
function VariantA({ pool, poolAddress, campaignUrl }: Props) {
  const cap = capOf(pool);
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Label>DAO auto-delegation pool</Label>
        <p className="flex items-center gap-3 text-[15px] text-muted">
          <IconDot icon={Users} tone="secondary" />
          <span>
            <Num>{formatPower(pool.communityPower)}</Num> of voting power provided by{' '}
            <Num>{pool.delegatorCount} community delegators</Num>
          </span>
        </p>
        <div className="flex items-start gap-3 text-[15px] text-muted">
          <IconDot icon={Landmark} tone="primary" />
          <div className="min-w-0 flex-1">
            <p>
              The DAO assigned <Num>{formatAmount(pool.allocatedPower)}</Num> of its{' '}
              <Num>{formatPower(cap)}</Num> cap back to delegates
            </p>
            <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent(pool.allocatedPower, cap)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <PoolBannerAction poolAddress={poolAddress} boosted={campaignUrl !== undefined} />
    </div>
  );
}

/* B: left-to-right pipeline. Community + DAO → Pool → Delegates. */
function FlowStep({
  icon,
  tone,
  title,
  value,
  caption,
}: {
  icon: typeof Users;
  tone: 'secondary' | 'primary' | 'accent';
  title: string;
  value: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-lg bg-card-hover p-3">
      <IconDot icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="font-heading text-xs font-semibold tracking-wide text-muted uppercase">
          {title}
        </p>
        <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
        <p className="text-[13px] text-muted">{caption}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <ArrowRight
      className="size-4 shrink-0 rotate-90 self-center text-muted sm:rotate-0"
      aria-hidden
    />
  );
}

function VariantB({ pool, poolAddress, campaignUrl }: Props) {
  const cap = capOf(pool);
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label>How the DAO auto-delegation pool works</Label>
        <PoolBannerAction poolAddress={poolAddress} boosted={campaignUrl !== undefined} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <FlowStep
          icon={Users}
          tone="secondary"
          title="Community delegates in"
          value={formatPower(pool.communityPower)}
          caption={`from ${formatDelegatorCount(pool.delegatorCount)}`}
        />
        <FlowArrow />
        <FlowStep
          icon={Vote}
          tone="primary"
          title="Pool holds"
          value={formatPower(pool.totalPower)}
          caption={
            <>
              incl. <span className="tabular-nums">{formatPower(pool.daoHeldPower)}</span> DAO-held
            </>
          }
        />
        <FlowArrow />
        <FlowStep
          icon={Handshake}
          tone="accent"
          title="DAO assigns to delegates"
          value={formatPower(pool.allocatedPower)}
          caption={
            <>
              of <span className="tabular-nums">{formatPower(cap)}</span> cap ·{' '}
              {Math.round(percent(pool.allocatedPower, cap))}% used
            </>
          }
        />
      </div>
    </div>
  );
}

/* C: one headline outcome, the inputs as supporting tiles. */
function VariantC({ pool, poolAddress, campaignUrl }: Props) {
  const cap = capOf(pool);
  return (
    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-4">
        <div>
          <Label>DAO auto-delegation pool</Label>
          <h3 className="mt-1">
            <span className="text-primary tabular-nums">{formatPower(pool.allocatedPower)}</span>{' '}
            back in delegates&apos; hands
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            The community lends voting power to the DAO; the DAO hands it to top-scoring delegates.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-card-hover p-3">
            <IconDot icon={Users} tone="secondary" />
            <div className="text-[13px] text-muted">
              <Num>{pool.delegatorCount}</Num> community delegators
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card-hover p-3">
            <IconDot icon={Vote} tone="primary" />
            <div className="text-[13px] text-muted">
              <Num>{formatPower(pool.communityPower)}</Num> provided
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card-hover p-3">
            <IconDot icon={Landmark} tone="accent" />
            <div className="text-[13px] text-muted">
              <Num>{Math.round(percent(pool.allocatedPower, cap))}%</Num> of{' '}
              <span className="tabular-nums">{formatPower(cap)}</span> cap used
            </div>
          </div>
        </div>
      </div>
      <PoolBannerAction poolAddress={poolAddress} boosted={campaignUrl !== undefined} />
    </div>
  );
}

/* D: the cap as a single meter; segments show who filled it. */
function VariantD({ pool, poolAddress, campaignUrl }: Props) {
  const cap = capOf(pool);
  const communityPct = percent(pool.communityPower, cap);
  const daoPct = Math.min(100 - communityPct, percent(pool.daoHeldPower, cap));
  const remaining = Math.max(0, cap - pool.allocatedPower);
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label>DAO auto-delegation pool</Label>
          <p className="mt-1 text-[15px] text-muted">
            <Num>{formatAmount(pool.allocatedPower)}</Num> of <Num>{formatPower(cap)}</Num> assigned
            back to delegates
            {remaining > 0 && (
              <>
                {' '}
                · <span className="text-primary tabular-nums">{formatPower(remaining)}</span> of
                room left
              </>
            )}
          </p>
        </div>
        <PoolBannerAction poolAddress={poolAddress} boosted={campaignUrl !== undefined} />
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full bg-secondary" style={{ width: `${communityPct}%` }} />
        <div className="h-full bg-primary" style={{ width: `${daoPct}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 text-secondary" aria-hidden />
          <Num>{formatPower(pool.communityPower)}</Num> from{' '}
          {formatDelegatorCount(pool.delegatorCount)}
        </span>
        <span className="flex items-center gap-1.5">
          <Landmark className="size-3.5 text-primary" aria-hidden />
          <Num>{formatPower(pool.daoHeldPower)}</Num> held by the DAO
        </span>
      </div>
    </div>
  );
}

export default function PoolBannerPrototype(props: Props) {
  const variant = useSearchParams().get('variant') ?? 'A';
  const Variant = { A: VariantA, B: VariantB, C: VariantC, D: VariantD }[variant] ?? VariantA;
  return (
    <>
      <section
        aria-label="DAO auto-delegation pool"
        className={props.campaignUrl ? 'card mb-6 overflow-hidden' : 'card mb-6'}
      >
        {props.campaignUrl && <CampaignRibbon url={props.campaignUrl} placement="banner" />}
        <Variant {...props} />
      </section>
      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
