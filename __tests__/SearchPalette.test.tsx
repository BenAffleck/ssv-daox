import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SearchPalette, { openSearchPalette, SearchTrigger } from '@/components/SearchPalette';
import { ExternalTool, ExternalToolCategory, Module, ModuleStatus } from '@/lib/types';

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
    expect(openSpy).toHaveBeenCalledWith('https://stakeeasy.xyz', '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });
});

describe('SearchPalette votes', () => {
  const votes = [
    {
      id: '0xfee',
      title: 'Adjust the fee recipient address',
      snippet: 'Moves protocol fees to a new multisig.',
      spaceKey: 'main',
      spaceLabel: 'DAO',
      state: 'active',
      end: 1700100000,
      link: 'https://snapshot.org/#/x/proposal/0xfee',
    },
  ];

  beforeEach(() => {
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Open the palette and let the lazy vote-index fetch settle. */
  async function openWithVotes(payload: unknown = { votes, failedSpaces: [] }) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    render(<SearchPalette modules={modules} tools={tools} />);
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });
  }

  it('lazily loads the vote index on first open and lists a Votes group', async () => {
    await openWithVotes();

    expect(fetch).toHaveBeenCalledWith('/api/vote-index');
    expect(await screen.findByText('Votes')).toBeInTheDocument();
    expect(screen.getByText('Adjust the fee recipient address')).toBeInTheDocument();
  });

  it('matches a vote on its title and floats the Votes group above Modules', async () => {
    const user = userEvent.setup();
    await openWithVotes();
    await screen.findByText('Votes');

    await user.type(screen.getByLabelText('Search query'), 'fee recipient');

    const groups = screen
      .getAllByText(/^(Modules|External tools|Votes)$/)
      .map((el) => el.textContent);
    expect(groups[0]).toBe('Votes');
  });

  it('matches a vote on its body snippet', async () => {
    const user = userEvent.setup();
    await openWithVotes();
    await screen.findByText('Votes');

    await user.type(screen.getByLabelText('Search query'), 'multisig');

    expect(screen.getByText('Adjust the fee recipient address')).toBeInTheDocument();
  });

  it('routes to the ask deep link when a vote is selected', async () => {
    const user = userEvent.setup();
    await openWithVotes();
    await screen.findByText('Votes');

    await user.click(screen.getByText('Adjust the fee recipient address'));

    expect(pushMock).toHaveBeenCalledWith('/governance?ask=0xfee');
  });

  it('still renders modules and tools when the vote index fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<SearchPalette modules={modules} tools={tools} />);
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });

    expect(screen.getByText('DAO Delegates')).toBeInTheDocument();
    expect(screen.queryByText('Votes')).not.toBeInTheDocument();
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

  it('renders an icon-only button in the icon variant and dispatches open on click', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener('daox:open-search', handler);
    render(<SearchTrigger variant="icon" />);
    const btn = screen.getByTestId('search-trigger-icon');
    expect(btn).toHaveAttribute('aria-label', 'Open search');
    expect(btn.textContent).toBe('');
    await user.click(btn);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('daox:open-search', handler);
  });
});
