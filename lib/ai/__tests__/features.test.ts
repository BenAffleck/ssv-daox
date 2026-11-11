import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createAiFeatures,
  LlmError,
  type AiFeature,
  type AiFeaturesDeps,
  type Limits,
  type Llm,
  type ProposalSource,
  type SourceProposal,
} from '../features';

const SUMMARY = {
  tldr: 'Moves 10k SSV to the grants multisig.',
  choiceExplanations: [{ choice: 'For', explanation: 'Approve the transfer.' }],
};
const ANSWER = { answer: 'The multisig executes it.', answered: true, supportingQuotes: [] };

function proposalOf(overrides: Partial<SourceProposal> = {}): SourceProposal {
  return {
    id: '0xabc',
    title: 'Fund the grants program',
    body: 'Transfer 10k SSV to the grants multisig.',
    choices: ['For', 'Against', 'Abstain'],
    end: 1_767_225_600,
    link: 'https://snapshot.box/#/s:ssv.dao.eth/proposal/0xabc',
    ...overrides,
  };
}

function sourceOf(
  ...proposals: SourceProposal[]
): ProposalSource & { proposals: SourceProposal[] } {
  return {
    proposals,
    async find(id) {
      return this.proposals.find((p) => p.id === id) ?? null;
    },
  };
}

/** Records every prompt; answers with `reply` until it is changed. */
function scriptedLlm(reply: string | Error): Llm & { prompts: string[]; reply: string | Error } {
  return {
    prompts: [],
    reply,
    async complete({ prompt }) {
      this.prompts.push(prompt);
      if (this.reply instanceof Error) throw this.reply;
      return this.reply;
    },
  };
}

const GENEROUS: Limits = {
  perClient: { windowMs: 60_000, max: 100 },
  global: { windowMs: 60_000, max: 100 },
};

function limitsOf(overrides: Partial<Record<AiFeature, Limits>> = {}): Record<AiFeature, Limits> {
  return { summary: GENEROUS, qna: GENEROUS, extraction: GENEROUS, ...overrides };
}

let dir: string;
let clock: number;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'ai-features-'));
  clock = Date.parse('2026-11-11T12:00:00Z');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function setup(overrides: Partial<AiFeaturesDeps> = {}) {
  const llm = scriptedLlm(JSON.stringify(SUMMARY));
  const governance = sourceOf(proposalOf());
  const timeline = sourceOf();
  const deps: AiFeaturesDeps = {
    enabled: true,
    llm,
    governance,
    timeline,
    cacheFilePath: path.join(dir, 'ai.json'),
    limits: limitsOf(),
    now: () => clock,
    ...overrides,
  };
  return { ai: createAiFeatures(deps), llm, governance, timeline, deps };
}

const summarize = (ai: ReturnType<typeof setup>['ai'], body: unknown, clientKey = 'client-a') =>
  ai.summarize({ clientKey, body });

