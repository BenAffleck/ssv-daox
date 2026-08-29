import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fromDayOffset } from '@/lib/dao-timeline/logic/range-brush';
import { EventSource, SerializedEvent } from '@/lib/dao-timeline/types';

import TimelineRangeBrush from '../TimelineRangeBrush';

const TODAY = new Date(2026, 7, 19); // Aug 19, 2026
const DOMAIN = { min: -49, max: 134 };

function makeEvent(dayOffset: number, id = `e${dayOffset}`): SerializedEvent {
  return {
    id,
    sourceId: 'main-calendar',
    title: `Event ${id}`,
    description: null,
    startDate: fromDayOffset(dayOffset, TODAY).toISOString(),
    endDate: null,
    isAllDay: false,
    source: EventSource.ICS,
    sourceName: 'DAO Calendar',
    sourceUrl: null,
    location: null,
    isRecurring: false,
    recurrenceId: null,
    recurrence: null,
    metadata: {},
  };
}

const EVENTS = [makeEvent(-12), makeEvent(-1), makeEvent(0), makeEvent(4), makeEvent(96)];

const onRangeChange = vi.fn();

function renderBrush(range = { from: -14, to: 30 }) {
  return render(
    <TimelineRangeBrush
      events={EVENTS}
      today={TODAY}
      domain={DOMAIN}
      range={range}
      onRangeChange={onRangeChange}
    />,
  );
}

describe('TimelineRangeBrush', () => {
  beforeEach(() => {
    onRangeChange.mockClear();
  });

  it('labels the selected range', () => {
    renderBrush();
    expect(screen.getByText('Aug 5 – Sep 18')).toBeInTheDocument();
  });

  it('counts upcoming and past events inside the range', () => {
    renderBrush();
    // -12, -1, 0 and 4 are in range: two upcoming (0, 4), two past (-12, -1).
    expect(screen.getByText('2 upcoming · 2 past')).toBeInTheDocument();
  });

  it('omits the past tally when the range holds none', () => {
    renderBrush({ from: 0, to: 30 });
    expect(screen.getByText('2 upcoming')).toBeInTheDocument();
  });

  it('exposes both edges as sliders with their dates', () => {
    renderBrush();
    const start = screen.getByRole('slider', { name: 'Range start' });
    const end = screen.getByRole('slider', { name: 'Range end' });
    expect(start).toHaveAttribute('aria-valuenow', '-14');
    expect(start).toHaveAttribute('aria-valuetext', 'August 5, 2026');
    expect(end).toHaveAttribute('aria-valuenow', '30');
    expect(end).toHaveAttribute('aria-valuetext', 'September 18, 2026');
  });

  it('applies a preset on click', () => {
    renderBrush();
    fireEvent.click(screen.getByRole('button', { name: 'Next 30d' }));
    expect(onRangeChange).toHaveBeenCalledWith({ from: 0, to: 30 });
  });

  it('spans the whole domain for the All preset', () => {
    renderBrush();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onRangeChange).toHaveBeenCalledWith({ from: -49, to: 134 });
  });

  it('marks the active preset', () => {
    renderBrush({ from: 0, to: 30 });
    expect(screen.getByRole('button', { name: 'Next 30d' })).toHaveClass('filter-btn-active');
    expect(screen.getByRole('button', { name: 'Next 180d' })).toHaveClass('filter-btn');
  });

  it('offers the long presets', () => {
    renderBrush();
    for (const label of ['Past 90d', 'Next 30d', 'Next 180d', 'Next 12 months']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('clamps a preset that overshoots the axis, and still marks it active', () => {
    // DOMAIN ends at +134, so "Next 12 months" can only reach the axis end.
    renderBrush();
    fireEvent.click(screen.getByRole('button', { name: 'Next 12 months' }));
    expect(onRangeChange).toHaveBeenCalledWith({ from: 0, to: DOMAIN.max });

    onRangeChange.mockClear();
    renderBrush({ from: 0, to: DOMAIN.max });
    expect(screen.getAllByRole('button', { name: 'Next 12 months' })[1]).toHaveClass(
      'filter-btn-active',
    );
  });

  it('nudges an edge by a day with the arrow keys', () => {
    renderBrush();
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start' }), {
      key: 'ArrowRight',
    });
    expect(onRangeChange).toHaveBeenCalledWith({ from: -13, to: 30 });
  });

  it('nudges by a week with shift held', () => {
    renderBrush();
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range end' }), {
      key: 'ArrowLeft',
      shiftKey: true,
    });
    expect(onRangeChange).toHaveBeenCalledWith({ from: -14, to: 23 });
  });

  it('ignores unrelated keys', () => {
    renderBrush();
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start' }), {
      key: 'Enter',
    });
    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it('stops an edge from crossing the other', () => {
    renderBrush({ from: 0, to: 1 });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range end' }), {
      key: 'ArrowLeft',
    });
    expect(onRangeChange).toHaveBeenCalledWith({ from: 0, to: 1 });
  });

  it('keeps an edge inside the domain', () => {
    renderBrush({ from: DOMAIN.min, to: 30 });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start' }), {
      key: 'ArrowLeft',
      shiftKey: true,
    });
    expect(onRangeChange).toHaveBeenCalledWith({ from: DOMAIN.min, to: 30 });
  });

  it('renders a month tick per month in the domain', () => {
    renderBrush();
    for (const month of ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      expect(screen.getByText(month)).toBeInTheDocument();
    }
  });
});
