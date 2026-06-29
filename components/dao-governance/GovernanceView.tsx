'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { GovernanceProposal, GovernanceSpace } from '@/lib/snapshot/types';
import { getSpaceStyle } from '@/lib/dao-governance/space-style';
import ActiveVoteCard from '@/components/ActiveVoteCard';
import PendingVoteCard from '@/components/PendingVoteCard';
import ClosedVoteCard from './ClosedVoteCard';
import FilterChips, { ALL_VALUE } from './FilterChips';
import StatusFilter, { type StatusValue } from './StatusFilter';

interface GovernanceViewProps {
  proposals: GovernanceProposal[];
  /** Spaces available to filter by (configured + successfully fetched). */
  spaces: GovernanceSpace[];
  /** Labels of spaces whose data failed to load. */
  failedSpaces: string[];
  isAISummaryAvailable: boolean;
}

const SPACE_PARAM = 'space';
const STATUS_PARAM = 'status';
const STATUS_VALUES: StatusValue[] = ['all', 'active', 'pending', 'closed'];

/**
 * Parses the single-select `?space=` param into a selected space key.
 * Absent or unknown → ALL_VALUE (every space shown).
 */
function parseSpace(param: string | null, allKeys: string[]): string {
  return param && allKeys.includes(param) ? param : ALL_VALUE;
}

function parseStatus(param: string | null): StatusValue {
  return STATUS_VALUES.includes(param as StatusValue) ? (param as StatusValue) : 'all';
}

export default function GovernanceView({
  proposals,
  spaces,
  failedSpaces,
  isAISummaryAvailable,
}: GovernanceViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const spaceKeys = useMemo(() => spaces.map((s) => s.key), [spaces]);

  const selectedSpace = parseSpace(searchParams.get(SPACE_PARAM), spaceKeys);
  const status = parseStatus(searchParams.get(STATUS_PARAM));

  // Reflect both filters in the URL, omitting a param at its default ("all")
  // for clean, shareable links.
  const commit = useCallback(
    (nextSpace: string, nextStatus: StatusValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextSpace === ALL_VALUE) params.delete(SPACE_PARAM);
      else params.set(SPACE_PARAM, nextSpace);

      if (nextStatus === 'all') params.delete(STATUS_PARAM);
      else params.set(STATUS_PARAM, nextStatus);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const bySpace = useMemo(
    () =>
      selectedSpace === ALL_VALUE
        ? proposals
        : proposals.filter((p) => p.space.key === selectedSpace),
    [proposals, selectedSpace]
  );
  const showActive = status === 'all' || status === 'active';
  const showPending = status === 'all' || status === 'pending';
  const showClosed = status === 'all' || status === 'closed';

  const active = showActive ? bySpace.filter((p) => p.state === 'active') : [];
  const pending = showPending ? bySpace.filter((p) => p.state === 'pending') : [];
  const closed = showClosed ? bySpace.filter((p) => p.state === 'closed') : [];
  const totalVisible = active.length + pending.length + closed.length;

  const spaceItems = spaces.map((s) => ({
    key: s.key,
    label: s.label,
    dotClass: getSpaceStyle(s.key).dotClass,
  }));

  const emptyMessage =
    spaces.length === 0
      ? 'No governance spaces are configured.'
      : 'No votes match the current filters.';

  return (
    <div>
      {failedSpaces.length > 0 && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          <span>
            Couldn&apos;t load votes from: {failedSpaces.join(', ')}. Other spaces are shown below.
          </span>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg border border-danger/40 px-3 py-1 font-medium hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <StatusFilter value={status} onChange={(next) => commit(selectedSpace, next)} />
        <FilterChips
          items={spaceItems}
          value={selectedSpace}
          onChange={(next) => commit(next, status)}
          allLabel="All spaces"
          ariaLabel="Filter by space"
        />
      </div>

      {totalVisible === 0 ? (
        <div className="card-empty">
          <p className="font-heading text-lg font-semibold text-muted">No votes to show</p>
          <p className="mt-2 text-[14px] text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {active.length > 0 && (
            <section>
              <h2 className="mb-5 flex items-center gap-2.5 text-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
                Active Votes
              </h2>
              <div className="flex flex-col gap-4">
                {active.map((proposal) => (
                  <ActiveVoteCard
                    key={proposal.id}
                    proposal={proposal}
                    space={proposal.space}
                    isAISummaryAvailable={isAISummaryAvailable}
                  />
                ))}
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <section>
              <h2 className="mb-5 flex items-center gap-2.5 text-xl">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted" />
                Upcoming Votes
              </h2>
              <div className="flex flex-col gap-4">
                {pending.map((proposal) => (
                  <PendingVoteCard
                    key={proposal.id}
                    proposal={proposal}
                    space={proposal.space}
                    isAISummaryAvailable={isAISummaryAvailable}
                  />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="mb-5 flex items-center gap-2.5 text-xl">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-border" />
                Past Votes
              </h2>
              <div className="flex flex-col gap-4">
                {closed.map((proposal) => (
                  <ClosedVoteCard
                    key={proposal.id}
                    proposal={proposal}
                    space={proposal.space}
                    isAISummaryAvailable={isAISummaryAvailable}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
