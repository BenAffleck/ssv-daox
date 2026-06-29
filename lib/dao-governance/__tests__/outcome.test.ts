import { describe, it, expect } from 'vitest';
import { getProposalOutcome } from '../outcome';

type P = Parameters<typeof getProposalOutcome>[0];

const base: P = { choices: ['For', 'Against'], scores: [10, 5], scores_total: 15, quorum: 0 };

describe('getProposalOutcome', () => {
  it('marks a token vote as Passed when an approval choice wins', () => {
    const out = getProposalOutcome({ ...base, quorum: 10 }, false);
    expect(out).toEqual({ label: 'Passed', variant: 'passed' });
  });

  it('marks a token vote as Failed when a rejection choice wins', () => {
    const out = getProposalOutcome(
      { choices: ['For', 'Against'], scores: [2, 9], scores_total: 11, quorum: 5 },
      false
    );
    expect(out).toEqual({ label: 'Failed', variant: 'failed' });
  });

  it('marks Quorum not met when token total falls short of quorum', () => {
    const out = getProposalOutcome(
      { choices: ['For', 'Against'], scores: [3, 1], scores_total: 4, quorum: 100 },
      false
    );
    expect(out).toEqual({ label: 'Quorum not met', variant: 'quorum-not-met' });
  });

  it('ignores quorum for member (committee) votes', () => {
    // quorum set but member vote → quorum does not apply; approval wins → Passed
    const out = getProposalOutcome({ ...base, quorum: 100 }, true);
    expect(out).toEqual({ label: 'Passed', variant: 'passed' });
  });

  it('surfaces the winning option for non-binary ballots', () => {
    const out = getProposalOutcome(
      { choices: ['Option A', 'Option B', 'Option C'], scores: [1, 9, 2], scores_total: 12, quorum: 0 },
      false
    );
    expect(out).toEqual({ label: 'Option B', variant: 'neutral' });
  });

  it('returns "No votes" when nothing was cast', () => {
    const out = getProposalOutcome(
      { choices: ['For', 'Against'], scores: [0, 0], scores_total: 0, quorum: 0 },
      true
    );
    expect(out).toEqual({ label: 'No votes', variant: 'neutral' });
  });
});
