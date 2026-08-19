/**
 * Unit tests for vote search
 */

import { describe, it, expect } from 'vitest';
import {
  buildSnippet,
  buildVoteSearchIndex,
  filterProposalsByQuery,
  getVoteAskUrl,
  getStateLabel,
  toVoteIndexEntry,
} from '../vote-search';
import type { GovernanceProposal, GovernanceSpace } from '@/lib/snapshot/types';

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

function proposal(
  id: string,
  title: string,
  body: string,
  space: GovernanceSpace = DAO,
  state: string = 'active'
): GovernanceProposal {
  return {
    id,
    title,
    body,
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
  proposal('p1', 'Adjust the fee recipient address', 'Moves protocol fees to a new multisig.'),
  proposal('p2', 'Fund the grants programme', 'Allocates 500k SSV to grantees.', OPERATORS),
  proposal('p3', 'Onboard new verified operators', 'Adds three operators.', OPERATORS, 'closed'),
];

describe('buildSnippet', () => {
  it('strips markdown formatting into a single line', () => {
    const snippet = buildSnippet('# Heading\n\n- A **bold** point\n- Another `code` point');
    expect(snippet).toBe('Heading A bold point Another code point');
  });

  it('keeps link text and drops the target', () => {
    expect(buildSnippet('See [the forum post](https://forum.example/x) for detail')).toBe(
      'See the forum post for detail'
    );
  });

  it('removes fenced code blocks and images', () => {
    expect(buildSnippet('Before ```const x = 1;``` ![alt](img.png) after')).toBe(
      'Before after'
    );
  });

  it('truncates to the requested length with an ellipsis', () => {
    const snippet = buildSnippet('word '.repeat(100), 20);
    expect(snippet.length).toBeLessThanOrEqual(21);
    expect(snippet.endsWith('…')).toBe(true);
  });
});

describe('getStateLabel', () => {
  it('maps snapshot states to display labels', () => {
    expect(getStateLabel('active')).toBe('Active');
    expect(getStateLabel('pending')).toBe('Upcoming');
    expect(getStateLabel('closed')).toBe('Past');
  });

  it('passes an unknown state through unchanged', () => {
    expect(getStateLabel('weird')).toBe('weird');
  });
});

describe('toVoteIndexEntry', () => {
  it('projects a proposal onto the wire shape without the full body', () => {
    const entry = toVoteIndexEntry(PROPOSALS[0]);
    expect(entry).toMatchObject({
      id: 'p1',
      title: 'Adjust the fee recipient address',
      snippet: 'Moves protocol fees to a new multisig.',
      spaceKey: 'main',
      spaceLabel: 'DAO',
      state: 'active',
    });
    expect(entry).not.toHaveProperty('body');
  });
});

describe('buildVoteSearchIndex', () => {
  it('produces vote-kind search items linking to the ask deep link', () => {
    const [item] = buildVoteSearchIndex([toVoteIndexEntry(PROPOSALS[0])]);
    expect(item.kind).toBe('vote');
    expect(item.id).toBe('vote:p1');
    expect(item.name).toBe('Adjust the fee recipient address');
    expect(item.url).toBe('/governance?ask=p1');
    expect(item.external).toBe(false);
    expect(item.categories).toEqual(['Active', 'DAO']);
  });
});

describe('getVoteAskUrl', () => {
  it('encodes ids that contain URL-significant characters', () => {
    expect(getVoteAskUrl('0xab/cd?e')).toBe('/governance?ask=0xab%2Fcd%3Fe');
  });
});

describe('filterProposalsByQuery', () => {
  it('returns every proposal for an empty query', () => {
    expect(filterProposalsByQuery(PROPOSALS, '')).toEqual(PROPOSALS);
    expect(filterProposalsByQuery(PROPOSALS, '   ')).toEqual(PROPOSALS);
  });

  it('matches on the title', () => {
    const result = filterProposalsByQuery(PROPOSALS, 'fee recipient');
    expect(result.map((p) => p.id)).toEqual(['p1']);
  });

  it('matches on the body', () => {
    const result = filterProposalsByQuery(PROPOSALS, 'grantees');
    expect(result.map((p) => p.id)).toEqual(['p2']);
  });

  it('matches on the space label', () => {
    const result = filterProposalsByQuery(PROPOSALS, 'Operators');
    expect(result.map((p) => p.id).sort()).toEqual(['p2', 'p3']);
  });

  it('is case-insensitive', () => {
    expect(filterProposalsByQuery(PROPOSALS, 'FEE RECIPIENT').map((p) => p.id)).toEqual([
      'p1',
    ]);
  });

  it('preserves the input order so section grouping is unaffected', () => {
    const result = filterProposalsByQuery(PROPOSALS, 'the');
    const ids = result.map((p) => p.id);
    expect(ids).toEqual([...ids].sort()); // input was p1, p2, p3
  });

  it('returns nothing when no proposal matches', () => {
    expect(filterProposalsByQuery(PROPOSALS, 'zzzznotathing')).toEqual([]);
  });
});
