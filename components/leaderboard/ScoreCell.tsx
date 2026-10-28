interface ScoreCellProps {
  score: number | null;
  /** The pillar had no data; shown as "n/a" instead of its 0. */
  missing?: boolean;
}

export default function ScoreCell({ score, missing = false }: ScoreCellProps) {
  if (missing) {
    return <span className="text-xs text-muted">n/a</span>;
  }

  if (score === null) {
    return <span className="text-xs text-muted">-</span>;
  }

  return <span className="text-foreground tabular-nums">{score.toFixed(1)}</span>;
}