describe('summarize', () => {
  it('summarizes the proposal text the source holds, not text the client sends', async () => {
    const { ai, llm } = setup();

    const result = await summarize(ai, {
      proposalId: '0xabc',
      title: 'INJECTED TITLE',
      body: 'INJECTED BODY',
    });

    expect(result).toEqual({ ok: true, value: SUMMARY, fromCache: false });
    expect(llm.prompts[0]).toContain('Transfer 10k SSV to the grants multisig.');
    expect(llm.prompts[0]).not.toContain('INJECTED');
  });

  it('serves a repeat request from the cache without calling the model', async () => {
    const { ai, llm } = setup();

    await summarize(ai, { proposalId: '0xabc' });
    const second = await summarize(ai, { proposalId: '0xabc' }, 'client-b');

    expect(second).toEqual({ ok: true, value: SUMMARY, fromCache: true });
    expect(llm.prompts).toHaveLength(1);
  });

  it('keeps the cache across instances that share the cache file', async () => {
    const first = setup();
    await summarize(first.ai, { proposalId: '0xabc' });

    const second = setup({ cacheFilePath: first.deps.cacheFilePath });
    const result = await summarize(second.ai, { proposalId: '0xabc' });

    expect(result).toMatchObject({ ok: true, fromCache: true });
    expect(second.llm.prompts).toHaveLength(0);
  });

  it('summarizes again once the proposal text changes', async () => {
    const { ai, llm, governance } = setup();
    await summarize(ai, { proposalId: '0xabc' });

    governance.proposals = [proposalOf({ body: 'Transfer 20k SSV instead.' })];
    const result = await summarize(ai, { proposalId: '0xabc' });

    expect(result).toMatchObject({ ok: true, fromCache: false });
    expect(llm.prompts).toHaveLength(2);
  });

  it('summarizes again once the cached summary is a week old', async () => {
    const { ai, llm } = setup();
    await summarize(ai, { proposalId: '0xabc' });

    clock += 7 * 24 * 60 * 60 * 1000;
    await summarize(ai, { proposalId: '0xabc' });

    expect(llm.prompts).toHaveLength(2);
  });

  it('reports an id the source does not know as not found, without calling the model', async () => {
    const { ai, llm } = setup();

    const result = await summarize(ai, { proposalId: '0xunknown' });

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found', httpStatus: 404 } });
    expect(llm.prompts).toHaveLength(0);
  });

  it('reports a failing source as unavailable rather than not found', async () => {
    const { ai } = setup({
      governance: {
        find: async () => {
          throw new Error('Snapshot API error: 503');
        },
      },
    });

    const result = await summarize(ai, { proposalId: '0xabc' });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'source_unavailable', httpStatus: 502 },
    });
  });

  it.each([null, {}, { proposalId: '' }, { proposalId: 42 }])(
    'rejects the request body %j',
    async (body) => {
      const { ai } = setup();

      const result = await summarize(ai, body);

      expect(result).toMatchObject({
        ok: false,
        error: { code: 'invalid_request', httpStatus: 400 },
      });
    },
  );

  it('is unavailable when AI is not configured', async () => {
    const { ai, llm } = setup({ enabled: false });

    const result = await summarize(ai, { proposalId: '0xabc' });

    expect(ai.available).toBe(false);
    expect(result).toMatchObject({ ok: false, error: { code: 'unavailable', httpStatus: 503 } });
    expect(llm.prompts).toHaveLength(0);
  });

  it('reports an auth or billing failure as critical, with its message, and caches nothing', async () => {
    const { ai, llm } = setup();
    llm.reply = new LlmError('critical', 'Anthropic API credit balance is too low.');

    const failed = await summarize(ai, { proposalId: '0xabc' });
    llm.reply = JSON.stringify(SUMMARY);
    const retried = await summarize(ai, { proposalId: '0xabc' });

    expect(failed).toEqual({
      ok: false,
      error: {
        code: 'ai_critical',
        message: 'Anthropic API credit balance is too low.',
        httpStatus: 502,
      },
    });
    expect(retried).toMatchObject({ ok: true, fromCache: false });
  });

  it('reports a transient model failure as failed', async () => {
    const { ai, llm } = setup();
    llm.reply = new LlmError('failed', 'API error: overloaded');

    const result = await summarize(ai, { proposalId: '0xabc' });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'ai_failed', message: 'API error: overloaded', httpStatus: 502 },
    });
  });

  it.each(['no json here', '{"tldr": 42}'])(
    'rejects model output that is not a summary (%s) and caches nothing',
    async (reply) => {
      const { ai, llm } = setup();
      llm.reply = reply;

      const failed = await summarize(ai, { proposalId: '0xabc' });
      llm.reply = JSON.stringify(SUMMARY);
      const retried = await summarize(ai, { proposalId: '0xabc' });

      expect(failed).toMatchObject({
        ok: false,
        error: { code: 'invalid_model_output', httpStatus: 502 },
      });
      expect(retried).toMatchObject({ ok: true, fromCache: false });
    },
  );
});

describe('rate limits', () => {
  it('limits model calls per client and tells the client when to retry', async () => {
    const { ai, governance } = setup({
      limits: limitsOf({
        summary: { perClient: { windowMs: 60_000, max: 1 }, global: GENEROUS.global },
      }),
    });
    governance.proposals = [proposalOf({ id: '0x1' }), proposalOf({ id: '0x2' })];

    await summarize(ai, { proposalId: '0x1' });
    const limited = await summarize(ai, { proposalId: '0x2' });
    const otherClient = await summarize(ai, { proposalId: '0x2' }, 'client-b');

    expect(limited).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: 'rate_limited',
        httpStatus: 429,
        retryAfterSeconds: 60,
      }),
    });
    expect(otherClient).toMatchObject({ ok: true });
  });

  it('lets the client call the model again once the window has passed', async () => {
    const { ai, governance } = setup({
      limits: limitsOf({
        summary: { perClient: { windowMs: 60_000, max: 1 }, global: GENEROUS.global },
      }),
    });
    governance.proposals = [proposalOf({ id: '0x1' }), proposalOf({ id: '0x2' })];

    await summarize(ai, { proposalId: '0x1' });
    clock += 60_000;

    expect(await summarize(ai, { proposalId: '0x2' })).toMatchObject({ ok: true });
  });

  it('does not count cache hits against the limit', async () => {
    const { ai } = setup({
      limits: limitsOf({
        summary: { perClient: { windowMs: 60_000, max: 1 }, global: GENEROUS.global },
      }),
    });

    await summarize(ai, { proposalId: '0xabc' });
    const hits = await Promise.all([1, 2, 3].map(() => summarize(ai, { proposalId: '0xabc' })));

    expect(hits.every((hit) => hit.ok && hit.fromCache)).toBe(true);
  });

  it('caps model calls across all clients', async () => {
    const { ai, governance } = setup({
      limits: limitsOf({
        summary: { perClient: GENEROUS.perClient, global: { windowMs: 86_400_000, max: 2 } },
      }),
    });
    governance.proposals = ['0x1', '0x2', '0x3'].map((id) => proposalOf({ id }));

    await summarize(ai, { proposalId: '0x1' }, 'client-a');
    await summarize(ai, { proposalId: '0x2' }, 'client-b');
    const capped = await summarize(ai, { proposalId: '0x3' }, 'client-c');

    expect(capped).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });

  it('keeps separate limits per feature', async () => {
    const { ai, llm } = setup({
      limits: limitsOf({
        summary: { perClient: { windowMs: 60_000, max: 1 }, global: GENEROUS.global },
      }),
    });

    await summarize(ai, { proposalId: '0xabc' });
    llm.reply = JSON.stringify(ANSWER);
    const answer = await ai.answer({
      clientKey: 'client-a',
      body: { proposalId: '0xabc', question: 'Who executes it?' },
    });

    expect(answer).toMatchObject({ ok: true });
  });
});

