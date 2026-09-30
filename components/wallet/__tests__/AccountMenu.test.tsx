import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AccountMenu from '../AccountMenu';

const ADDRESS = '0x1111111111111111111111111111111111111111';

function renderMenu(onDisconnect = vi.fn()) {
  render(<AccountMenu address={ADDRESS} displayName="alice.eth" onDisconnect={onDisconnect} />);
  return { trigger: screen.getByRole('button', { name: /alice\.eth/ }), onDisconnect };
}

describe('AccountMenu', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a menu linking to the connected address profile', () => {
    const { trigger } = renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Delegation profile' })).toHaveAttribute(
      'href',
      `/delegation?address=${ADDRESS}`,
    );
    expect(screen.getByRole('menuitem', { name: 'View on Etherscan' })).toHaveAttribute(
      'href',
      `https://etherscan.io/address/${ADDRESS}`,
    );
  });

  it('focuses the first item on open', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    expect(screen.getByRole('menuitem', { name: 'Delegation profile' })).toHaveFocus();
  });

  it('disconnects and closes', () => {
    const { trigger, onDisconnect } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Disconnect' }));

    expect(onDisconnect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('moves focus between items with the arrow keys, wrapping around', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Disconnect' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Delegation profile' })).toHaveFocus();
  });

  it('copies the address', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { trigger } = renderMenu();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy address' }));

    expect(writeText).toHaveBeenCalledWith(ADDRESS);
    expect(await screen.findByRole('menuitem', { name: 'Copied' })).toBeInTheDocument();
  });
});
