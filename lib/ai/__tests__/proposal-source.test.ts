import { describe, expect, it, vi } from 'vitest';

import { createSnapshotProposalSource } from '../proposal-source';

const PROPOSAL = {
  id: '0xabc',
  title: 'Fund the grants program',
  body: 'Transfer 10k SSV.',
  choices: ['For', 'Against'],
  end: 1_767_225_600,
  link: 'https://snapshot.box/#/s:ssv.dao.eth/proposal/0xabc',
  flagged: false,
  space: { id: 'ssv.dao.eth' },
};

function fetchReturning(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('createSnapshotProposalSource', () => {
  it('finds a proposal of an allowed space by its id', async () => {
    const fetch = fetchReturning({ data: { proposal: PROPOSAL } });
    const source = createSnapshotProposalSource({ spaceIds: ['ssv.dao.eth'], fetch });

    const found = await source.find('0xabc');

    expect(found).toEqual({
      id: '0xabc',
      title: 'Fund the grants program',
      body: 'Transfer 10k SSV.',
      choices: ['For', 'Against'],
      end: 1_767_225_600,
      link: PROPOSAL.link,
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body).variables).toEqual({ id: '0xabc' });
  });

  it('matches space ids regardless of case', async () => {
    const source = createSnapshotProposalSource({
      spaceIds: ['SSV.dao.eth'],
      fetch: fetchReturning({ data: { proposal: PROPOSAL } }),
    });

    expect(await source.find('0xabc')).not.toBeNull();
  });

  it.each([
    ['another space', { ...PROPOSAL, space: { id: 'other.eth' } }],
    ['a flagged proposal', { ...PROPOSAL, flagged: true }],
    ['an unknown id', null],
  ])('does not find %s', async (_, proposal) => {
    const source = createSnapshotProposalSource({
      spaceIds: ['ssv.dao.eth'],
      fetch: fetchReturning({ data: { proposal } }),
    });

    expect(await source.find('0xabc')).toBeNull();
  });

  it('finds nothing when no space is configured, without asking Snapshot', async () => {
    const fetch = fetchReturning({ data: { proposal: PROPOSAL } });
    const source = createSnapshotProposalSource({ spaceIds: [''], fetch });

    expect(await source.find('0xabc')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects when Snapshot answers with an HTTP error', async () => {
    const source = createSnapshotProposalSource({
      spaceIds: ['ssv.dao.eth'],
      fetch: fetchReturning({}, 503),
    });

    await expect(source.find('0xabc')).rejects.toThrow('503');
  });

  it('rejects when Snapshot answers with a GraphQL error', async () => {
    const source = createSnapshotProposalSource({
      spaceIds: ['ssv.dao.eth'],
      fetch: fetchReturning({ errors: [{ message: 'rate limited' }] }),
    });

    await expect(source.find('0xabc')).rejects.toThrow('rate limited');
  });
});
