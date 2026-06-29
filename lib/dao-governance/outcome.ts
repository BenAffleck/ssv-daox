import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

export type OutcomeVariant = 'passed' | 'failed' | 'quorum-not-met' | 'neutral';

export interface ProposalOutcome {
  label: string;
  variant: OutcomeVariant;
}

const APPROVE_CHOICES = new Set(['for', 'yes', 'approve', 'accept']);
const REJECT_CHOICES = new Set(['against', 'no', 'reject', 'deny']);

/**
 * Derives a closed proposal's outcome for display as a badge.
 *
 * Rules:
 * - Quorum applies only to token-weighted spaces with a configured quorum. If
 *   it applies and total votes fall short → "Quorum not met".
 * - Otherwise the winning choice (highest score) decides: an approval-style
 *   choice → "Passed", a rejection-style choice → "Failed". For non-binary
 *   ballots the winning option's label is shown as a neutral outcome.
 * - With no votes at all → "No votes".
 */
export function getProposalOutcome(
  proposal: Pick<
    SnapshotActiveProposal,
    'choices' | 'scores' | 'scores_total' | 'quorum'
  >,
  isMemberVote: boolean
): ProposalOutcome {
  const quorumApplies = !isMemberVote && proposal.quorum > 0;

  if (quorumApplies && proposal.scores_total < proposal.quorum) {
    return { label: 'Quorum not met', variant: 'quorum-not-met' };
  }

  if (proposal.scores_total <= 0 || proposal.scores.length === 0) {
    return { label: 'No votes', variant: 'neutral' };
  }

  // Winning choice = highest score.
  let winnerIndex = 0;
  for (let i = 1; i < proposal.scores.length; i++) {
    if ((proposal.scores[i] ?? 0) > (proposal.scores[winnerIndex] ?? 0)) {
      winnerIndex = i;
    }
  }

  const winner = (proposal.choices[winnerIndex] ?? '').trim();
  const normalized = winner.toLowerCase();

  if (APPROVE_CHOICES.has(normalized)) {
    return { label: 'Passed', variant: 'passed' };
  }
  if (REJECT_CHOICES.has(normalized)) {
    return { label: 'Failed', variant: 'failed' };
  }

  // Non-binary ballot: surface the winning option.
  return { label: winner || 'Closed', variant: 'neutral' };
}
