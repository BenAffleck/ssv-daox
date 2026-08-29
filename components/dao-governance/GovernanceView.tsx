'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import ActiveVoteCard from '@/components/ActiveVoteCard';
import PendingVoteCard from '@/components/PendingVoteCard';
import { getSpaceStyle } from '@/lib/dao-governance/space-style';
import { filterProposalsByQuery } from '@/lib/dao-governance/vote-search';
import type { GovernanceProposal, GovernanceSpace } from '@/lib/snapshot/types';

import AskProposalDialog from './AskProposalDialog';
import ClosedVoteCard from './ClosedVoteCard';
import FilterChips, { ALL_VALUE } from './FilterChips';
import StatusFilter, { type StatusValue } from './StatusFilter';
import VoteSearchInput from './VoteSearchInput';

interface GovernanceViewProps {
  proposals: GovernanceProposal[];
  /** Spaces available to filter by (configured + successfully fetched). */
  spaces: GovernanceSpace[];
  /** Labels of spaces whose data failed to load. */
  failedSpaces: string[];
  isAISummaryAvailable: boolean;
  isQnaAvailable?: boolean;
}

const SPACE_PARAM = 'space';
const STATUS_PARAM = 'status';
const QUERY_PARAM = 'q';
const ASK_PARAM = 'ask';
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
  isQnaAvailable = false,
}: GovernanceViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const spaceKeys = useMemo(() => spaces.map((s) => s.key), [spaces]);

  const selectedSpace = parseSpace(searchParams.get(SPACE_PARAM), spaceKeys);
  const status = parseStatus(searchParams.get(STATUS_PARAM));
  const query = searchParams.get(QUERY_PARAM) ?? '';
  const askId = searchParams.get(ASK_PARAM);

  // Reflect the filters in the URL, omitting a param at its default for clean,
  // shareable links. `ask` is preserved separately so opening or closing the
  // dialog doesn't disturb the filters, and vice versa.
  const commit = useCallback(
    (nextSpace: string, nextStatus: StatusValue, nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextSpace === ALL_VALUE) params.delete(SPACE_PARAM);
      else params.set(SPACE_PARAM, nextSpace);

      if (nextStatus === 'all') params.delete(STATUS_PARAM);
      else params.set(STATUS_PARAM, nextStatus);

      if (!nextQuery.trim()) params.delete(QUERY_PARAM);
      else params.set(QUERY_PARAM, nextQuery);

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const closeAsk = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(ASK_PARAM);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  // Resolve the ?ask= target against the *unfiltered* list so a deep link from
  // the command palette opens regardless of the active space/status/search.
  const askProposal = useMemo(
    () => (askId ? proposals.find((p) => p.id === askId) : undefined),
    [askId, proposals],
  );

  const matching = useMemo(() => filterProposalsByQuery(proposals, query), [proposals, query]);

  const bySpace = useMemo(
    () =>
      selectedSpace === ALL_VALUE
        ? matching
        : matching.filter((p) => p.space.key === selectedSpace),
    [matching, selectedSpace],
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

  const hasQuery = query.trim().length > 0;
  const emptyMessage =
    spaces.length === 0
      ? 'No governance spaces are configured.'
      : hasQuery
        ? `No votes match “${query}”. Try a different keyword or clear the search.`
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

      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <StatusFilter value={status} onChange={(next) => commit(selectedSpace, next, query)} />
          <FilterChips
            items={spaceItems}
            value={selectedSpace}
            onChange={(next) => commit(next, status, query)}
            allLabel="All spaces"
            ariaLabel="Filter by space"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <VoteSearchInput
              value={query}
              onChange={(next) => commit(selectedSpace, status, next)}
            />
          </div>
          {hasQuery && (
            <span
              className="text-[12px] text-muted sm:whitespace-nowrap"
              data-testid="vote-search-count"
            >
              {totalVisible} of {proposals.length} vote
              {proposals.length === 1 ? '' : 's'} match
            </span>
          )}
        </div>
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
                    isQnaAvailable={isQnaAvailable}
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
                    isQnaAvailable={isQnaAvailable}
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
                    isQnaAvailable={isQnaAvailable}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isQnaAvailable && askProposal && (
        <AskProposalDialog proposal={askProposal} open onClose={closeAsk} />
      )}
    </div>
  );
}
