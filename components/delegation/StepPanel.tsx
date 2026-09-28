'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** Steps another component can open by link (`#claim`) or with `openStep`. */
export type StepAnchor = 'claim' | 'opt-out' | 'delegation';

const OPEN_STEP_EVENT = 'daox:open-step';

/**
 * Expands and scrolls to a step. Next's `<Link>` and `router.push` change the
 * fragment without `hashchange`, so buttons use this instead.
 */
export function openStep(anchor: StepAnchor) {
  window.dispatchEvent(new CustomEvent<StepAnchor>(OPEN_STEP_EVENT, { detail: anchor }));
}

function isTargeted(anchor: StepAnchor): boolean {
  return window.location.hash === `#${anchor}`;
}

interface StepPanelProps {
  /** Position in the page's flow; omitted when the panel stands alone. */
  step?: number;
  title: string;
  summary: React.ReactNode;
  /** Badge shown next to the toggle, so the state reads without expanding. */
  status?: React.ReactNode;
  /** Toggle label while collapsed. */
  openLabel: string;
  /** Element id; a URL fragment or `openStep` naming it opens the panel. */
  anchor?: StepAnchor;
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
  anchor,
  children,
}: StepPanelProps) {
  const [open, setOpen] = useState(false);
  // Bumped per request, so an already open panel still scrolls into view.
  const [revealRequest, setRevealRequest] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    if (!anchor) {
      return;
    }
    const reveal = () => {
      setOpen(true);
      setRevealRequest((r) => r + 1);
    };
    const onHashChange = () => {
      if (isTargeted(anchor)) {
        reveal();
      }
    };
    const onOpenStep = (event: Event) => {
      if ((event as CustomEvent<StepAnchor>).detail === anchor) {
        reveal();
      }
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener(OPEN_STEP_EVENT, onOpenStep);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener(OPEN_STEP_EVENT, onOpenStep);
    };
  }, [anchor]);

  // Runs after the body is shown, so the scroll lands on the final layout.
  useEffect(() => {
    if (revealRequest > 0) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [revealRequest]);

  const toggle = () => {
    // A link to the anchor must fire `hashchange` again once collapsed.
    if (open && anchor && isTargeted(anchor)) {
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, '', pathname + search);
    }
    setOpen(!open);
  };

  return (
    <section
      ref={sectionRef}
      id={anchor}
      className="card mt-6 scroll-mt-20 p-5"
      aria-labelledby={`${id}-title`}
    >
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
            onClick={toggle}
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
