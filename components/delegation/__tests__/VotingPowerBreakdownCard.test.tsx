import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { VotingPowerBreakdown } from '@/lib/delegation/logic/auto-delegation';

import VotingPowerBreakdownCard from '../VotingPowerBreakdownCard';

const HOLDER: VotingPowerBreakdown = {
  ownPower: 5000,
  incomingPower: 0,
  delegatorCount: 0,
  incoming: [],
  fromPool: null,
  outgoingPower: 0,
  outgoing: [],
  totalPower: 5000,
};

const DELEGATED_OUT = /Delegated-out power still counts/;

describe('VotingPowerBreakdownCard', () => {
  it('says delegated-out power still counts once the address delegates', () => {
    render(
      <VotingPowerBreakdownCard
        breakdown={{
          ...HOLDER,
          outgoingPower: 5000,
          outgoing: [
            { address: '0x1111111111111111111111111111111111111111', power: 5000, isPool: true },
          ],
          totalPower: 0,
        }}
      />,
    );

    expect(screen.getByText(DELEGATED_OUT)).toBeInTheDocument();
  });

  it('leaves the note out while nothing is delegated out', () => {
    render(<VotingPowerBreakdownCard breakdown={HOLDER} />);

    expect(screen.queryByText(DELEGATED_OUT)).not.toBeInTheDocument();
  });
});
