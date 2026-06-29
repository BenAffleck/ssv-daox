'use client';

import { useState, useCallback } from 'react';
import type { SnapshotActiveProposal, GovernanceSpace } from '@/lib/snapshot/types';
import type { ProposalSummary } from '@/lib/ai-summary/types';
import { formatTimeAgo } from '@/lib/snapshot/utils/time-remaining';
import { getProposalOutcome, type OutcomeVariant } from '@/lib/dao-governance/outcome';
import { getSpaceStyle } from '@/lib/dao-governance/space-style';
import SpaceBadge from './SpaceBadge';

interface ClosedVoteCardProps {
  proposal: SnapshotActiveProposal;
  isAISummaryAvailable?: boolean;
  space?: GovernanceSpace;
}

/** Maps standard vote choices to semantic colors (matches ActiveVoteCard). */
function getChoiceColor(choice: string, index: number): string {
  const normalized = choice.toLowerCase();
  if (normalized === 'for' || normalized === 'yes') return 'bg-accent';
  if (normalized === 'against' || normalized === 'no') return 'bg-danger';
  if (normalized === 'abstain') return 'bg-muted';

  const colors = ['bg-primary', 'bg-warning', 'bg-accent', 'bg-danger'];
  return colors[index % colors.length];
}

const OUTCOME_BADGE_CLASS: Record<OutcomeVariant, string> = {
  passed: 'badge-sm-accent',
  failed: 'badge-sm-danger',
  'quorum-not-met': 'badge-sm-warning',
  neutral: 'badge-sm-muted',
};

export default function ClosedVoteCard({ proposal, isAISummaryAvailable = false, space }: ClosedVoteCardProps) {
  const endedAgo = formatTimeAgo(proposal.end);
  const isMemberVote = space?.voteType === 'member';
  const accentClass = space ? `border-l-4 ${getSpaceStyle(space.key).accentClass}` : '';
  const outcome = getProposalOutcome(proposal, isMemberVote);

  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<ProposalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (summary) {
      setShowSummary((prev) => !prev);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSummary(true);

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          title: proposal.title,
          body: proposal.body,
          choices: proposal.choices,
        }),
      });

      const data = await response.json();

      if (data.error && !data.summary) {
        setError(data.error);
      } else if (data.summary) {
        setSummary(data.summary);
      } else {
        setError('Failed to generate summary');
      }
    } catch {
      setError('Failed to fetch summary');
    } finally {
      setIsLoading(false);
    }
  }, [summary, proposal.id, proposal.title, proposal.body, proposal.choices]);

  // Build choice entries, collapsing into "Other" if > 3 (matches ActiveVoteCard).
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
    <div className={`card p-5 opacity-90 ${accentClass}`}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <a
          href={proposal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading text-[14px] font-semibold leading-snug tracking-tight text-foreground hover:text-primary"
        >
          {proposal.title}
        </a>
        <div className="flex shrink-0 items-center gap-2">
          {space && <SpaceBadge space={space} />}
          <span className={OUTCOME_BADGE_CLASS[outcome.variant]}>{outcome.label}</span>
        </div>
      </div>

      {/* Final results bar */}
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
                <span key={choice.label} className="flex items-center gap-1 text-[11px] text-muted">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${choice.color}`} />
                  {choice.label} {pct}% ({absolute})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* AI TL;DR Summary */}
      {showSummary && (
        <div className="mb-2 rounded-md border border-secondary/20 bg-secondary/5 p-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
              Generating summary...
            </div>
          )}
          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}
          {summary && (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-foreground">{summary.tldr}</p>
              {summary.choiceExplanations.length > 0 && (
                <div className="space-y-1 border-t border-secondary/15 pt-2">
                  {summary.choiceExplanations.map((ce) => (
                    <div key={ce.choice} className="text-[10px] text-muted">
                      <span className="font-semibold text-foreground">{ce.choice}:</span>{' '}
                      {ce.explanation}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats + Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <span>{proposal.votes} voter{proposal.votes !== 1 ? 's' : ''}</span>
          <span>{endedAgo}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAISummaryAvailable && (
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              title={showSummary && summary ? 'Hide AI summary' : 'Summarize with AI'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-glow transition-colors disabled:opacity-50 ${
                showSummary && summary
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border bg-card text-foreground hover:bg-card-hover'
              }`}
            >
              <span className={`text-sm leading-none ${showSummary && summary ? '' : 'inline-block animate-pulse'}`}>✨</span>
              {showSummary && summary ? 'Hide' : 'TL;DR'}
            </button>
          )}
          <a
            href={proposal.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-card-hover"
          >
            View Proposal
          </a>
        </div>
      </div>
    </div>
  );
}
