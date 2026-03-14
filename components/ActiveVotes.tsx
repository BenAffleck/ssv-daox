import type { SnapshotActiveProposal } from '@/lib/snapshot/types';
import ActiveVoteCard from './ActiveVoteCard';

interface ActiveVotesProps {
  proposals: SnapshotActiveProposal[];
  isAISummaryAvailable?: boolean;
}

export default function ActiveVotes({ proposals, isAISummaryAvailable = false }: ActiveVotesProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-2xl font-semibold text-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        Active Votes
      </h2>
      <div className="flex flex-col gap-4">
        {proposals.map((proposal) => (
          <ActiveVoteCard key={proposal.id} proposal={proposal} isAISummaryAvailable={isAISummaryAvailable} />
        ))}
      </div>
    </section>
  );
}
