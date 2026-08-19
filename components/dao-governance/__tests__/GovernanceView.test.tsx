import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GovernanceView from '../GovernanceView';
import type { GovernanceProposal, GovernanceSpace } from '@/lib/snapshot/types';

// --- next/navigation mock (controllable search params) ---
let searchParamsValue = new URLSearchParams();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  usePathname: () => '/governance',
  useSearchParams: () => searchParamsValue,
}));

const DAO: GovernanceSpace = {
  key: 'main',
  label: 'DAO',
  spaceId: 'mainnet.ssvnetwork.eth',
  voteType: 'token',
};
const OPERATORS: GovernanceSpace = {
  key: 'operator',
  label: 'Operators',
  spaceId: 'vo.ssvnetwork.eth',
  voteType: 'member',
};
const SPACES = [DAO, OPERATORS];

function proposal(
  id: string,
  space: GovernanceSpace,
  state: 'active' | 'pending' | 'closed'
): GovernanceProposal {
  return {
    id,
    title: `Proposal ${id}`,
    body: `Body text for ${id}`,
    start: 1700000000,
    end: 1700100000,
    state,
    choices: ['For', 'Against'],
    scores: [1, 0],
    scores_total: 1,
    votes: 1,
    quorum: 0,
    type: 'single-choice',
    link: `https://snapshot.org/#/x/proposal/${id}`,
    space,
  };
}

const PROPOSALS = [
  proposal('m-active', DAO, 'active'),
  proposal('o-active', OPERATORS, 'active'),
  proposal('m-pending', DAO, 'pending'),
  proposal('m-closed', DAO, 'closed'),
];

function renderView(props: Partial<React.ComponentProps<typeof GovernanceView>> = {}) {
  return render(
    <GovernanceView
      proposals={PROPOSALS}
      spaces={SPACES}
      failedSpaces={[]}
      isAISummaryAvailable={false}
      {...props}
    />
  );
}