describe('answer', () => {
  function setupQna(overrides: Partial<AiFeaturesDeps> = {}) {
    const context = setup(overrides);
    context.llm.reply = JSON.stringify(ANSWER);
    const ask = (question: unknown) =>
      context.ai.answer({ clientKey: 'client-a', body: { proposalId: '0xabc', question } });
    return { ...context, ask };
  }

  it('answers the question against the proposal text', async () => {
    const { ask, llm } = setupQna();

    const result = await ask('Who executes it?');

    expect(result).toEqual({ ok: true, value: ANSWER, fromCache: false });
    expect(llm.prompts[0]).toContain('Who executes it?');
    expect(llm.prompts[0]).toContain('Transfer 10k SSV to the grants multisig.');
  });

  it('shares one cached answer between rewordings that differ only in case and spacing', async () => {
    const { ask, llm } = setupQna();

    await ask('Who executes it?');
    const reworded = await ask('  who   EXECUTES it? ');
    const different = await ask('When does it start?');

    expect(reworded).toMatchObject({ ok: true, fromCache: true });
    expect(different).toMatchObject({ ok: true, fromCache: false });
    expect(llm.prompts).toHaveLength(2);
  });

  it.each([undefined, '', '   ', 'x'.repeat(501)])('rejects the question %j', async (question) => {
    const { ask } = setupQna();

    expect(await ask(question)).toMatchObject({ ok: false, error: { code: 'invalid_request' } });
  });
});

describe('extractEvents', () => {
  const ONE_OFF = {
    title: 'Testnet launch',
    date: '2026-12-01',
    dateConfidence: 'high',
    description: 'The testnet opens.',
    excerpt: 'testnet opens on December 1',
    eventType: 'launch',
    recurrence: null,
  };
  const INTERNAL_STANDUP = {
    ...ONE_OFF,
    title: 'Core team standup',
    description: 'The core team syncs.',
    excerpt: 'the core team holds a weekly standup',
    eventType: 'meeting',
    recurrence: { audience: 'internal', freq: 'WEEKLY', interval: 1 },
  };

  function setupExtraction() {
    const timelineProposal = proposalOf({ id: '0xtimeline', title: 'Launch plan' });
    const context = setup({ timeline: sourceOf(timelineProposal) });
    context.llm.reply = JSON.stringify({ events: [ONE_OFF, INTERNAL_STANDUP] });
    const extract = (proposalId: string) =>
      context.ai.extractEvents({ clientKey: 'client-a', body: { proposalId } });
    return { ...context, extract };
  }

  it('returns the timeline events of a timeline proposal, dropping internal cadences', async () => {
    const { extract } = setupExtraction();

    const result = await extract('0xtimeline');

    expect(result).toMatchObject({ ok: true, fromCache: false });
    if (!result.ok) return;
    expect(result.value.eventsFiltered).toBe(1);
    expect(result.value.events).toEqual([
      expect.objectContaining({
        id: 'ai-0xtimeline-0',
        title: 'Testnet launch',
        startDate: new Date('2026-12-01').toISOString(),
        sourceUrl: proposalOf().link,
        metadata: expect.objectContaining({ sourceProposalTitle: 'Launch plan' }),
      }),
    ]);
  });

  it('serves the same events from the cache', async () => {
    const { extract, llm } = setupExtraction();

    const first = await extract('0xtimeline');
    const second = await extract('0xtimeline');

    expect(second).toEqual({ ...first, fromCache: true });
    expect(llm.prompts).toHaveLength(1);
  });

  it('only extracts from timeline proposals', async () => {
    const { extract, llm } = setupExtraction();

    const result = await extract('0xabc');

    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(llm.prompts).toHaveLength(0);
  });
});
