import { fireEvent, render, screen } from '@testing-library/react';
import { track } from '@vercel/analytics';
import { describe, expect, it, vi } from 'vitest';

import CampaignRibbon from '../CampaignRibbon';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

describe('CampaignRibbon', () => {
  it('records which card the campaign link was clicked from', () => {
    render(<CampaignRibbon url="https://example.com/campaign" placement="banner" />);

    fireEvent.click(screen.getByRole('link', { name: /Check eligibility/ }));

    expect(track).toHaveBeenCalledWith('campaign_link_clicked', { placement: 'banner' });
  });
});
