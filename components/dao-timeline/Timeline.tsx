'use client';

import { useMemo, useState } from 'react';
import {
  EventGroup,
  SerializedEvent,
  TimelineFilters,
} from '@/lib/dao-timeline/types';
import {
  getDateLabel,
  isPastDate,
  isSameDay,
  startOfDay,
} from '@/lib/dao-timeline/utils/date-utils';
import TimelineFilterControls from './TimelineFilterControls';
import TimelineView from './TimelineView';

interface SourceMetadata {
  id: string;
  name: string;
  color?: string;
}

interface TimelineProps {
  events: SerializedEvent[];
  sources: SourceMetadata[];
}

export default function Timeline({ events, sources }: TimelineProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Build source colors map
  const sourceColors = useMemo(() => {
    const colors: Record<string, string | undefined> = {};
    for (const source of sources) {
      colors[source.id] = source.color;
    }
    return colors;
  }, [sources]);

  // Filter and group events
  const groupedEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by source
    if (selectedSources.length > 0) {
      filtered = filtered.filter((event) =>
        selectedSources.includes(event.sourceId)
      );
    }

    // Filter past events
    if (!showPastEvents) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.startDate);
        return !isPastDate(eventDate);
      });
    }

    // Sort by start date
    filtered.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Group by day
    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;

    for (const event of filtered) {
      const eventDate = new Date(event.startDate);
      const eventDay = startOfDay(eventDate);

      if (!currentGroup || !isSameDay(currentGroup.date, eventDay)) {
        currentGroup = {
          date: eventDay,
          label: getDateLabel(eventDay),
          events: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.events.push(event);
    }

    return groups;
  }, [events, selectedSources, showPastEvents]);

  return (
    <div>
      <TimelineFilterControls
        sources={sources}
        selectedSources={selectedSources}
        onSourcesChange={setSelectedSources}
        showPastEvents={showPastEvents}
        onShowPastEventsChange={setShowPastEvents}
      />

      <TimelineView groups={groupedEvents} sourceColors={sourceColors} />

      <div className="mt-6 text-center text-sm text-muted">
        Showing {groupedEvents.reduce((acc, g) => acc + g.events.length, 0)} of{' '}
        {events.length} events
      </div>
    </div>
  );
}
