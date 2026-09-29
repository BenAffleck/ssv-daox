'use client';

import { Info } from 'lucide-react';

import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';

import ClaimStatusBadge, { CLAIM_STATUS_LABELS } from './ClaimStatusBadge';
import StepPanel from './StepPanel';

interface ClaimWizardProps {
  /** The overview's addresses, requested one first. */
  addresses: OverviewAddress[];
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block text-[13px] font-medium text-primary hover:underline"
    >
      {children} ↗
    </a>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="badge badge-primary h-6 w-6 shrink-0 justify-center px-0">{number}</span>
      <div className="min-w-0">
        <h5 className="text-foreground">{title}</h5>
        <div className="mt-1 text-[13px] text-muted">{children}</div>
      </div>
    </li>
  );
}

/**
 * Guides a candidate through proving ownership on HighSignal. HighSignal has
 * no deep links for adding or sharing wallets, so each step is also text.
 */
export default function ClaimWizard({ addresses }: ClaimWizardProps) {
  const requested = addresses[0];
  if (!requested) {
    return null;
  }
  const { projectUrl, settingsUrl } = requested.highSignal;
  const claimed = requested.claimStatus !== 'unclaimed';

  return (
    <StepPanel
      anchor="claim"
      title="Claim on HighSignal"
      summary={
        claimed
          ? 'Your address is linked on HighSignal and you are climbing the leaderboard.'
          : 'Link your address to climb the leaderboard and earn a cohort seat.'
      }
      icon={<Info size={20} aria-hidden />}
      done={claimed}
      status={<ClaimStatusBadge status={requested.claimStatus} />}
    >
      <div className="space-y-5">
        <ol className="space-y-4">
          <Step number={1} title="Sign in with Discord">
            <p>Open the SSV project on HighSignal and sign in.</p>
            <ExternalLink href={projectUrl}>Open SSV on HighSignal</ExternalLink>
          </Step>
          <Step number={2} title="Link your address">
            <p>
              In your HighSignal profile settings, add{' '}
              <code className="font-mono text-xs break-all text-foreground">
                {requested.address}
              </code>
              .
            </p>
            {settingsUrl && <ExternalLink href={settingsUrl}>Open your settings</ExternalLink>}
          </Step>
          <Step number={3} title="Share it with SSV">
            <p>
              On the HighSignal SSV project page, share your linked address(es). Only explicitly
              shared ones are scored.
            </p>
            <ExternalLink href={projectUrl}>Open SSV on HighSignal</ExternalLink>
          </Step>
        </ol>

        <div role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="text-[13px] font-medium text-foreground">
            Your claim appears after the next score run.
          </p>
          <p className="mt-1 text-[13px] text-muted">
            The status then moves to &ldquo;{CLAIM_STATUS_LABELS.claimed_scored}&rdquo; once your
            community activity counts.
          </p>
        </div>
      </div>
    </StepPanel>
  );
}
