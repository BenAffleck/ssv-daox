import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DelegateToDaoPanel from '../DelegateToDaoPanel';

const CAMPAIGN_URL = 'https://example.com/the-distributed-vote';

describe('DelegateToDaoPanel', () => {
  it('links to the campaign from a ribbon while a campaign runs', () => {
    render(<DelegateToDaoPanel campaignUrl={CAMPAIGN_URL} />);

    expect(screen.getByRole('region', { name: 'Delegate to the DAO' })).toHaveTextContent(
      'The Distributed Vote · Incentives live for cSSV delegated to the DAO pool',
    );
    const link = screen.getByRole('link', { name: /Check eligibility/ });
    expect(link).toHaveAttribute('href', CAMPAIGN_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows no campaign without a campaign URL', () => {
    render(<DelegateToDaoPanel />);

    expect(screen.queryByText(/The Distributed Vote/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Check eligibility/ })).not.toBeInTheDocument();
  });
});
