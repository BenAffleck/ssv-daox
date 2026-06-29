export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <div className="mb-2 h-8 w-56 animate-pulse rounded-md bg-card-hover" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-card-hover" />
      </div>

      {/* Filter chips placeholder */}
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-16 animate-pulse rounded-lg bg-card-hover" />
        ))}
      </div>

      {/* Proposal card placeholders */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-card-hover" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-card-hover" />
            </div>
            <div className="mb-3 h-2 w-full animate-pulse rounded-full bg-card-hover" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-card-hover" />
          </div>
        ))}
      </div>
    </div>
  );
}
