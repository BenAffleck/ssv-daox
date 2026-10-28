'use client';

import { useWalletSession } from '@/components/wallet/useWalletSession';

import StepPanel from './StepPanel';

/** The owner's steps in a disabled state, shown to everyone else. The header's wallet button connects. */
export default function ManageDelegationPreview() {
  const session = useWalletSession();
  if (session.phase === 'loading') {
    return null;
  }
  return (
    <section aria-labelledby="manage-preview-title" className="mt-10">
      <h2 id="manage-preview-title">Manage Delegation</h2>
      <p className="mt-1 text-[13px] text-muted">
        {session.phase === 'connected'
          ? 'Connect as this address to manage it.'
          : 'Connect wallet to manage this address.'}
      </p>
      <StepPanel
        disabled
        title="Claim on HighSignal"
        summary="Link your address to climb the leaderboard and earn a cohort seat."
      />
      <StepPanel
        disabled
        title="Opt out of delegation"
        summary="The DAO stops delegating to this address from the next score run. Reversible any time."
      />
      <StepPanel
        disabled
        title="Delegate voting power"
        summary="Give your voting power to another delegate or split it across several."
      />
    </section>
  );
}
