'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="mb-4 font-heading text-4xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-8 font-body text-muted">
          An error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-6 py-3 font-heading text-background transition-colors hover:bg-secondary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
