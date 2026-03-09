import type { SnapshotActiveProposal } from '@/lib/snapshot/types';
import { formatTimeRemaining } from '@/lib/snapshot/utils/time-remaining';

interface ActiveVoteCardProps {
  proposal: SnapshotActiveProposal;
}

/**
 * Maps standard vote choices to semantic colors
 */
function getChoiceColor(choice: string, index: number): string {
  const normalized = choice.toLowerCase();
  if (normalized === 'for' || normalized === 'yes') return 'bg-accent';
  if (normalized === 'against' || normalized === 'no') return 'bg-danger';
  if (normalized === 'abstain') return 'bg-muted';

  // Cycle through colors for non-standard choices
  const colors = ['bg-primary', 'bg-warning', 'bg-accent', 'bg-danger'];
  return colors[index % colors.length];
}

export default function ActiveVoteCard({ proposal }: ActiveVoteCardProps) {
  const timeRemaining = formatTimeRemaining(proposal.end);
  const quorumReached = proposal.quorum > 0 && proposal.scores_total >= proposal.quorum;

  // Build choice entries, collapsing into "Other" if > 3
  const maxChoices = 3;
  let displayChoices: { label: string; score: number; color: string }[];

  if (proposal.choices.length <= maxChoices) {
    displayChoices = proposal.choices.map((choice, i) => ({
      label: choice,
      score: proposal.scores[i] ?? 0,
      color: getChoiceColor(choice, i),
    }));
  } else {
    const top = proposal.choices.slice(0, maxChoices).map((choice, i) => ({
      label: choice,
      score: proposal.scores[i] ?? 0,
      color: getChoiceColor(choice, i),
    }));
    const otherScore = proposal.scores
      .slice(maxChoices)
      .reduce((sum, s) => sum + s, 0);
    top.push({ label: 'Other', score: otherScore, color: 'bg-muted' });
    displayChoices = top;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <a
          href={proposal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading text-sm font-semibold text-foreground hover:text-primary"
        >
          {proposal.title}
        </a>
        <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
          {timeRemaining}
        </span>
      </div>

      {/* Progress bar */}
      {proposal.scores_total > 0 && (
        <div className="mb-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted/20">
            {displayChoices.map((choice) => {
              const pct = (choice.score / proposal.scores_total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={choice.label}
                  className={`${choice.color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${choice.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {displayChoices.map((choice) => {
              const pct = proposal.scores_total > 0
                ? ((choice.score / proposal.scores_total) * 100).toFixed(1)
                : '0.0';
              const absolute = choice.score >= 1000
                ? `${(choice.score / 1000).toFixed(1)}k`
                : choice.score.toLocaleString(undefined, { maximumFractionDigits: 1 });
              return (
                <span key={choice.label} className="flex items-center gap-1 text-[10px] text-muted">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${choice.color}`} />
                  {choice.label} {pct}% ({absolute})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{proposal.votes} voter{proposal.votes !== 1 ? 's' : ''}</span>
        {proposal.quorum > 0 && (
          <span className={quorumReached ? 'text-accent' : 'text-warning'}>
            Quorum {quorumReached ? 'reached' : 'not reached'}
          </span>
        )}
      </div>
    </div>
  );
}
