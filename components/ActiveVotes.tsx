import type { SnapshotActiveProposal } from '@/lib/snapshot/types';
import ActiveVoteCard from './ActiveVoteCard';

interface ActiveVotesProps {
  proposals: SnapshotActiveProposal[];
}

export default function ActiveVotes({ proposals }: ActiveVotesProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-heading text-2xl font-semibold text-foreground">
        Active Votes
      </h2>
      <div className="flex flex-col gap-4">
        {proposals.map((proposal) => (
          <ActiveVoteCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </section>
  );
}
