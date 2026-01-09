'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-foreground">
          Error Loading Delegates
        </h2>
        <p className="mb-6 text-muted">
          {error.message || 'Something went wrong while fetching delegate data.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg border border-primary bg-primary/10 px-6 py-2 font-heading text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
