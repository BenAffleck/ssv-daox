import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../EventCard';
import { EventSource, SerializedEvent } from '@/lib/dao-timeline/types';

function event(overrides: Partial<SerializedEvent> = {}): SerializedEvent {
  return {
    id: 'main-calendar-evt',
    sourceId: 'main-calendar',
    title: 'Community Call',
    description: null,
    startDate: new Date(2026, 2, 18, 15, 0).toISOString(),
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
    ...overrides,
  };
}

const recurring = (overrides: Partial<SerializedEvent> = {}) =>
  event({
    isRecurring: true,
    recurrenceId: 'evt',
    recurrence: {
      rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=WE',
      summary: 'Every 2 weeks on Wed',
      exceptions: [],
    },
    ...overrides,
  });

describe('EventCard', () => {
  it('states the cadence of a recurring event', () => {
    render(<EventCard event={recurring()} dayOffset={0} />);

    expect(screen.getByText('Every 2 weeks on Wed')).toBeInTheDocument();
  });

  it('shows no recurring badge for a one-off event', () => {
    render(<EventCard event={event()} dayOffset={0} />);

    expect(screen.queryByTitle(/Recurring event/)).not.toBeInTheDocument();
  });

  it('points a past occurrence at the next one', () => {
    render(
      <EventCard
        event={recurring({
          occurrence: {
            role: 'previous',
            siblingDate: new Date(2026, 3, 1).toISOString(),
          },
        })}
        dayOffset={-3}
      />
    );

    expect(screen.getByText('Next: Apr 1')).toBeInTheDocument();
  });

  it('points an upcoming occurrence back at the previous one', () => {
    render(
      <EventCard
        event={recurring({
          occurrence: {
            role: 'next',
            siblingDate: new Date(2026, 2, 4).toISOString(),
          },
        })}
        dayOffset={7}
      />
    );

    expect(screen.getByText('Previous: Mar 4')).toBeInTheDocument();
  });

  it('omits the sibling line when the series has only one visible occurrence', () => {
    render(
      <EventCard
        event={recurring({ occurrence: { role: 'next', siblingDate: null } })}
        dayOffset={7}
      />
    );

    expect(screen.queryByText(/^(Next|Previous):/)).not.toBeInTheDocument();
  });

  it('keeps the tonal demotion for a past occurrence, adding no accent', () => {
    // The design system separates past from upcoming by demotion alone, so a
    // recurring past card must not gain a border or colour of its own.
    const { container } = render(
      <EventCard event={recurring()} dayOffset={-3} />
    );

    const card = container.firstElementChild!;
    expect(card.className).toContain('opacity-55');
    expect(card.className).toContain('border-transparent');
    expect(screen.queryByText('Add to calendar')).not.toBeInTheDocument();
  });
});
