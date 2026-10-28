import { beforeAll, describe, expect, it } from 'vitest';

import type { ScoreStatus } from '../../types';
import { describeFreshness, statusPollDelay } from '../freshness';

const LATEST = {
  run_id: 42,
  as_of: '2026-10-27',
  started_at: '2026-10-28T00:30:02+00:00',
  finished_at: '2026-10-28T00:41:12+00:00',
};

const NEXT = {
  as_of: '2026-10-28',
  starts_at: '2026-10-29T00:30:00+00:00',
  eta: '2026-10-29T00:41:00+00:00',
};

function status(overrides: Partial<ScoreStatus> = {}): ScoreStatus {
  return { latest: LATEST, running: null, last_failure: null, next: NEXT, ...overrides };
}

const at = (iso: string) => new Date(iso);

describe('describeFreshness', () => {
  beforeAll(() => {
    // CET (UTC+1) after the October change, so local times differ from UTC.
    process.env.TZ = 'Europe/Berlin';
  });

  it('cites the as-of day, the publish age and the next ETA in local time', () => {
    expect(describeFreshness(status(), at('2026-10-28T03:41:00Z'))).toBe(
      'Data for Oct 27, 2026 (UTC), updated 3 hours ago. Next update expected around Oct 29, 1:41 AM.',
    );
  });

  it('says a run is updating, with its ETA when known', () => {
    const running = {
      run_id: 43,
      as_of: '2026-10-28',
      started_at: '2026-10-29T00:30:01+00:00',
      eta: '2026-10-29T00:41:00+00:00',
    };
    const now = at('2026-10-29T00:35:00Z');

    expect(describeFreshness(status({ running }), now)).toBe(
      'Updating now, expected around Oct 29, 1:41 AM.',
    );
    expect(describeFreshness(status({ running: { ...running, eta: null } }), now)).toBe(
      'Updating now.',
    );
  });

  it('says the latest update failed, without the reason', () => {
    const lastFailure = {
      run_id: 43,
      as_of: '2026-10-28',
      started_at: '2026-10-29T00:30:01+00:00',
      finished_at: '2026-10-29T00:33:00+00:00',
      reason: 'error' as const,
    };

    expect(
      describeFreshness(status({ last_failure: lastFailure }), at('2026-10-29T01:00:00Z')),
    ).toBe('Latest update failed. Showing data from Oct 27, 2026 (UTC).');
  });

  it('expects the first update at the scheduled start before any run has published', () => {
    const firstRun = status({ latest: null, next: { ...NEXT, eta: null } });

    expect(describeFreshness(firstRun, at('2026-10-28T12:00:00Z'))).toBe(
      'No data published yet. First update expected around Oct 29, 1:30 AM.',
    );
  });

  it('says the update is late once now is past its ETA', () => {
    const running = {
      run_id: 43,
      as_of: '2026-10-28',
      started_at: '2026-10-29T00:30:01+00:00',
      eta: '2026-10-29T00:41:00+00:00',
    };
    const late = at('2026-10-29T01:10:00Z');

    expect(describeFreshness(status({ running }), late)).toBe(
      'Updating now. Update is taking longer than usual.',
    );
    expect(describeFreshness(status(), late)).toBe(
      'Data for Oct 27, 2026 (UTC), updated 24 hours ago. Update is taking longer than usual.',
    );
  });
});

describe('statusPollDelay', () => {
  const MINUTE = 60_000;

  it('polls every 5 minutes away from any ETA', () => {
    expect(statusPollDelay(status(), at('2026-10-28T12:00:00Z'))).toBe(5 * MINUTE);
  });

  it('polls every minute while a run is in progress', () => {
    const running = {
      run_id: 43,
      as_of: '2026-10-28',
      started_at: '2026-10-29T00:30:01+00:00',
      eta: null,
    };

    expect(statusPollDelay(status({ running }), at('2026-10-29T00:31:00Z'))).toBe(MINUTE);
  });

  it('polls every minute within 15 minutes of an ETA, before or after it', () => {
    expect(statusPollDelay(status(), at('2026-10-29T00:30:00Z'))).toBe(MINUTE);
    expect(statusPollDelay(status(), at('2026-10-29T00:55:00Z'))).toBe(MINUTE);
  });
});
