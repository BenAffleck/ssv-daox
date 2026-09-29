'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

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
  title: string;
  summary: React.ReactNode;
  /** Badge shown next to the toggle, so the state reads without expanding. */
  status?: React.ReactNode;
  /** Element id; a URL fragment or `openStep` naming it opens the panel. */
  anchor?: StepAnchor;
  /** Shown before the title; a `done` step shows a check instead. */
  icon?: React.ReactNode;
  /** A completed step: checked and locked shut. */
  done?: boolean;
  children: React.ReactNode;
}

/**
 * Collapsed card with a title, one-line summary and status. The toggle names
 * no action, so a stray click never reads as one. The body stays mounted while
 * hidden, so form state survives collapsing. A `done` step stays collapsed.
 */
export default function StepPanel({
  title,
  summary,
  status,
  anchor,
  icon,
  done = false,
  children,
}: StepPanelProps) {
  const [requestedOpen, setOpen] = useState(false);
  const open = requestedOpen && !done;
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
    if (revealRequest > 0 && !done) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [revealRequest, done]);

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
      className={`card mt-6 scroll-mt-20 p-5 ${done ? 'border-accent/40' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="flex items-center gap-2">
            {done ? (
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <Check size={13} strokeWidth={3} aria-hidden />
              </span>
            ) : (
              icon && (
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-primary">
                  {icon}
                </span>
              )
            )}
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-muted">{summary}</p>
        </div>
        <div className="flex items-center gap-3">
          {status}
          <button
            type="button"
            onClick={toggle}
            disabled={done}
            aria-expanded={open}
            aria-controls={`${id}-body`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:border-accent/40 disabled:text-accent disabled:hover:bg-card"
          >
            {done ? (
              <>
                <Check size={14} aria-hidden />
                Done
              </>
            ) : (
              <>
                {open ? 'Hide' : 'Show'}
                <ChevronDown
                  size={14}
                  aria-hidden
                  className={`transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>
        </div>
      </div>

      <div id={`${id}-body`} hidden={!open} className="mt-5">
        {children}
      </div>
    </section>
  );
}
