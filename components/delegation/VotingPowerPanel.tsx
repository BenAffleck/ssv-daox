import type { VotingPowerBreakdown } from '@/lib/delegation/logic/auto-delegation';

import VotingPowerBreakdownCard from './VotingPowerBreakdownCard';

/** The selected address's voting power; `breakdown` is `null` when the lookup failed. */
export default function VotingPowerPanel({
  breakdown,
}: {
  breakdown: VotingPowerBreakdown | null;
}) {
  return (
    <section aria-labelledby="voting-power-title" className="card mt-6 p-5">
      <h3 id="voting-power-title" className="mb-3">
        Voting power breakdown
      </h3>
      <VotingPowerBreakdownCard breakdown={breakdown} />
    </section>
  );
}
