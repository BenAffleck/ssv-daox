'use client';

interface SourceOption {
  id: string;
  name: string;
}

interface TimelineFilterControlsProps {
  sources: SourceOption[];
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  showPastEvents: boolean;
  onShowPastEventsChange: (show: boolean) => void;
}

export default function TimelineFilterControls({
  sources,
  selectedSources,
  onSourcesChange,
  showPastEvents,
  onShowPastEventsChange,
}: TimelineFilterControlsProps) {
  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter((id) => id !== sourceId));
    } else {
      onSourcesChange([...selectedSources, sourceId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSources.length === sources.length) {
      onSourcesChange([]);
    } else {
      onSourcesChange(sources.map((s) => s.id));
    }
  };

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {/* Source filters */}
      {sources.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-muted">Sources:</span>
          <button
            onClick={handleSelectAll}
            className={
              selectedSources.length === 0 || selectedSources.length === sources.length
                ? 'filter-btn-active'
                : 'filter-btn'
            }
          >
            All
          </button>
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => handleSourceToggle(source.id)}
              className={selectedSources.includes(source.id) ? 'filter-btn-active' : 'filter-btn'}
            >
              {source.name}
            </button>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Show past events toggle */}
      <label className="filter-label">
        <input
          type="checkbox"
          checked={showPastEvents}
          onChange={(e) => onShowPastEventsChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-foreground">Show Past Events</span>
      </label>
    </div>
  );
}
