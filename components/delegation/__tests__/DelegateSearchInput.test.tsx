import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DelegateOption } from '@/lib/delegation/logic/delegate-search';

import DelegateSearchInput, { SelectedDelegate } from '../DelegateSearchInput';

const ALICE = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const CAROL = '0xcccccccccccccccccccccccccccccccccccccccc';

const OPTIONS: DelegateOption[] = [
  { address: ALICE, name: 'Alice Nodes', ensName: 'alice.eth', rank: 1 },
  { address: CAROL, name: 'Carol Validator', ensName: null, rank: 2 },
];

function Harness() {
  const [value, setValue] = useState('');
  return (
    <>
      <DelegateSearchInput
        aria-label="Delegate"
        value={value}
        onChange={setValue}
        options={OPTIONS}
      />
      <SelectedDelegate value={value} options={OPTIONS} />
    </>
  );
}

describe('DelegateSearchInput', () => {
  it('sets the address of a delegate picked from the suggestions', () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Delegate' });

    fireEvent.change(input, { target: { value: 'carol' } });
    fireEvent.click(screen.getByRole('option', { name: /Carol Validator/ }));

    expect(input).toHaveValue(CAROL);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('Carol Validator · rank #2')).toBeInTheDocument();
  });

  it('picks the highlighted suggestion with the keyboard', () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Delegate' });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue(CAROL);
  });

  it('keeps free text such as an ENS name that matches no delegate', () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Delegate' });

    fireEvent.change(input, { target: { value: 'someone.eth' } });

    expect(input).toHaveValue('someone.eth');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
