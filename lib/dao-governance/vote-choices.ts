import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

export interface DisplayChoice {
  label: string;
  score: number;
  color: string;
}

const MAX_CHOICES = 3;

/** Maps standard vote choices to semantic colors. */
function getChoiceColor(choice: string, index: number): string {
  const normalized = choice.toLowerCase();
  if (normalized === 'for' || normalized === 'yes') return 'bg-accent';
  if (normalized === 'against' || normalized === 'no') return 'bg-danger';
  if (normalized === 'abstain') return 'bg-muted';

  const colors = ['bg-primary', 'bg-warning', 'bg-accent', 'bg-danger'];
  return colors[index % colors.length];
}

/** Choices with their scores; anything beyond the first three collapses into "Other". */
export function buildDisplayChoices(
  proposal: Pick<SnapshotActiveProposal, 'choices' | 'scores'>,
): DisplayChoice[] {
  const toChoice = (choice: string, i: number): DisplayChoice => ({
    label: choice,
    score: proposal.scores[i] ?? 0,
    color: getChoiceColor(choice, i),
  });

  if (proposal.choices.length <= MAX_CHOICES) return proposal.choices.map(toChoice);

  const otherScore = proposal.scores.slice(MAX_CHOICES).reduce((sum, s) => sum + s, 0);
  return [
    ...proposal.choices.slice(0, MAX_CHOICES).map(toChoice),
    { label: 'Other', score: otherScore, color: 'bg-muted' },
  ];
}
