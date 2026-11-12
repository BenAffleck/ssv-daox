import { track } from '@vercel/analytics';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '../events';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

describe('trackEvent', () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it('sends the event with its properties', () => {
    trackEvent('ai_rate_limited', { feature: 'qna' });

    expect(track).toHaveBeenCalledWith('ai_rate_limited', { feature: 'qna' });
  });

  it('redacts an address that slips into a string property', () => {
    trackEvent('optout_failed', {
      action: 'opt-out',
      stage: 'submit',
      reason: 'no delegation to 0x1111111111111111111111111111111111111111',
    });

    expect(track).toHaveBeenCalledWith('optout_failed', {
      action: 'opt-out',
      stage: 'submit',
      reason: 'no delegation to [address]',
    });
  });

  it('never throws, so a blocked analytics script cannot break a user flow', () => {
    vi.mocked(track).mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => trackEvent('timeline_extract_clicked', {})).not.toThrow();
  });
});
