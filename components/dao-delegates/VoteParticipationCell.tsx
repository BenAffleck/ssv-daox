interface ActiveVoteStatus {
  proposalId: string;
  title: string;
  hasVoted: boolean;
  end: number;
}

interface VoteParticipationCellProps {
  participationRate: number;
  proposalCount: number;
  activeVoteStatus: ActiveVoteStatus[];
}

/**
 * Enhanced vote participation display showing:
 * - Historical participation badge with "Last N closed" label
 * - Active vote dots showing voted/not-voted per active proposal
 */
export default function VoteParticipationCell({
  participationRate,
  proposalCount,
  activeVoteStatus,
}: VoteParticipationCellProps) {
  // Color coding for participation rate
  let colorClass: string;
  if (participationRate >= 90) {
    colorClass = 'bg-accent/20 text-accent';
  } else if (participationRate >= 80) {
    colorClass = 'bg-warning/20 text-warning';
  } else {
    colorClass = 'bg-danger/20 text-danger';
  }

  const maxDots = 3;
  const visibleVotes = activeVoteStatus.slice(0, maxDots);
  const extraCount = activeVoteStatus.length - maxDots;

  return (
    <div className="flex flex-col gap-1">
      {/* Historical participation */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          title={`Voted on ${participationRate}% of the ${proposalCount} most recent closed proposals`}
        >
          {participationRate}%
        </span>
        <span className="text-[10px] text-muted">Last {proposalCount} closed</span>
      </div>

      {/* Active vote dots */}
      {activeVoteStatus.length > 0 && (
        <div className="flex items-center gap-1">
          {visibleVotes.map((vote) => (
            <span
              key={vote.proposalId}
              className={`inline-block h-2 w-2 rounded-full ${
                vote.hasVoted ? 'bg-accent' : 'bg-danger'
              }`}
              title={`${vote.title}: ${vote.hasVoted ? 'Voted' : 'Not voted'}`}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-[10px] text-muted">+{extraCount}</span>
          )}
          <span className="ml-0.5 text-[10px] text-muted">Active</span>
        </div>
      )}
    </div>
  );
}
