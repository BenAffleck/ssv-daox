'use client';

import { useId, useState } from 'react';

interface StepPanelProps {
  /** Position in the page's flow; omitted when the panel stands alone. */
  step?: number;
  title: string;
  summary: React.ReactNode;
  /** Badge shown next to the toggle, so the state reads without expanding. */
  status?: React.ReactNode;
  /** Toggle label while collapsed. */
  openLabel: string;
  children: React.ReactNode;
}

/**
 * Collapsed card with a title, one-line summary and status. The body stays
 * mounted while hidden, so form state survives collapsing.
 */
export default function StepPanel({
  step,
  title,
  summary,
  status,
  openLabel,
  children,
}: StepPanelProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <section className="card mt-6 p-5" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {step !== undefined && (
            <span className="badge badge-primary h-6 w-6 shrink-0 justify-center px-0">{step}</span>
          )}
          <div className="min-w-0">
            <h3 id={`${id}-title`}>{title}</h3>
            <p className="mt-1 text-[13px] text-muted">{summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={`${id}-body`}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            {open ? 'Hide' : openLabel}
          </button>
        </div>
      </div>

      <div id={`${id}-body`} hidden={!open} className="mt-5">
        {children}
      </div>
    </section>
  );
}
