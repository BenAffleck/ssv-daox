import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PoolBanner from '../PoolBanner';

const POOL = {
  totalPower: 1300000,
  daoHeldPower: 1260000,
  communityPower: 40000,
  delegatorCount: 2,
};

describe('PoolBanner', () => {
  it('shows the total, community-delegated power and delegator count', () => {
    render(<PoolBanner pool={POOL} />);

    expect(screen.getByText(`${(1300000).toLocaleString()} SSV`)).toBeInTheDocument();
    expect(screen.getByText(`${(40000).toLocaleString()} SSV`)).toBeInTheDocument();
    expect(screen.getByText('2 delegators')).toBeInTheDocument();
  });

  it('links to the Delegation page', () => {
    render(<PoolBanner pool={POOL} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/delegation');
  });

  it('renders nothing when the pool lookup failed', () => {
    const { container } = render(<PoolBanner pool={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
