'use client';

import {
  ExtractionStats,
  TimeWindow,
  TIME_WINDOWS,
} from '@/lib/ai-extraction/types';

interface AIExtractionPanelProps {
  /** Whether AI extraction is available (API configured) */
  isAvailable: boolean;
  /** Whether extraction is currently in progress */
  isExtracting: boolean;
  /** Progress of extraction (current/total proposals) */
  progress: { current: number; total: number } | null;
  /** Stats from last extraction (shown after completion) */
  stats: ExtractionStats | null;
  /** Error message if extraction failed */
  error: string | null;
  /** Callback to start extraction */
  onExtract: () => void;
  /** Callback to refresh/re-extract */
  onRefresh: () => void;
  /** Currently selected time window */
  timeWindow: TimeWindow;
  /** Callback when time window changes */
  onTimeWindowChange: (window: TimeWindow) => void;
  /** Proposal counts for each time window */
  proposalCounts: Record<TimeWindow, number>;
}

export default function AIExtractionPanel({
  isAvailable,
  isExtracting,
  progress,
  stats,
  error,
  onExtract,
  onRefresh,
  timeWindow,
  onTimeWindowChange,
  proposalCounts,
}: AIExtractionPanelProps) {
  // Don't show panel if AI extraction is not available
  if (!isAvailable) {
    return null;
  }

  // Calculate progress percentage
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  // Get proposal count for current window
  const proposalCount = proposalCounts[timeWindow];

  // Show completed state if we have stats
  if (stats && !isExtracting) {
    const hasError = error || stats.errors > 0;
    const borderClass = hasError
      ? 'border-red-500/30 bg-red-500/5'
      : 'border-violet-500/30 bg-violet-500/5';

    return (
      <div className={`mb-6 rounded-lg border p-4 ${borderClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-lg"
              role="img"
              aria-label={hasError ? 'warning' : 'sparkles'}
            >
              {hasError ? '⚠️' : '✨'}
            </span>
            <div>
              <h3 className="font-medium text-foreground">
                {hasError && stats.eventsFound === 0
                  ? 'AI Extraction Failed'
                  : 'AI Insights Extracted'}
              </h3>
              <p className="text-sm text-muted">
                {stats.eventsFound > 0 ? (
                  <>
                    Found {stats.eventsFound} event
                    {stats.eventsFound !== 1 ? 's' : ''} from{' '}
                    {stats.totalProposals} proposal
                    {stats.totalProposals !== 1 ? 's' : ''}
                    {stats.proposalsFromCache > 0 && (
                      <span className="text-muted/70">
                        {' '}
                        ({stats.proposalsFromCache} from cache)
                      </span>
                    )}
                  </>
                ) : hasError ? (
                  'Could not extract events from proposals'
                ) : (
                  'No timeline events found in proposals'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-card-hover"
          >
            Retry
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-md bg-red-500/10 p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Show extracting state
  if (isExtracting) {
    return (
      <div className="mb-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-lg" role="img" aria-label="sparkles">
              ✨
            </span>
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500"></span>
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              Extracting AI Insights...
            </h3>
            <p className="text-sm text-muted">
              {progress
                ? `Analyzing proposal ${progress.current + 1} of ${progress.total}...`
                : 'Starting analysis...'}
            </p>
            {progress && progress.total > 0 && (
              <>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-violet-500/20">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted/70">
                  {progressPercent}% complete
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show initial state with extract button and time window selector
  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg" role="img" aria-label="sparkles">
            ✨
          </span>
          <div>
            <h3 className="font-medium text-foreground">Extract AI Insights</h3>
            <p className="text-sm text-muted">
              Analyze proposals to find milestones and deadlines
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="time-window" className="text-sm text-muted">
              Time range:
            </label>
            <select
              id="time-window"
              value={timeWindow}
              onChange={(e) => onTimeWindowChange(e.target.value as TimeWindow)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {TIME_WINDOWS.map((window) => (
                <option key={window.id} value={window.id}>
                  {window.label} ({proposalCounts[window.id]})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onExtract}
            disabled={proposalCount === 0}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Extract Events
          </button>
        </div>
      </div>
      {proposalCount > 0 && (
        <p className="mt-3 text-xs text-muted/70">
          Will analyze {proposalCount} proposal{proposalCount !== 1 ? 's' : ''}
        </p>
      )}
      {proposalCount === 0 && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          No proposals in the selected time range
        </p>
      )}
      {error && (
        <div className="mt-3 rounded-md bg-red-500/10 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
