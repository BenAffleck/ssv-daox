import type { SnapshotActiveProposal } from '@/lib/snapshot/types';
import PendingVoteCard from './PendingVoteCard';

interface PendingVotesProps {
  proposals: SnapshotActiveProposal[];
  isAISummaryAvailable?: boolean;
}

export default function PendingVotes({ proposals, isAISummaryAvailable = false }: PendingVotesProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-5 flex items-center gap-2.5 text-xl">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted" />
        Upcoming Votes
      </h2>
      <div className="flex flex-col gap-4">
        {proposals.map((proposal) => (
          <PendingVoteCard key={proposal.id} proposal={proposal} isAISummaryAvailable={isAISummaryAvailable} />
        ))}
      </div>
    </section>
  );
}
