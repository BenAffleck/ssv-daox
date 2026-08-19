'use client';

interface SourceOption {
  id: string;
  name: string;
}

interface TimelineFilterControlsProps {
  sources: SourceOption[];
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
}

export default function TimelineFilterControls({
  sources,
  selectedSources,
  onSourcesChange,
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

  if (sources.length <= 1) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Source filters. The date range lives in the range brush below. */}
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

      <div className="flex-1" />
    </div>
  );
}
