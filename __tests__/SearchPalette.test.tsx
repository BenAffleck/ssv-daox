import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPalette, { openSearchPalette, SearchTrigger } from '@/components/SearchPalette';
import {
  ExternalTool,
  ExternalToolCategory,
  Module,
  ModuleStatus,
} from '@/lib/types';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const modules: Module[] = [
  {
    id: 'dao-delegates',
    slug: 'delegates',
    name: 'DAO Delegates',
    description: 'Ranked delegates leaderboard.',
    status: ModuleStatus.ACTIVE,
    sortOrder: 1,
  },
];

const tools: ExternalTool[] = [
  {
    id: 'stakeeasy',
    name: 'Stake Easy',
    description: 'Cluster advisor for SSV staking.',
    categories: [ExternalToolCategory.EXPLORER, ExternalToolCategory.SIMULATOR],
    inputs: 'ETH',
    outputs: 'Clusters',
    host: 'stakeeasy.xyz',
    url: 'https://stakeeasy.xyz',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'reward-calc',
    name: 'cSSV Reward Calculator',
    description: 'Estimate APR and rewards.',
    categories: [ExternalToolCategory.CALCULATOR],
    inputs: 'SSV',
    outputs: 'APR',
    host: 'ssv.network',
    url: 'https://ssv.network/cssv',
    sortOrder: 2,
  },
];

describe('SearchPalette', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('does not render the modal until opened', () => {
    render(<SearchPalette modules={modules} tools={tools} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens via Ctrl+K and closes via Escape', () => {
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens via the openSearchPalette() helper event', () => {
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      openSearchPalette();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('filters results across name, description, host, and category', async () => {
    const user = userEvent.setup();
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      openSearchPalette();
    });
    const input = screen.getByLabelText('Search query');
    await user.type(input, 'reward');

    expect(screen.getByText('cSSV Reward Calculator')).toBeInTheDocument();
    expect(screen.queryByText('Stake Easy')).not.toBeInTheDocument();
    expect(screen.queryByText('DAO Delegates')).not.toBeInTheDocument();
  });

  it('shows an empty state for queries with no matches', async () => {
    const user = userEvent.setup();
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      openSearchPalette();
    });
    await user.type(screen.getByLabelText('Search query'), 'nothingmatcheszzz');
    expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
  });

  it('navigates to active module routes via the Next.js router on Enter', async () => {
    const user = userEvent.setup();
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      openSearchPalette();
    });
    await user.type(screen.getByLabelText('Search query'), 'delegates');
    await user.keyboard('{Enter}');
    expect(pushMock).toHaveBeenCalledWith('/delegates');
  });

  it('opens external tools in a new tab on Enter', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<SearchPalette modules={modules} tools={tools} />);
    act(() => {
      openSearchPalette();
    });
    await user.type(screen.getByLabelText('Search query'), 'stake easy');
    await user.keyboard('{Enter}');
    expect(openSpy).toHaveBeenCalledWith(
      'https://stakeeasy.xyz',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });
});

describe('SearchTrigger', () => {
  it('dispatches the open event when clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener('daox:open-search', handler);
    render(<SearchTrigger />);
    await user.click(screen.getByTestId('search-trigger'));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('daox:open-search', handler);
  });
});
