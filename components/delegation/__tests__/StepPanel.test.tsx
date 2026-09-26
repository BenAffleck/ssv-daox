import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StepPanel from '../StepPanel';

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

describe('StepPanel', () => {
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
});
