const DEFAULT_SUBTITLE =
  "One transaction hands your voting power to the DAO pool. The DAO spreads your voting power across cohorts of delegates. We don't touch your tokens.";

interface DelegateToDaoPanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The one-click action, shown to the right of the title. */
  action?: React.ReactNode;
  /** Notes, confirmations and transaction status below the title. */
  children?: React.ReactNode;
}

/** "Delegate to the DAO": the page's primary action, highlighted with the brand glow. */
export default function DelegateToDaoPanel({
  title = 'Delegate to the DAO',
  subtitle = DEFAULT_SUBTITLE,
  action,
  children,
}: DelegateToDaoPanelProps) {
  return (
    <section
      aria-labelledby="delegate-to-dao-title"
      className="card mt-6 border-primary/50 p-5 shadow-glow"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 id="delegate-to-dao-title">{title}</h3>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4 space-y-3 text-[13px]">{children}</div>}
    </section>
  );
}
