'use client';

import { trackEvent, type CampaignPlacement } from '@/lib/telemetry/events';

/** Strip across the top of a card announcing The Distributed Vote; links to the campaign page. */
export default function CampaignRibbon({
  url,
  placement,
}: {
  url: string;
  placement: CampaignPlacement;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-primary/30 bg-linear-to-r from-primary/15 to-accent/15 px-4 py-2 text-[13px]">
      <span className="text-foreground">
        <span aria-hidden>⚡ </span>
        <span className="font-heading font-semibold">The Distributed Vote</span>
        <span className="text-muted"> · Incentives live for cSSV delegated to the DAO pool</span>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('campaign_link_clicked', { placement })}
        className="badge badge-accent gap-1 font-semibold hover:bg-accent/30"
      >
        <span aria-hidden>⚡</span> Check eligibility ↗
        <span className="sr-only"> (opens the campaign page)</span>
      </a>
    </div>
  );
}
