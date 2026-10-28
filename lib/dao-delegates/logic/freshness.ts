import type { ScoreStatus } from '../types';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** How long to wait before re-fetching `/v1/status`: 1 minute near a publish, else 5. */
export function statusPollDelay(status: ScoreStatus, now: Date): number {
  const nearEta = [status.running?.eta, status.next.eta].some(
    (eta) => eta && Math.abs(new Date(eta).getTime() - now.getTime()) <= 15 * MINUTE_MS,
  );
  return status.running || nearEta ? MINUTE_MS : 5 * MINUTE_MS;
}

/** A UTC day as a date, without time-zone conversion. */
export function formatAsOf(asOf: string): string {
  const day = new Date(`${asOf}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${day} (UTC)`;
}

function formatLocal(instant: Date): string {
  return instant.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatAge(iso: string, now: Date): string {
  const hours = Math.round((now.getTime() - new Date(iso).getTime()) / HOUR_MS);
  return new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' }).format(-hours, 'hour');
}

const LATE = 'Update is taking longer than usual.';

/** "{label} expected around {time}." or, once the time has passed, that it is late. */
function expectedAround(label: string, iso: string, now: Date): string {
  const instant = new Date(iso);
  return instant < now ? LATE : `${label} expected around ${formatLocal(instant)}.`;
}

/** When the next run should publish, worded as an estimate. */
export function describeNextUpdate(status: ScoreStatus, now: Date): string {
  const { next } = status;
  return expectedAround('Next update', next.eta ?? next.starts_at, now);
}

/** The next run's time as a clause: "expected around {time}", or that it is late. */
export function nextUpdateEstimate(status: ScoreStatus, now: Date): string {
  const instant = new Date(status.next.eta ?? status.next.starts_at);
  return instant < now ? 'taking longer than usual' : `expected around ${formatLocal(instant)}`;
}

/** One line on what the leaderboard data is and when it changes next. */
export function describeFreshness(status: ScoreStatus, now: Date): string {
  const { latest, running, next } = status;
  if (running) {
    if (!running.eta) {
      return 'Updating now.';
    }
    return new Date(running.eta) < now
      ? `Updating now. ${LATE}`
      : `Updating now, expected around ${formatLocal(new Date(running.eta))}.`;
  }
  if (!latest) {
    return `No data published yet. ${expectedAround('First update', next.eta ?? next.starts_at, now)}`;
  }
  if (status.last_failure) {
    return `Latest update failed. Showing data from ${formatAsOf(latest.as_of)}.`;
  }
  return `Data for ${formatAsOf(latest.as_of)}, updated ${formatAge(latest.finished_at, now)}. ${describeNextUpdate(status, now)}`;
}
