import type { PillarScore } from '@/lib/dao-delegates/types';

interface ScoreCellProps {
  score: number | null;
  pillars: {
    community: PillarScore | null;
    holdings: PillarScore | null;
    votes: PillarScore | null;
  };
}

const PILLAR_LABELS = { community: 'Community', holdings: 'Holdings', votes: 'Votes' } as const;

function formatPillar(pillar: PillarScore): string {
  return pillar.missing ? 'n/a' : pillar.score.toFixed(1);
}

export default function ScoreCell({ score, pillars }: ScoreCellProps) {
  if (score === null) {
    return <span className="text-xs text-muted">-</span>;
  }

  // Pillars that are not live are left out
  const breakdown = (Object.keys(PILLAR_LABELS) as (keyof typeof PILLAR_LABELS)[])
    .filter((key) => pillars[key] !== null)
    .map((key) => `${PILLAR_LABELS[key]} ${formatPillar(pillars[key]!)}`)
    .join(' · ');

  return (
    <span className="cursor-help text-foreground tabular-nums" title={breakdown}>
      {score.toFixed(1)}
    </span>
  );
}
