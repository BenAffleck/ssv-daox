export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 h-8 w-64 animate-pulse rounded bg-muted/30" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted/20" />
      </div>

      {/* Filter skeleton */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted/30" />
        <div className="h-10 w-40 animate-pulse rounded bg-muted/30" />
        <div className="h-10 w-48 animate-pulse rounded bg-muted/30" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-6 gap-4 border-b border-border p-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted/30"
            />
          ))}
        </div>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 border-b border-border p-4"
          >
            {[...Array(6)].map((_, j) => (
              <div
                key={j}
                className="h-4 animate-pulse rounded bg-muted/20"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
