import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AskProposalDialog from '../AskProposalDialog';

const PROPOSAL = {
  id: 'p1',
  title: 'Adjust the fee recipient address',
  link: 'https://snapshot.org/#/x/proposal/p1',
};

const ANSWER = {
  answer: 'The multisig executes the transfer within 14 days.',
  answered: true,
  supportingQuotes: ['executes the transfer within 14 days'],
};

/** Stub /api/proposal-qna with one JSON payload. */
function mockFetchOnce(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderDialog(onClose = vi.fn()) {
  return {
    onClose,
    ...render(<AskProposalDialog proposal={PROPOSAL} open onClose={onClose} />),
  };
}

describe('AskProposalDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when closed', () => {
    render(<AskProposalDialog proposal={PROPOSAL} open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the proposal title and a prompt before anything is asked', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(PROPOSAL.title)).toBeInTheDocument();
    expect(screen.getByText(/Ask a single question/i)).toBeInTheDocument();
  });

  it('submits the question on Enter and renders the answer with its quotes', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchOnce({ answer: ANSWER, fromCache: false });
    renderDialog();

    await user.type(screen.getByLabelText('Your question'), 'Who executes this?{Enter}');

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
    expect(screen.getByText('From the proposal')).toBeInTheDocument();
    expect(screen.getByText(ANSWER.supportingQuotes[0])).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proposal-qna',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({ proposalId: 'p1', question: 'Who executes this?' });
  });

  it('submits via the Ask button', async () => {
    const user = userEvent.setup();
    mockFetchOnce({ answer: ANSWER, fromCache: false });
    renderDialog();

    await user.type(screen.getByLabelText('Your question'), 'Who executes this?');
    await user.click(screen.getByRole('button', { name: /^Ask$/ }));

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
  });

  it('does not submit an empty question', async () => {
    const fetchMock = mockFetchOnce({ answer: ANSWER, fromCache: false });
    renderDialog();

    const askButton = screen.getByRole('button', { name: /^Ask$/ });
    expect(askButton).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the not-covered notice when the model declines to answer', async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      answer: {
        answer: 'The proposal does not mention live results.',
        answered: false,
        supportingQuotes: [],
      },
      fromCache: false,
    });
    renderDialog();

    await user.type(screen.getByLabelText('Your question'), 'Is it passing?{Enter}');

    expect(await screen.findByText(/isn’t covered by the proposal text/i)).toBeInTheDocument();
  });

  it('surfaces the API error message', async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      answer: null,
      fromCache: false,
      error: 'Too many questions. Please wait a moment and try again.',
    });
    renderDialog();

    await user.type(screen.getByLabelText('Your question'), 'Who executes this?{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many questions');
  });

  it('handles a network failure', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderDialog();

    await user.type(screen.getByLabelText('Your question'), 'Who executes this?{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Failed to reach/i);
  });

  it('replaces the previous answer when a second question is asked', async () => {
    const user = userEvent.setup();
    const second = {
      answer: 'It starts once the vote closes.',
      answered: true,
      supportingQuotes: [],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ answer: ANSWER }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ answer: second }) });
    vi.stubGlobal('fetch', fetchMock);
    renderDialog();

    const input = screen.getByLabelText('Your question');
    await user.type(input, 'Who executes this?{Enter}');
    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'When does it start?{Enter}');

    expect(await screen.findByText(second.answer)).toBeInTheDocument();
    // The first answer is gone rather than accumulating into a thread.
    await waitFor(() => expect(screen.queryByText(ANSWER.answer)).not.toBeInTheDocument());
  });

  it('closes on Escape and on a scrim click', async () => {
    const { onClose } = renderDialog();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('ask-dialog-scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not close when the panel itself is clicked', () => {
    const { onClose } = renderDialog();

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('caps the question at the configured length', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText('Your question') as HTMLTextAreaElement;
    await user.type(input, 'x'.repeat(60));
    // Well under the cap, so nothing is trimmed yet.
    expect(input.value).toHaveLength(60);

    fireEvent.change(input, { target: { value: 'y'.repeat(900) } });
    expect(input.value).toHaveLength(500);
  });

  it('links out to the proposal', () => {
    renderDialog();
    const link = screen.getByRole('link', { name: /View Proposal/i });
    expect(link).toHaveAttribute('href', PROPOSAL.link);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
