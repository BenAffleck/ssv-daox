import type { ScoreBreakdown } from '@/lib/dao-delegates/logic/score-breakdown';

import ScoreBreakdownCard from './ScoreBreakdownCard';

/** The selected address's score by pillar, in the same card as the voting power breakdown. */
export default function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <section aria-labelledby="score-title" className="card mt-6 p-5">
      <h3 id="score-title" className="mb-3">
        Score breakdown
      </h3>
      <ScoreBreakdownCard breakdown={breakdown} />
    </section>
  );
}
