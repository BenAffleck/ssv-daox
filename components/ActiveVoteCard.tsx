'use client';

import { useState, useCallback } from 'react';
import type { SnapshotActiveProposal } from '@/lib/snapshot/types';
import type { ProposalSummary } from '@/lib/ai-summary/types';
import { formatTimeRemaining } from '@/lib/snapshot/utils/time-remaining';

interface ActiveVoteCardProps {
  proposal: SnapshotActiveProposal;
  isAISummaryAvailable?: boolean;
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

export default function ActiveVoteCard({ proposal, isAISummaryAvailable = false }: ActiveVoteCardProps) {
  const timeRemaining = formatTimeRemaining(proposal.end);
  const quorumReached = proposal.quorum > 0 && proposal.scores_total >= proposal.quorum;

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
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <a
          href={proposal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading text-[14px] font-semibold leading-snug tracking-tight text-foreground hover:text-primary"
        >
          {proposal.title}
        </a>
        <span className="shrink-0 badge-sm-primary">
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
          {proposal.quorum > 0 && (
            <span className={quorumReached ? 'text-accent' : 'text-warning'}>
              Quorum {quorumReached ? 'reached' : 'not reached'}
            </span>
          )}
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
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/80"
          >
            Vote Now
          </a>
        </div>
      </div>
    </div>
  );
}
