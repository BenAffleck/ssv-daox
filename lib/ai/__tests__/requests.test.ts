import { track } from '@vercel/analytics';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { askProposalQuestion, requestProposalSummary } from '../requests';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

function respond(status: number, body: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

const SUMMARY = { tldr: 'Fund the grant', keyPoints: [], impact: 'Small' };
const ANSWER = { answer: 'Yes', answered: true, supportingQuotes: [] };

describe('requestProposalSummary', () => {
  beforeEach(() => vi.mocked(track).mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('returns the summary and records the request', async () => {
    respond(200, { summary: SUMMARY, fromCache: false });

    await expect(requestProposalSummary('0xabc')).resolves.toEqual({ ok: true, summary: SUMMARY });
    expect(track).toHaveBeenCalledWith('ai_summary_requested', {});
  });

  it('returns the server message and records a rate limit', async () => {
    respond(429, { error: 'Too many requests', code: 'rate_limited', fromCache: false });

    await expect(requestProposalSummary('0xabc')).resolves.toEqual({
      ok: false,
      error: 'Too many requests',
    });
    expect(track).toHaveBeenCalledWith('ai_rate_limited', { feature: 'summary' });
  });

  it('says the request failed when the network does', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(requestProposalSummary('0xabc')).resolves.toEqual({
      ok: false,
      error: 'Failed to fetch summary',
    });
  });
});

describe('askProposalQuestion', () => {
  beforeEach(() => vi.mocked(track).mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('returns the answer and records the question without its text', async () => {
    respond(200, { answer: ANSWER, fromCache: false });

    await expect(askProposalQuestion('0xabc', 'Who gets paid?')).resolves.toEqual({
      ok: true,
      answer: ANSWER,
    });
    expect(track).toHaveBeenCalledWith('ai_qna_asked', {});
  });

  it('records a rate limit', async () => {
    respond(429, { error: 'Slow down', code: 'rate_limited', fromCache: false });

    await expect(askProposalQuestion('0xabc', 'Why?')).resolves.toEqual({
      ok: false,
      error: 'Slow down',
    });
    expect(track).toHaveBeenCalledWith('ai_rate_limited', { feature: 'qna' });
  });
});
