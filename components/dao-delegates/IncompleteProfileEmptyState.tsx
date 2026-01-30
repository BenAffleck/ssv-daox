import { Delegate } from '@/lib/dao-delegates/types';
import { KARMA_PROFILE_BASE_URL } from '@/lib/dao-delegates/config';

interface IncompleteProfileEmptyStateProps {
  delegate: Delegate;
  onShowIncompleteProfiles: () => void;
}

export default function IncompleteProfileEmptyState({
  delegate,
  onShowIncompleteProfiles,
}: IncompleteProfileEmptyStateProps) {
  const karmaProfileUrl = `${KARMA_PROFILE_BASE_URL}/${delegate.publicAddress}`;

  return (
    <div className="rounded-lg border border-secondary/40 bg-gradient-to-br from-secondary/5 to-primary/5 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
        <svg
          className="h-6 w-6 text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
        We found you, {delegate.displayName}!
      </h3>

      <p className="mb-4 font-body text-sm text-muted">
        Your delegate profile is incomplete and hidden by default.
      </p>

      <div className="mx-auto mb-6 max-w-xs rounded-lg bg-card/50 p-4 text-left">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Required to complete your profile:
        </p>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2 text-foreground">
            <span className="text-warning">*</span>
            Forum Handle
          </li>
          <li className="flex items-center gap-2 text-foreground">
            <span className="text-warning">*</span>
            Discord Username
          </li>
        </ul>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={karmaProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
        >
          Complete Profile on Karma
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        <button
          onClick={onShowIncompleteProfiles}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          Show Incomplete Profiles
        </button>
      </div>
    </div>
  );
}
