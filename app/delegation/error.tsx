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
        <h2 className="mb-4">Error Loading Delegation</h2>
        <p className="mb-6 text-[15px] text-muted">
          {error.message || 'Something went wrong while fetching delegation data.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg border border-primary bg-primary/10 px-6 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
