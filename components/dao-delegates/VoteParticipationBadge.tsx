interface VoteParticipationBadgeProps {
  participationRate: number;
  proposalCount: number;
}

/**
 * Badge showing vote participation rate with color coding
 * Uses semantic theme tokens for consistent styling across themes
 * - 90-100%: accent (green) - high participation
 * - 80-89%: warning (amber) - medium participation
 * - 0-79%: danger (red) - low participation
 */
export default function VoteParticipationBadge({
  participationRate,
  proposalCount,
}: VoteParticipationBadgeProps) {
  // Determine color based on participation level
  let colorClass: string;
  if (participationRate >= 90) {
    colorClass = 'bg-accent/20 text-accent';
  } else if (participationRate >= 80) {
    colorClass = 'bg-warning/20 text-warning';
  } else {
    colorClass = 'bg-danger/20 text-danger';
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
