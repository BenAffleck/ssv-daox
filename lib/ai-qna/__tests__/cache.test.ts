/**
 * Unit tests for the AI Q&A cache
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCacheKey, cacheAnswer, getCachedAnswer, normalizeQuestion } from '../cache';
import { AI_QNA_CONFIG } from '../config';
import type { AnswerCache, ProposalAnswer } from '../types';

// vi.mock factories are hoisted above module scope, so the fns must be too.
const { readFile, writeFile, mkdir } = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Node builtins must be mocked by spreading the original module.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: { ...actual, promises: { readFile, writeFile, mkdir } },
    promises: { readFile, writeFile, mkdir },
  };
});

const ANSWER: ProposalAnswer = {
  answer: 'The multisig executes it.',
  answered: true,
  supportingQuotes: [],
};

/** Serialize a cache file whose single entry was written `daysAgo` days ago. */
function cacheFileWith(
  proposalId: string,
  question: string,
  daysAgo: number,
  version = AI_QNA_CONFIG.cacheVersion,
): string {
  const cachedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const cache: AnswerCache = {
    version,
    answers: {
      [buildCacheKey(proposalId, question)]: {
        proposalId,
        question: normalizeQuestion(question),
        cachedAt,
        answer: ANSWER,
      },
    },
  };
  return JSON.stringify(cache);
}

describe('normalizeQuestion', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeQuestion('  Who   EXECUTES\n this? ')).toBe('who executes this?');
  });
});

describe('buildCacheKey', () => {
  it('gives trivially reworded questions the same key', () => {
    expect(buildCacheKey('p1', 'Who executes this?')).toBe(
      buildCacheKey('p1', '  who   EXECUTES this?  '),
    );
  });

  it('separates different questions on the same proposal', () => {
    expect(buildCacheKey('p1', 'Who executes this?')).not.toBe(
      buildCacheKey('p1', 'When does it start?'),
    );
  });

  it('separates the same question across different proposals', () => {
    expect(buildCacheKey('p1', 'Who executes this?')).not.toBe(
      buildCacheKey('p2', 'Who executes this?'),
    );
  });
});

describe('getCachedAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a fresh cached answer', async () => {
    readFile.mockResolvedValue(cacheFileWith('p1', 'Who executes this?', 1));

    await expect(getCachedAnswer('p1', 'Who executes this?')).resolves.toEqual(ANSWER);
  });

  it('matches a cached answer through question normalization', async () => {
    readFile.mockResolvedValue(cacheFileWith('p1', 'Who executes this?', 1));

    await expect(getCachedAnswer('p1', '  WHO   executes this? ')).resolves.toEqual(ANSWER);
  });

  it('ignores an entry past the TTL', async () => {
    readFile.mockResolvedValue(
      cacheFileWith('p1', 'Who executes this?', AI_QNA_CONFIG.maxCacheAgeDays + 1),
    );

    await expect(getCachedAnswer('p1', 'Who executes this?')).resolves.toBeNull();
  });

  it('discards the whole cache on a version mismatch', async () => {
    readFile.mockResolvedValue(
      cacheFileWith('p1', 'Who executes this?', 1, AI_QNA_CONFIG.cacheVersion + 1),
    );

    await expect(getCachedAnswer('p1', 'Who executes this?')).resolves.toBeNull();
  });

  it('returns null when no cache file exists', async () => {
    readFile.mockRejectedValue(new Error('ENOENT'));

    await expect(getCachedAnswer('p1', 'Who executes this?')).resolves.toBeNull();
  });

  it('returns null for a question that was never asked', async () => {
    readFile.mockResolvedValue(cacheFileWith('p1', 'Who executes this?', 1));

    await expect(getCachedAnswer('p1', 'Something else entirely?')).resolves.toBeNull();
  });
});

describe('cacheAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the answer under its proposal + question key', async () => {
    readFile.mockRejectedValue(new Error('ENOENT'));

    await cacheAnswer('p1', '  Who EXECUTES this? ', ANSWER);

    expect(writeFile).toHaveBeenCalledTimes(1);
    const written = JSON.parse(writeFile.mock.calls[0][1] as string) as AnswerCache;
    const entry = written.answers[buildCacheKey('p1', 'Who executes this?')];
    expect(entry.answer).toEqual(ANSWER);
    // The normalized form is stored so the file stays inspectable.
    expect(entry.question).toBe('who executes this?');
    expect(written.version).toBe(AI_QNA_CONFIG.cacheVersion);
  });

  it('preserves existing entries when adding a new one', async () => {
    readFile.mockResolvedValue(cacheFileWith('p1', 'First question?', 0));

    await cacheAnswer('p1', 'Second question?', ANSWER);

    const written = JSON.parse(writeFile.mock.calls[0][1] as string) as AnswerCache;
    expect(Object.keys(written.answers)).toHaveLength(2);
  });

  it('does not throw when the cache file cannot be written', async () => {
    readFile.mockRejectedValue(new Error('ENOENT'));
    writeFile.mockRejectedValue(new Error('EROFS: read-only file system'));

    await expect(cacheAnswer('p1', 'Who executes this?', ANSWER)).resolves.toBeUndefined();
  });
});
