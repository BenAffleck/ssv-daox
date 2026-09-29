import { Info } from 'lucide-react';

import StepPanel from './StepPanel';

/** "Claim on HighSignal" without a selected address: points to HighSignal. */
export default function ClaimIntroPanel({ projectUrl }: { projectUrl: string }) {
  return (
    <StepPanel
      title="Claim on HighSignal"
      summary="Link your address to climb the leaderboard and earn a cohort seat."
      icon={<Info size={20} aria-hidden />}
    >
      <p className="text-[13px] text-muted">
        Sign in with Discord, add your Ethereum addresses and share them with the SSV project.
      </p>
      <a
        href={projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
      >
        Start on HighSignal ↗
      </a>
    </StepPanel>
  );
}
