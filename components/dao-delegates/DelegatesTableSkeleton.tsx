/** Placeholder for the filters and the table while delegate data loads. */
export default function DelegatesTableSkeleton() {
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted/30" />
        <div className="h-10 w-40 animate-pulse rounded bg-muted/30" />
        <div className="h-10 w-48 animate-pulse rounded bg-muted/30" />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-6 gap-4 border-b border-border p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted/30" />
          ))}
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 border-b border-border p-4">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-muted/20" />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
