import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SnapshotActiveProposal } from '@/lib/snapshot/types';

import ClosedVoteCard from '../ClosedVoteCard';

const closed: SnapshotActiveProposal = {
  id: 'p1',
  title: 'Fund the thing',
  body: '',
  start: 1700000000,
  end: 1700100000,
  state: 'closed',
  choices: ['For', 'Against'],
  scores: [900, 100],
  scores_total: 1000,
  votes: 12,
  quorum: 5000,
  type: 'single-choice',
  link: 'https://snapshot.org/#/x/proposal/p1',
};

describe('ClosedVoteCard quorum', () => {
  it('says the vote did not pass when For wins but quorum was missed', () => {
    render(<ClosedVoteCard proposal={closed} />);
    expect(screen.getByText('Quorum not met')).toBeInTheDocument();
    expect(screen.getByText('Quorum not reached')).toBeInTheDocument();
    expect(screen.queryByText('Passed')).not.toBeInTheDocument();
  });

  it('shows Passed and a reached quorum when the threshold is met', () => {
    render(<ClosedVoteCard proposal={{ ...closed, quorum: 500 }} />);
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Quorum reached')).toBeInTheDocument();
  });

  it('applies the proposal quorum regardless of the space vote type', () => {
    const space = { key: 'ops', label: 'Operators', spaceId: 'x', voteType: 'member' as const };
    render(<ClosedVoteCard proposal={closed} space={space} />);
    expect(screen.getByText('Quorum not met')).toBeInTheDocument();
  });

  it('states that no quorum applies when none is configured', () => {
    render(<ClosedVoteCard proposal={{ ...closed, quorum: 0 }} />);
    expect(screen.getByText('No quorum')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });
});
