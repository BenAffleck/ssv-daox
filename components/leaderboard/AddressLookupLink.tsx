import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';

/** Opens the Delegation page of an address or ENS name the leaderboard doesn't rank. */
export default function AddressLookupLink({ target }: { target: string }) {
  return (
    <Link
      href={`/delegation?address=${encodeURIComponent(target)}`}
      className="card group mb-4 flex items-center gap-3 p-4 transition-colors hover:border-primary"
    >
      <Search size={16} aria-hidden className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 text-[13px] text-muted">
        <code className="font-mono break-all text-foreground">{target}</code> isn&apos;t on the
        leaderboard.
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary group-hover:underline">
        Open delegation
        <ChevronRight size={14} aria-hidden />
      </span>
    </Link>
  );
}
