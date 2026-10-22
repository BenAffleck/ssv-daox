'use client';

import { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';

import type { ProposalSummary } from '@/lib/ai-summary/types';
import type { GovernanceSpace, SnapshotActiveProposal } from '@/lib/snapshot/types';
import { formatTimeRemaining } from '@/lib/snapshot/utils/time-remaining';

import AskButton from './dao-governance/AskButton';
import QuorumMeter from './dao-governance/QuorumMeter';
import SpaceBadge from './dao-governance/SpaceBadge';
import VoteResults from './dao-governance/VoteResults';

interface ActiveVoteCardProps {
  proposal: SnapshotActiveProposal;
  isAISummaryAvailable?: boolean;
  isQnaAvailable?: boolean;
  /** When set, renders a space badge and switches quorum display by vote type. */
  space?: GovernanceSpace;
}

export default function ActiveVoteCard({
  proposal,
  isAISummaryAvailable = false,
  isQnaAvailable = false,
  space,
}: ActiveVoteCardProps) {
  const timeRemaining = formatTimeRemaining(proposal.end);
  const isMemberVote = space?.voteType === 'member';

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

  return (
    <article className="card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <a
          href={proposal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading text-[15px] leading-snug font-semibold tracking-tight text-foreground hover:text-primary"
        >
          {proposal.title}
        </a>
        <div className="shrink-0">
          <span className="badge-sm-primary">{timeRemaining}</span>
        </div>
      </div>

      <VoteResults proposal={proposal} />

      {/* AI TL;DR Summary */}
      {showSummary && (
        <div className="mb-4 rounded-lg bg-secondary/5 p-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
              Generating summary...
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
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
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          {space && <SpaceBadge space={space} />}
          <span>
            {proposal.votes} voter{proposal.votes !== 1 ? 's' : ''}
          </span>
          <QuorumMeter proposal={proposal} />
        </div>
        <div className="flex items-center gap-2">
          {isAISummaryAvailable && (
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              title={showSummary && summary ? 'Hide AI summary' : 'Summarize with AI'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                showSummary && summary
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border bg-card text-foreground hover:bg-card-hover'
              }`}
            >
              <Sparkles size={13} aria-hidden />
              {showSummary && summary ? 'Hide' : 'TL;DR'}
            </button>
          )}
          {isQnaAvailable && <AskButton proposal={proposal} />}
          {isMemberVote ? (
            // Committee spaces are whitelist-only voters — link out, don't imply
            // the viewer can cast a vote.
            <a
              href={proposal.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-card-hover"
            >
              View Proposal
            </a>
          ) : (
            <a
              href={proposal.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Vote Now
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
