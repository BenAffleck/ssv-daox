import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { transformDelegates } from '@/lib/dao-delegates/logic/data-transformer';
import type { Cohort, ScoreRow } from '@/lib/dao-delegates/types';
import type { OptOutStatuses } from '@/lib/delegation/opt-out/score-api';

import DelegateRow from '../DelegateRow';

const ADDRESS = '0xAAA1111111111111111111111111111111111111';

function row(cohort: Cohort | null): ScoreRow {
  return {
    address: ADDRESS,
    display_name: 'alice',
    rank: 1,
    score: 50,
    community: null,
    holdings: 50,
    votes: 50,
    missing_community: false,
    missing_holdings: false,
    missing_votes: false,
    twab: null,
    twab_days: null,
    community_raw: null,
    voted_count: null,
    proposal_count: null,
    hs_rank: null,
    identity: {
      id: 'alice',
      hs_username: null,
      forum_handle: null,
      discord_handle: null,
      addresses: [{ address: ADDRESS, ens_name: null }],
    },
    cohort,
    power: 100,
    opt_out: null,
  };
}

function renderRow(statuses: OptOutStatuses, cohort: Cohort | null = 'professional') {
  const [delegate] = transformDelegates(
    [row(cohort)],
    [ADDRESS],
    undefined,
    undefined,
    undefined,
    statuses,
  );
  render(
    <table>
      <tbody>
        <DelegateRow delegate={delegate} livePillars={[]} />
      </tbody>
    </table>,
  );
}

describe('DelegateRow delegation status', () => {
  it('shows the delegation status without an opt-out request', () => {
    renderRow({ [ADDRESS.toLowerCase()]: null });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Opt-out pending')).not.toBeInTheDocument();
  });

  it('replaces the delegation status with a pending opt-out', () => {
    renderRow({ [ADDRESS.toLowerCase()]: { action: 'opt-out', status: 'pending' } });

    expect(screen.getByText('Opt-out pending')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('replaces Remove with a pending opt-out', () => {
    renderRow({ [ADDRESS.toLowerCase()]: { action: 'opt-out', status: 'pending' } }, null);

    expect(screen.getByText('Opt-out pending')).toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('replaces the delegation status with an applied opt-out', () => {
    renderRow({ [ADDRESS.toLowerCase()]: { action: 'opt-out', status: 'applied' } }, null);

    expect(screen.getByText('Opted out')).toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it.each([
    { action: 'opt-in', status: 'pending' },
    { action: 'opt-in', status: 'applied' },
  ] as const)('keeps the delegation status for $action $status', (status) => {
    renderRow({ [ADDRESS.toLowerCase()]: status });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Opt/)).not.toBeInTheDocument();
  });
});
