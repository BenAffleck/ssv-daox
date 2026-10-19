import type { PillarBreakdown, ScoreBreakdown } from '@/lib/dao-delegates/logic/score-breakdown';

import { Row } from './VotingPowerBreakdownCard';

function formatScore(score: number): string {
  return score.toFixed(1);
}

/** A 0–100 bar; empty for a pillar without data. */
function PillarBar({ pillar }: { pillar: PillarBreakdown }) {
  return (
    <div aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
      {!pillar.missing && (
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${Math.min(100, Math.max(0, pillar.score))}%` }}
        />
      )}
    </div>
  );
}

/** The selected address's score by pillar. */
export default function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <dl className="space-y-1.5 text-[13px]">
      {breakdown.pillars.map((pillar) => (
        <div key={pillar.key} className="space-y-1">
          <Row
            label={pillar.label}
            note={pillar.note ?? undefined}
            value={pillar.missing ? 'n/a' : formatScore(pillar.score)}
            valueClassName={pillar.missing ? 'text-muted' : 'text-foreground'}
          />
          <PillarBar pillar={pillar} />
        </div>
      ))}
      <Row
        label="Delegate Score"
        note={breakdown.rank === null ? undefined : `rank #${breakdown.rank}`}
        value={breakdown.score === null ? '-' : formatScore(breakdown.score)}
        valueClassName="text-accent"
        total
      />
    </dl>
  );
}
