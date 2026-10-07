'use client';

import { useId, useState } from 'react';

import type { GovernanceSpace, SnapshotActiveProposal } from '@/lib/snapshot/types';

import ActiveVoteCard from './ActiveVoteCard';

const VISIBLE_COUNT = 2;

interface ActiveVotesProps {
  proposals: (SnapshotActiveProposal & { space?: GovernanceSpace })[];
  isAISummaryAvailable?: boolean;
  isQnaAvailable?: boolean;
}

export default function ActiveVotes({
  proposals,
  isAISummaryAvailable = false,
  isQnaAvailable = false,
}: ActiveVotesProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  // Ending-soonest first, so the collapsed view shows the most urgent votes.
  const sorted = [...proposals].sort((a, b) => a.end - b.end);
  const hiddenCount = Math.max(0, sorted.length - VISIBLE_COUNT);
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT);

  return (
    <section className="mb-12">
      <h2 className="mb-5 flex items-center gap-2.5 text-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        Active Votes
        {sorted.length > VISIBLE_COUNT && (
          <span className="badge-sm-primary" aria-label={`${sorted.length} active votes`}>
            {sorted.length}
          </span>
        )}
      </h2>
      <div id={listId} className="flex flex-col gap-4">
        {visible.map((proposal) => (
          <ActiveVoteCard
            key={proposal.id}
            proposal={proposal}
            space={proposal.space}
            isAISummaryAvailable={isAISummaryAvailable}
            isQnaAvailable={isQnaAvailable}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={listId}
          className="mt-4 w-full rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-card-hover"
        >
          {expanded
            ? 'Show fewer'
            : `Show ${hiddenCount} more active vote${hiddenCount !== 1 ? 's' : ''}`}
        </button>
      )}
    </section>
  );
}
