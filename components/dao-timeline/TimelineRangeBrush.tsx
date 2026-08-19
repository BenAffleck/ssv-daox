'use client';

import { KeyboardEvent, PointerEvent, useMemo, useRef, useState } from 'react';
import { SerializedEvent } from '@/lib/dao-timeline/types';
import {
  BrushDomain,
  DayRange,
  buildHistogram,
  buildMonthTicks,
  clampRange,
  filterByDayRange,
  formatOffsetLong,
  formatRangeLabel,
  getPresets,
  isPastOffset,
  isPresetActive,
  peakCount,
  toDayOffset,
  toFraction,
  toOffset,
} from '@/lib/dao-timeline/logic/range-brush';

type DragMode = 'from' | 'to' | 'pan';
type Edge = 'from' | 'to';

/** A press within this fraction of a handle grabs it rather than starting a new edge. */
const HANDLE_GRAB_FRACTION = 0.02;

const BAR_EMPTY_HEIGHT = 2;
const BAR_BASE_HEIGHT = 8;
const BAR_SCALE_HEIGHT = 34;

interface TimelineRangeBrushProps {
  /** Events the histogram summarises — already narrowed by the source filter. */
  events: SerializedEvent[];
  today: Date;
  domain: BrushDomain;
  range: DayRange;
  onRangeChange: (range: DayRange) => void;
}

/**
 * Two-handle date brush over an event-density histogram.
 *
 * Drag an edge to resize, drag the middle to pan, arrow keys to nudge
 * (shift steps a week). Replaces the old "Show Past Events" checkbox: the
 * past is now a direction on the axis rather than an on/off toggle.
 */
