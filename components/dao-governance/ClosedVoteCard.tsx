'use client';

import { useCallback, useState } from 'react';
import { Sparkles, TriangleAlert } from 'lucide-react';

import type { ProposalSummary } from '@/lib/ai-summary/types';
import { requestProposalSummary } from '@/lib/ai/requests';
import { getProposalOutcome, type OutcomeVariant } from '@/lib/dao-governance/outcome';
import type { GovernanceSpace, SnapshotActiveProposal } from '@/lib/snapshot/types';
import { formatTimeAgo } from '@/lib/snapshot/utils/time-remaining';

import AskButton from './AskButton';
import ProposalTitleLink from './ProposalTitleLink';
import QuorumMeter from './QuorumMeter';
import SpaceBadge from './SpaceBadge';
import VoteResults from './VoteResults';

interface ClosedVoteCardProps {
  proposal: SnapshotActiveProposal;
  isAISummaryAvailable?: boolean;
  isQnaAvailable?: boolean;
  space: GovernanceSpace;
}

const OUTCOME_BADGE_CLASS: Record<OutcomeVariant, string> = {
  passed: 'badge-sm-accent',
  failed: 'badge-sm-danger',
  'quorum-not-met': 'badge-sm-warning',
  neutral: 'badge-sm-muted',
};

export default function ClosedVoteCard({
  proposal,
  isAISummaryAvailable = false,
  isQnaAvailable = false,
  space,
}: ClosedVoteCardProps) {
  const endedAgo = formatTimeAgo(proposal.end);
  const outcome = getProposalOutcome(proposal);

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

    const result = await requestProposalSummary(proposal.id);
    if (result.ok) {
      setSummary(result.summary);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [summary, proposal.id]);

  return (
    <article className="card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <ProposalTitleLink href={proposal.link} title={proposal.title} />
        <div className="shrink-0">
          <span
            className={`inline-flex items-center gap-1 ${OUTCOME_BADGE_CLASS[outcome.variant]}`}
          >
            {outcome.variant === 'quorum-not-met' && (
              <TriangleAlert className="h-3 w-3" aria-hidden />
            )}
            {outcome.label}
          </span>
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
          <SpaceBadge space={space} />
          <span>
            {proposal.votes} voter{proposal.votes !== 1 ? 's' : ''}
          </span>
          <span>{endedAgo}</span>
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
        </div>
      </div>
    </article>
  );
}
