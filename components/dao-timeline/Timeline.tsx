'use client';

import { useCallback, useMemo, useState } from 'react';
import { EventGroup, SerializedEvent } from '@/lib/dao-timeline/types';
import {
  getDateLabel,
  isPastDate,
  isSameDay,
  startOfDay,
} from '@/lib/dao-timeline/utils/date-utils';
import {
  ExtractionStats,
  ProposalForExtraction,
  TimeWindow,
  filterProposalsByTimeWindow,
  getProposalCountsByWindow,
} from '@/lib/ai-extraction/types';
import {
  AI_EXTRACTION_SOURCE_ID,
  AI_EXTRACTION_SOURCE_NAME,
} from '@/lib/ai-extraction/transform';
import TimelineFilterControls from './TimelineFilterControls';
import TimelineView from './TimelineView';
import AIExtractionPanel from './AIExtractionPanel';

interface SourceMetadata {
  id: string;
  name: string;
  color?: string;
}

interface TimelineProps {
  events: SerializedEvent[];
  sources: SourceMetadata[];
  /** Proposals available for AI extraction */
  proposals?: ProposalForExtraction[];
  /** Whether AI extraction is available */
  aiExtractionAvailable?: boolean;
}

export default function Timeline({
  events,
  sources,
  proposals = [],
  aiExtractionAvailable = false,
}: TimelineProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // AI extraction state
  const [aiEvents, setAiEvents] = useState<SerializedEvent[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [extractionStats, setExtractionStats] =
    useState<ExtractionStats | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Time window state for AI extraction
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');

  // Flag to skip cache on next extraction (set after retry)
  const [skipCache, setSkipCache] = useState(false);

  // Compute proposal counts for each time window
  const proposalCounts = useMemo(
    () => getProposalCountsByWindow(proposals),
    [proposals]
  );

  // Filter proposals by selected time window
  const filteredProposals = useMemo(
    () => filterProposalsByTimeWindow(proposals, timeWindow),
    [proposals, timeWindow]
  );

  // Combine regular events with AI events
  const allEvents = useMemo(() => {
    return [...events, ...aiEvents];
  }, [events, aiEvents]);

  // Add AI source to sources if we have AI events
  const allSources = useMemo(() => {
    if (aiEvents.length > 0) {
      return [
        ...sources,
        {
          id: AI_EXTRACTION_SOURCE_ID,
          name: AI_EXTRACTION_SOURCE_NAME,
          color: 'ai-insights',
        },
      ];
    }
    return sources;
  }, [sources, aiEvents.length]);

  // Build source colors map
  const sourceColors = useMemo(() => {
    const colors: Record<string, string | undefined> = {};
    for (const source of allSources) {
      colors[source.id] = source.color;
    }
    return colors;
  }, [allSources]);

  // Handle AI extraction - process proposals one by one for progress indication
  const handleExtract = useCallback(async () => {
    if (filteredProposals.length === 0) {
      setExtractionError('No proposals available for extraction');
      return;
    }

    // Capture current skipCache value and reset it
    const shouldSkipCache = skipCache;
    setSkipCache(false);

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress({ current: 0, total: filteredProposals.length });

    const allExtractedEvents: SerializedEvent[] = [];
    const stats: ExtractionStats = {
      totalProposals: filteredProposals.length,
      proposalsProcessed: 0,
      proposalsFromCache: 0,
      eventsFound: 0,
      errors: 0,
    };

    try {
      // Process proposals one by one
      for (let i = 0; i < filteredProposals.length; i++) {
        const proposal = filteredProposals[i];
        setExtractionProgress({ current: i, total: filteredProposals.length });

        try {
          const response = await fetch('/api/ai-extraction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proposals: [proposal],
              skipCache: shouldSkipCache,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Extraction failed');
          }

          // Accumulate events
          if (data.events && data.events.length > 0) {
            allExtractedEvents.push(...data.events);
            stats.eventsFound += data.events.length;
          }

          // Track stats
          if (data.stats) {
            stats.proposalsProcessed += data.stats.proposalsProcessed || 0;
            stats.proposalsFromCache += data.stats.proposalsFromCache || 0;
            if (data.stats.errors > 0) {
              stats.errors += data.stats.errors;
            }
          }

          // Check for critical errors (billing, auth)
          if (data.error || data.stats?.errorMessage) {
            const errorMsg = data.error || data.stats.errorMessage;
            // Stop on billing/auth errors
            if (
              errorMsg.toLowerCase().includes('credit') ||
              errorMsg.toLowerCase().includes('billing') ||
              errorMsg.toLowerCase().includes('api key')
            ) {
              stats.errorMessage = errorMsg;
              break;
            }
          }
        } catch (error) {
          console.error(
            `Error extracting from proposal ${proposal.id}:`,
            error
          );
          stats.errors++;
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          // Stop on critical errors
          if (
            errorMsg.toLowerCase().includes('credit') ||
            errorMsg.toLowerCase().includes('billing') ||
            errorMsg.toLowerCase().includes('api key')
          ) {
            stats.errorMessage = errorMsg;
            break;
          }
        }
      }

      setAiEvents(allExtractedEvents);
      setExtractionStats(stats);
      setExtractionProgress({
        current: filteredProposals.length,
        total: filteredProposals.length,
      });

      if (stats.errorMessage) {
        setExtractionError(stats.errorMessage);
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
      setExtractionError(
        error instanceof Error ? error.message : 'Extraction failed'
      );
    } finally {
      setIsExtracting(false);
    }
  }, [filteredProposals, skipCache]);

  // Handle retry - reset to initial state and allow time window reselection
  const handleRefresh = useCallback(() => {
    // Clear previous results and reset to initial state
    setAiEvents([]);
    setExtractionStats(null);
    setExtractionError(null);
    setExtractionProgress(null);
    // Set flag to skip cache on next extraction
    setSkipCache(true);
  }, []);

  // Filter and group events
  const groupedEvents = useMemo(() => {
    let filtered = [...allEvents];

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
  }, [allEvents, selectedSources, showPastEvents]);

  return (
    <div>
      {/* AI Extraction Panel */}
      <AIExtractionPanel
        isAvailable={aiExtractionAvailable && proposals.length > 0}
        isExtracting={isExtracting}
        progress={extractionProgress}
        stats={extractionStats}
        error={extractionError}
        onExtract={handleExtract}
        onRefresh={handleRefresh}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        proposalCounts={proposalCounts}
      />

      <TimelineFilterControls
        sources={allSources}
        selectedSources={selectedSources}
        onSourcesChange={setSelectedSources}
        showPastEvents={showPastEvents}
        onShowPastEventsChange={setShowPastEvents}
      />

      <TimelineView groups={groupedEvents} sourceColors={sourceColors} />

      <div className="mt-6 text-center text-sm text-muted">
        Showing {groupedEvents.reduce((acc, g) => acc + g.events.length, 0)} of{' '}
        {allEvents.length} events
        {aiEvents.length > 0 && (
          <span className="text-violet-600 dark:text-violet-400">
            {' '}
            (including {aiEvents.length} AI-extracted)
          </span>
        )}
      </div>
    </div>
  );
}
