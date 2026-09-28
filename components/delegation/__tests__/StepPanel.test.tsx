import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import StepPanel, { openStep } from '../StepPanel';

function renderPanel() {
  render(
    <StepPanel step={1} title="Claim on HighSignal" summary="Link your addresses" openLabel="Start">
      <label>
        Note
        <input />
      </label>
    </StepPanel>,
  );
}

function renderAnchoredPanel() {
  render(
    <StepPanel
      title="Claim on HighSignal"
      summary="Link your addresses"
      openLabel="Start"
      anchor="claim"
    >
      <label>
        Note
        <input />
      </label>
    </StepPanel>,
  );
}

describe('StepPanel', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('starts collapsed and expands on the toggle', () => {
    renderPanel();
    expect(screen.getByLabelText('Note')).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByLabelText('Note')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps what was entered after collapsing', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'kept' } });

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByLabelText('Note')).toHaveValue('kept');
  });

  it('opens when the page URL targets its anchor', () => {
    window.history.replaceState(null, '', '/delegation#claim');
    renderAnchoredPanel();

    expect(screen.getByLabelText('Note')).toBeVisible();
  });

  it('opens from an in-page link, again after being collapsed', async () => {
    render(<a href="#claim">Go to claim</a>);
    renderAnchoredPanel();

    fireEvent.click(screen.getByRole('link', { name: 'Go to claim' }));
    await waitFor(() => expect(screen.getByLabelText('Note')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    fireEvent.click(screen.getByRole('link', { name: 'Go to claim' }));
    await waitFor(() => expect(screen.getByLabelText('Note')).toBeVisible());
  });

  it('opens when another component asks for its step', () => {
    render(
      <button type="button" onClick={() => openStep('claim')}>
        Become a delegate
      </button>,
    );
    renderAnchoredPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Become a delegate' }));

    expect(screen.getByLabelText('Note')).toBeVisible();
  });
});