describe('GovernanceView', () => {
  beforeEach(() => {
    searchParamsValue = new URLSearchParams();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it('renders all proposals grouped into active, upcoming, and past by default', () => {
    renderView();
    expect(screen.getByText('Active Votes')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Votes')).toBeInTheDocument();
    expect(screen.getByText('Past Votes')).toBeInTheDocument();
    expect(screen.getByText('Proposal m-active')).toBeInTheDocument();
    expect(screen.getByText('Proposal o-active')).toBeInTheDocument();
    expect(screen.getByText('Proposal m-pending')).toBeInTheDocument();
    expect(screen.getByText('Proposal m-closed')).toBeInTheDocument();
  });

  it('renders an outcome badge on a closed proposal', () => {
    renderView();
    // m-closed: token-weighted, "For" wins, no quorum → Passed
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('narrows to the selected status (Active only) from the URL', () => {
    searchParamsValue = new URLSearchParams('status=active');
    renderView();
    expect(screen.getByText('Active Votes')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming Votes')).not.toBeInTheDocument();
    expect(screen.queryByText('Past Votes')).not.toBeInTheDocument();
    expect(screen.queryByText('Proposal m-closed')).not.toBeInTheDocument();
  });

  it('writes the status to the URL when a status segment is selected', () => {
    renderView();
    fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
    expect(replaceMock).toHaveBeenCalledTimes(1);
    const target = replaceMock.mock.calls[0][0] as string;
    expect(target).toContain('status=closed');
  });

  it('narrows the list to a single selected space from the URL', () => {
    searchParamsValue = new URLSearchParams('space=main');
    renderView();
    expect(screen.getByText('Proposal m-active')).toBeInTheDocument();
    expect(screen.queryByText('Proposal o-active')).not.toBeInTheDocument();
  });

  it('shows an error banner with retry when a space failed to load', () => {
    renderView({ failedSpaces: ['Multisig'] });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Multisig');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('selects only one space when its chip is clicked (single-select)', () => {
    renderView();
    // Default is "All spaces"; clicking "Operators" selects only that space.
    fireEvent.click(screen.getByRole('button', { name: 'Operators' }));
    expect(replaceMock).toHaveBeenCalledTimes(1);
    const target = replaceMock.mock.calls[0][0] as string;
    expect(target).toContain('space=operator');
  });

  it('resets to all spaces when "All spaces" is clicked', () => {
    searchParamsValue = new URLSearchParams('space=operator');
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'All spaces' }));
    expect(replaceMock).toHaveBeenCalledTimes(1);
    // space param dropped (default) → clean URL
    const target = replaceMock.mock.calls[0][0] as string;
    expect(target).not.toContain('space=');
  });

  describe('search', () => {
    it('narrows the list to proposals matching ?q=', () => {
      searchParamsValue = new URLSearchParams('q=m-closed');
      renderView();
      expect(screen.getByText('Proposal m-closed')).toBeInTheDocument();
      expect(screen.queryByText('Proposal m-active')).not.toBeInTheDocument();
      expect(screen.queryByText('Proposal o-active')).not.toBeInTheDocument();
    });

    it('shows a match count only while a search is active', () => {
      renderView();
      expect(screen.queryByTestId('vote-search-count')).not.toBeInTheDocument();

      searchParamsValue = new URLSearchParams('q=m-closed');
      renderView();
      expect(screen.getByTestId('vote-search-count')).toHaveTextContent('1 of 4 votes match');
    });

    it('intersects the search with the space and status filters', () => {
      // "Proposal m" matches every DAO proposal; status=closed narrows to one.
      searchParamsValue = new URLSearchParams('q=Proposal m&status=closed');
      renderView();
      expect(screen.getByText('Proposal m-closed')).toBeInTheDocument();
      expect(screen.queryByText('Proposal m-active')).not.toBeInTheDocument();
    });

    it('explains an empty result in terms of the search', () => {
      searchParamsValue = new URLSearchParams('q=zzzznotathing');
      renderView();
      expect(screen.getByText(/No votes match “zzzznotathing”/)).toBeInTheDocument();
    });

    it('writes the query to the URL after the debounce interval', async () => {
      vi.useFakeTimers();
      try {
        renderView();
        fireEvent.change(screen.getByLabelText('Search votes'), {
          target: { value: 'fee' },
        });
        expect(replaceMock).not.toHaveBeenCalled();

        await act(async () => {
          vi.advanceTimersByTime(300);
        });

        expect(replaceMock).toHaveBeenCalledTimes(1);
        expect(replaceMock.mock.calls[0][0] as string).toContain('q=fee');
      } finally {
        vi.useRealTimers();
      }
    });

    it('drops the q param when the search is cleared', async () => {
      vi.useFakeTimers();
      try {
        searchParamsValue = new URLSearchParams('q=fee');
        renderView();
        fireEvent.click(screen.getByLabelText('Clear search'));

        await act(async () => {
          vi.advanceTimersByTime(300);
        });

        expect(replaceMock).toHaveBeenCalled();
        expect(replaceMock.mock.calls[0][0] as string).not.toContain('q=');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('ask deep link', () => {
    it('opens the Q&A dialog for the ?ask= proposal', () => {
      searchParamsValue = new URLSearchParams('ask=m-active');
      renderView({ isQnaAvailable: true });
      expect(screen.getByRole('dialog')).toHaveAccessibleName(
        'Ask about Proposal m-active'
      );
    });

    it('opens even when the active filters would hide that card', () => {
      // status=closed hides m-active from the list, but the deep link still works.
      searchParamsValue = new URLSearchParams('ask=m-active&status=closed');
      renderView({ isQnaAvailable: true });
      // The card is filtered out — match the card's title link, since the
      // dialog header also renders the same text.
      expect(
        screen.queryByRole('link', { name: 'Proposal m-active' })
      ).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAccessibleName(
        'Ask about Proposal m-active'
      );
    });

    it('ignores an unknown ?ask= id', () => {
      searchParamsValue = new URLSearchParams('ask=does-not-exist');
      renderView({ isQnaAvailable: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not open the dialog when Q&A is unavailable', () => {
      searchParamsValue = new URLSearchParams('ask=m-active');
      renderView({ isQnaAvailable: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('drops only the ask param when the dialog is closed', () => {
      searchParamsValue = new URLSearchParams('ask=m-active&status=closed');
      renderView({ isQnaAvailable: true });
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      const target = replaceMock.mock.calls[0][0] as string;
      expect(target).not.toContain('ask=');
      expect(target).toContain('status=closed');
    });
  });
});
