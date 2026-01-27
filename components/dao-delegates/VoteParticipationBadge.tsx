interface VoteParticipationBadgeProps {
  participationRate: number;
  proposalCount: number;
}

/**
 * Badge showing vote participation rate with color coding
 * - 80-100%: green (high participation)
 * - 40-79%: yellow (medium participation)
 * - 0-39%: red (low participation)
 */
export default function VoteParticipationBadge({
  participationRate, proposalCount
}: VoteParticipationBadgeProps) {
  // Determine color based on participation level
  let colorClass: string;
  if (participationRate >= 90) {
    colorClass = 'text-accent bg-green-100';
  } else if (participationRate >= 80) {
    colorClass = 'text-muted bg-yellow-100';
  } else {
    colorClass = 'text-muted bg-red-100';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      title={`Voted on ${participationRate}% of the ${proposalCount} most recent proposals`}
    >
      {participationRate}%
    </span>
  );
}
