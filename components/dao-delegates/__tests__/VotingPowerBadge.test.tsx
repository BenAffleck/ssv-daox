import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import VotingPowerBadge from '../VotingPowerBadge';
import type { VotingPowerData } from '@/lib/gnosis/types';

const DELEGATOR_A = '0xaaa1111111111111111111111111111111111111';
const DELEGATOR_B = '0xbbb2222222222222222222222222222222222222';
const DELEGATE_C = '0xccc3333333333333333333333333333333333333';

const DATA: VotingPowerData = {
  votingPower: 1234.5,
  incomingPower: 300,
  outgoingPower: 75,
  delegatorCount: 2,
  delegators: [DELEGATOR_A, DELEGATOR_B],
  incomingDelegations: [
    { address: DELEGATOR_B, power: 200 },
    { address: DELEGATOR_A, power: 100 },
  ],
  outgoingDelegations: [{ address: DELEGATE_C, power: 75 }],
  percentOfVotingPower: 0.42,
  blockNumber: '20000000',
};

function openPopover(data: VotingPowerData = DATA) {
  render(<VotingPowerBadge votingPowerData={data} address={DELEGATOR_A} />);
  fireEvent.click(screen.getByRole('button', { name: 'Show voting power details' }));
}

describe('VotingPowerBadge breakdown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the absolute amount next to each delegating address', () => {
    openPopover();

    const incomingItem = screen.getByText(DELEGATOR_B).closest('li');
    expect(incomingItem).not.toBeNull();
    expect(within(incomingItem!).getByText('+200')).toBeInTheDocument();

    const outgoingItem = screen.getByText(DELEGATE_C).closest('li');
    expect(within(outgoingItem!).getByText('-75')).toBeInTheDocument();
  });

  it('renders a dash when the amount for an edge is unknown', () => {
    openPopover({
      ...DATA,
      incomingDelegations: [{ address: DELEGATOR_A, power: null }],
      outgoingDelegations: [],
    });

    const item = screen.getByText(DELEGATOR_A).closest('li');
    expect(within(item!).getByText('—')).toBeInTheDocument();
  });

  it('copies only the addresses of a delegation list', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    openPopover();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Copy incoming delegator addresses' })
      );
    });
    expect(writeText).toHaveBeenCalledWith(`${DELEGATOR_B}\n${DELEGATOR_A}`);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Copy outgoing delegate addresses' })
      );
    });
    expect(writeText).toHaveBeenLastCalledWith(DELEGATE_C);
  });

  it('omits a delegation list that has no entries', () => {
    openPopover({ ...DATA, outgoingDelegations: [] });

    expect(screen.getByText('Delegating in')).toBeInTheDocument();
    expect(screen.queryByText('Delegating out')).not.toBeInTheDocument();
  });
});
