import {
  formatDelegatorCount,
  formatPower,
  type BreakdownEntry,
  type VotingPowerBreakdown,
} from '@/lib/delegation/logic/auto-delegation';

import DelegateName from './DelegateName';

function formatAmount(power: number | null): string {
  return power === null ? '\u2014' : formatPower(power);
}

function Row({
  label,
  note,
  value,
  sub = false,
  total = false,
}: {
  label: string;
  note?: string;
  value: string;
  sub?: boolean;
  total?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${sub ? 'pl-4' : ''} ${total ? 'border-t border-border pt-1.5' : ''}`}
    >
      <dt className="text-muted">
        {label}
        {note && <span className="ml-1 text-xs">· {note}</span>}
      </dt>
      <dd className="shrink-0 font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function EntryList({ title, entries }: { title: string; entries: BreakdownEntry[] }) {
  return (
    <div>
      <p className="font-heading text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="mt-1 text-muted">None</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {entries.map((entry) => (
            <li key={entry.address} className="flex items-baseline justify-between gap-3">
              <DelegateName
                address={entry.address}
                isPool={entry.isPool}
                className="text-xs break-all"
              />
              <span className="shrink-0 text-xs tabular-nums">
                {entry.power === null ? '—' : formatPower(entry.power)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The selected address's voting power; `null` when the pin lookup failed. */
export default function VotingPowerBreakdownCard({
  breakdown,
}: {
  breakdown: VotingPowerBreakdown | null;
}) {
  if (!breakdown) {
    return (
      <p role="status" className="text-[13px] text-muted">
        Voting power couldn&apos;t be loaded, so delegating is paused. Try again in a few minutes.
      </p>
    );
  }
  return (
    <div className="text-[13px]">
      <dl className="space-y-1.5">
        <Row label="Tokens held" note="SSV + cSSV" value={formatPower(breakdown.ownPower)} />
        <Row
          label="Delegated in"
          note={formatDelegatorCount(breakdown.delegatorCount)}
          value={formatPower(breakdown.incomingPower)}
        />
        {breakdown.fromPool && (
          <Row
            label="of which from the DAO pool"
            value={formatAmount(breakdown.fromPool.power)}
            sub
          />
        )}
        <Row
          label="Delegated out"
          value={`${breakdown.outgoingPower > 0 ? '−' : ''}${formatPower(breakdown.outgoingPower)}`}
        />
        <Row label="Total voting power" value={formatPower(breakdown.totalPower)} total />
      </dl>
      <details className="mt-3">
        <summary className="cursor-pointer text-primary">Details</summary>
        <div className="mt-2 space-y-3">
          <EntryList title="Delegated in" entries={breakdown.incoming} />
          <EntryList title="Delegated out" entries={breakdown.outgoing} />
        </div>
      </details>
    </div>
  );
}