export default function TimelineRangeBrush({
  events,
  today,
  domain,
  range,
  onRangeChange,
}: TimelineRangeBrushProps) {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const grabRef = useRef<{ offset: number; from: number; to: number } | null>(
    null
  );

  const buckets = useMemo(
    () => buildHistogram(events, domain, today),
    [events, domain, today]
  );
  const peak = useMemo(() => peakCount(buckets), [buckets]);
  const monthTicks = useMemo(
    () => buildMonthTicks(domain, today),
    [domain, today]
  );
  const presets = useMemo(() => getPresets(domain), [domain]);

  const inRange = useMemo(
    () => filterByDayRange(events, range, today),
    [events, range, today]
  );
  const pastCount = useMemo(
    () =>
      inRange.filter((event) =>
        isPastOffset(toDayOffset(new Date(event.startDate), today))
      ).length,
    [inRange, today]
  );
  const upcomingCount = inRange.length - pastCount;

  const nowPercent = toFraction(0, domain) * 100;
  const fromPercent = toFraction(range.from, domain) * 100;
  const toPercent = toFraction(range.to, domain) * 100;

  const commit = (next: DayRange) => onRangeChange(clampRange(next, domain));

  const fractionFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  };

  const moveEdge = (edge: Edge, offset: number) => {
    if (edge === 'from') {
      commit({ from: Math.min(offset, range.to - 1), to: range.to });
    } else {
      commit({ from: range.from, to: Math.max(offset, range.from + 1) });
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    const fraction = fractionFromPointer(event);
    const offset = toOffset(fraction, domain);
    const distanceToFrom = Math.abs(fraction - toFraction(range.from, domain));
    const distanceToTo = Math.abs(fraction - toFraction(range.to, domain));

    let mode: DragMode;
    if (Math.min(distanceToFrom, distanceToTo) < HANDLE_GRAB_FRACTION) {
      mode = distanceToFrom <= distanceToTo ? 'from' : 'to';
    } else if (offset > range.from && offset < range.to) {
      mode = 'pan';
    } else {
      mode = offset < range.from ? 'from' : 'to';
    }

    grabRef.current = { offset, from: range.from, to: range.to };
    setDragMode(mode);

    if (mode !== 'pan') {
      moveEdge(mode, offset);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const grab = grabRef.current;
    if (!dragMode || !grab) return;

    const offset = toOffset(fractionFromPointer(event), domain);

    if (dragMode !== 'pan') {
      moveEdge(dragMode, offset);
      return;
    }

    const width = grab.to - grab.from;
    const shifted = grab.from + (offset - grab.offset);
    const from = Math.min(
      Math.max(shifted, domain.min),
      Math.max(domain.max - width, domain.min)
    );
    commit({ from, to: from + width });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    grabRef.current = null;
    setDragMode(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, edge: Edge) => {
    const step = event.shiftKey ? 7 : 1;
    let delta = 0;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      delta = step;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      delta = -step;
    } else {
      return;
    }

    event.preventDefault();
    moveEdge(edge, (edge === 'from' ? range.from : range.to) + delta);
  };

  const handleClass =
    'absolute -top-1 -bottom-1 w-4 -translate-x-1/2 cursor-ew-resize rounded-[5px] bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground';

  const countLabel =
    `${upcomingCount} upcoming` + (pastCount > 0 ? ` · ${pastCount} past` : '');

  return (
    <div className="card mb-8 p-5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="text-lg">{formatRangeLabel(range, today)}</h2>
          <span className="badge badge-primary">{countLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => commit({ from: preset.from, to: preset.to })}
              className={
                isPresetActive(preset, range) ? 'filter-btn-active' : 'filter-btn'
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative pt-[18px]">
        <span
          className="absolute top-0 -translate-x-1/2 font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground"
          style={{ left: `${nowPercent}%` }}
        >
          Now
        </span>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative h-16 touch-none select-none ${
            dragMode === 'pan' ? 'cursor-grabbing' : 'cursor-crosshair'
          }`}
        >
          {/* Everything before now sits on a dimmed ground. */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-muted/5"
            style={{ width: `${nowPercent}%` }}
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border" />

          {buckets.map((bucket, index) => {
            const midpoint = (bucket.from + bucket.to) / 2;
            const bucketInRange =
              midpoint >= range.from && midpoint <= range.to;
            const bucketIsPast = midpoint < 0;
            const height =
              bucket.count === 0
                ? BAR_EMPTY_HEIGHT
                : Math.round(
                    BAR_BASE_HEIGHT + (bucket.count / peak) * BAR_SCALE_HEIGHT
                  );
            const tone =
              bucket.count === 0
                ? 'bg-border'
                : bucketIsPast
                  ? 'bg-muted/40'
                  : bucketInRange
                    ? 'bg-primary'
                    : 'bg-primary/35';

            return (
              <div
                key={index}
                aria-hidden
                className={`absolute bottom-px rounded-t-sm ${tone}`}
                style={{
                  left: `calc(${toFraction(bucket.from, domain) * 100}% + 1.5px)`,
                  width: `calc(${100 / buckets.length}% - 3px)`,
                  height: `${height}px`,
                }}
              />
            );
          })}

          <div
            aria-hidden
            className="absolute -top-1 bottom-0 border-l border-dashed border-foreground/60"
            style={{ left: `${nowPercent}%` }}
          />

          <div
            aria-hidden
            className="absolute inset-y-0 cursor-grab border-y border-primary bg-primary/10"
            style={{
              left: `${fromPercent}%`,
              width: `${Math.max(toPercent - fromPercent, 0)}%`,
            }}
          />

          <button
            type="button"
            role="slider"
            aria-label="Range start"
            aria-valuemin={domain.min}
            aria-valuemax={range.to - 1}
            aria-valuenow={range.from}
            aria-valuetext={formatOffsetLong(range.from, today)}
            onKeyDown={(event) => handleKeyDown(event, 'from')}
            className={`${handleClass} ${
              dragMode === 'from' ? 'shadow-glow-lg' : 'shadow-glow'
            }`}
            style={{ left: `${fromPercent}%` }}
          >
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px]">
              <span className="h-3 w-px bg-foreground/50" />
              <span className="h-3 w-px bg-foreground/50" />
            </span>
          </button>

          <button
            type="button"
            role="slider"
            aria-label="Range end"
            aria-valuemin={range.from + 1}
            aria-valuemax={domain.max}
            aria-valuenow={range.to}
            aria-valuetext={formatOffsetLong(range.to, today)}
            onKeyDown={(event) => handleKeyDown(event, 'to')}
            className={`${handleClass} ${
              dragMode === 'to' ? 'shadow-glow-lg' : 'shadow-glow'
            }`}
            style={{ left: `${toPercent}%` }}
          >
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px]">
              <span className="h-3 w-px bg-foreground/50" />
              <span className="h-3 w-px bg-foreground/50" />
            </span>
          </button>
        </div>

        <div className="relative mt-1.5 h-5">
          {monthTicks.map((tick) => (
            <span
              key={tick.offset}
              className="absolute top-0 border-l border-border pl-1 text-xs leading-[18px] text-muted"
              style={{ left: `${toFraction(tick.offset, domain) * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
          In range
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/35" />
          Upcoming
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted/40" />
          Past
        </span>
        <span className="ml-auto hidden sm:inline">
          Drag the edges to resize or the middle to move
        </span>
      </div>
    </div>
  );
}
