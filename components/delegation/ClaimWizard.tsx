'use client';

import { useState } from 'react';

import type { OverviewAddress } from '@/lib/delegation/logic/address-overview';

import ClaimStatusBadge, { CLAIM_STATUS_LABELS } from './ClaimStatusBadge';

interface ClaimWizardProps {
  /** The overview's addresses, requested one first. */
  addresses: OverviewAddress[];
  /** `as_of` of the last score run from `/health`; `null` when unknown. */
  lastRunAsOf: string | null;
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
export default function ClaimWizard({ addresses, lastRunAsOf }: ClaimWizardProps) {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.address ?? '');
  const selectedEntry = addresses.find((a) => a.address === selectedAddress) ?? addresses[0];
  if (!selectedEntry) {
    return null;
  }
  const { projectUrl, settingsUrl } = selectedEntry.highSignal;

  return (
    <section className="card mt-6 p-5" aria-labelledby="claim-wizard-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="claim-wizard-title">Claim on HighSignal</h3>
          <p className="mt-1 text-[13px] text-muted">
            Link your addresses to your HighSignal identity so the community pillar counts for them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="claim-wizard-steps"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          {open ? 'Hide steps' : 'Start claim'}
        </button>
      </div>

      {open && (
        <div id="claim-wizard-steps" className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="claim-address" className="text-[13px] text-muted">
              Address
            </label>
            <select
              id="claim-address"
              value={selectedEntry.address}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="filter-input max-w-full min-w-0 font-mono text-xs"
            >
              {addresses.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.ensName ? `${a.ensName} (${a.address})` : a.address}
                </option>
              ))}
            </select>
            <ClaimStatusBadge status={selectedEntry.claimStatus} />
          </div>

          <ol className="space-y-4">
            <Step number={1} title="Sign in on HighSignal with Discord">
              <p>
                Open the SSV project on HighSignal and sign in with Discord. This ties your Discord
                activity to your HighSignal identity.
              </p>
              <ExternalLink href={projectUrl}>Open the SSV project on HighSignal</ExternalLink>
            </Step>
            <Step number={2} title="Add your Ethereum addresses">
              <p>
                In your HighSignal profile settings, add{' '}
                <code className="font-mono text-xs text-foreground">{selectedEntry.address}</code>{' '}
                as a linked wallet, plus any other address you own that should be scored. Follow
                HighSignal&apos;s prompts to connect each wallet.
              </p>
              {settingsUrl ? (
                <ExternalLink href={settingsUrl}>Open your HighSignal settings</ExternalLink>
              ) : (
                <p className="mt-2">
                  After signing in, open your profile settings from the HighSignal menu.
                </p>
              )}
            </Step>
            <Step number={3} title="Share them with the SSV project">
              <p>
                Back on the SSV project page, share the linked addresses with SSV. The Delegate
                Score API only sees addresses you explicitly share with the project.
              </p>
              <ExternalLink href={projectUrl}>Open the SSV project on HighSignal</ExternalLink>
            </Step>
          </ol>

          <div role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-4">
            <p className="text-[13px] font-medium text-foreground">
              Your claim appears after the next score run.
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {lastRunAsOf
                ? `The last run was as of ${lastRunAsOf} (UTC).`
                : 'The time of the last run is unavailable.'}{' '}
              The status then moves to &ldquo;{CLAIM_STATUS_LABELS.claimed_pending}&rdquo; and, once
              the community pillar is scored, &ldquo;{CLAIM_STATUS_LABELS.claimed_scored}&rdquo;.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
