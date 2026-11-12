/** Pulsing brand glow for an action that delegates to the DAO while a campaign runs. */
export const CAMPAIGN_PULSE = 'campaign-pulse';

/** Strip across the top of a card announcing The Distributed Vote; links to the campaign page. */
export default function CampaignRibbon({ url }: { url: string }) {
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
        className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent hover:bg-accent/30"
      >
        <span aria-hidden>⚡</span> Boosted ↗
        <span className="sr-only"> (opens the campaign page)</span>
      </a>
    </div>
  );
}
