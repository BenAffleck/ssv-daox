export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-muted"></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-8">
        <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  );
}
