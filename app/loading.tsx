export default function Loading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 h-10 w-48 animate-pulse rounded bg-muted"></div>
        <div className="mx-auto h-6 w-64 animate-pulse rounded bg-muted"></div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border bg-muted/30"
          ></div>
        ))}
      </div>
    </div>
  );
}
