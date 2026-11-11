/**
 * The AI features over Snapshot proposals: summary, Q&A and timeline event
 * extraction.
 *
 * Callers send a proposal id, never proposal text. The text the model reads
 * comes from the feature's own proposal source, so the module can't be used as
 * a general LLM proxy, and a cached result always matches the real proposal.
 */

import { createHash } from 'crypto';
import { z } from 'zod';

import { AI_EXTRACTION_CONFIG, getExtractionPrompt } from '@/lib/ai-extraction/config';
import { filterTimelineWorthy } from '@/lib/ai-extraction/relevance';
import { serializeAIExtractedEvents } from '@/lib/ai-extraction/transform';
import { AIExtractedEventSchema } from '@/lib/ai-extraction/types';
import { AI_QNA_CONFIG, getQnaPrompt } from '@/lib/ai-qna/config';
import { ProposalAnswerSchema, type ProposalAnswer } from '@/lib/ai-qna/types';
import { AI_SUMMARY_CONFIG, getSummaryPrompt } from '@/lib/ai-summary/config';
import { ProposalSummarySchema, type ProposalSummary } from '@/lib/ai-summary/types';
import type { SerializedEvent } from '@/lib/dao-timeline/types';
import { createJsonFile } from '@/lib/json-file';

import { extractJSONFromResponse, truncateBody } from './client';
import { LlmError, type Llm } from './llm';
import { createRateLimiter, type Limits } from './rate-limit';

export { LlmError, type Llm } from './llm';
export type { Limit, Limits } from './rate-limit';

export interface SourceProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  /** Unix seconds. */
  end: number;
  link: string;
}

export interface ProposalSource {
  /** `null` when the source does not hold `id`; rejects when the source is unreachable. */
  find(id: string): Promise<SourceProposal | null>;
}

export type AiFeature = 'summary' | 'qna' | 'extraction';

export interface AiFeaturesDeps {
  /** AI is switched on and an API key is set. */
  enabled: boolean;
  llm: Llm;
  /** DAO votes and Committee votes: summary and Q&A. */
  governance: ProposalSource;
  /** The timeline space: extraction. */
  timeline: ProposalSource;
  /** One process MUST own this file. */
  cacheFilePath: string;
  limits: Record<AiFeature, Limits>;
  now?: () => number;
}

export type AiErrorCode =
  | 'unavailable'
  | 'invalid_request'
  | 'not_found'
  | 'source_unavailable'
  | 'rate_limited'
  | 'ai_critical'
  | 'ai_failed'
  | 'invalid_model_output';

export interface AiError {
  code: AiErrorCode;
  message: string;
  httpStatus: number;
  retryAfterSeconds?: number;
}

export type AiResult<T> =
  { ok: true; value: T; fromCache: boolean } | { ok: false; error: AiError };

export interface AiRequest {
  clientKey: string;
  /** The parsed JSON body, not yet validated. */
  body: unknown;
}

export interface ExtractedEvents {
  events: SerializedEvent[];
  /** Recurring events dropped as internal to a role or team. */
  eventsFiltered: number;
}

export interface AiFeatures {
  available: boolean;
  summarize(request: AiRequest): Promise<AiResult<ProposalSummary>>;
  answer(request: AiRequest): Promise<AiResult<ProposalAnswer>>;
  extractEvents(request: AiRequest): Promise<AiResult<ExtractedEvents>>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const HTTP_STATUS: Record<AiErrorCode, number> = {
  unavailable: 503,
  invalid_request: 400,
  not_found: 404,
  source_unavailable: 502,
  rate_limited: 429,
  ai_critical: 502,
  ai_failed: 502,
  invalid_model_output: 502,
};

interface Task<Input extends { proposalId: string }, Stored, Output> {
  source: 'governance' | 'timeline';
  /** Bump to drop this feature's cached results, e.g. after a prompt change. */
  version: number;
  input: z.ZodType<Input, unknown>;
  /** Tells apart cached results for the same proposal, e.g. per question. */
  variant?: (input: Input) => string;
  prompt: (proposal: SourceProposal, input: Input) => string;
  maxTokens: number;
  output: z.ZodType<Stored, unknown>;
  ttlMs: number;
  /** Runs on every read, so a policy change applies to cached results too. */
  present: (stored: Stored, proposal: SourceProposal) => Output;
  messages: { unavailable: string; invalidRequest: string; rateLimited: string };
}

const proposalIdInput = z.object({ proposalId: z.string().trim().min(1) });

/** Trivial rewordings (case, spacing) share one cached answer. */
function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

const summaryTask: Task<{ proposalId: string }, ProposalSummary, ProposalSummary> = {
  source: 'governance',
  version: 1,
  input: proposalIdInput,
  prompt: (p) =>
    getSummaryPrompt(p.title, truncateBody(p.body, AI_SUMMARY_CONFIG.maxBodyLength), p.choices),
  maxTokens: 1000,
  output: ProposalSummarySchema,
  ttlMs: AI_SUMMARY_CONFIG.maxCacheAgeDays * DAY_MS,
  present: (summary) => summary,
  messages: {
    unavailable: 'AI summary is not available. Check configuration.',
    invalidRequest: 'Invalid request body. Expected { proposalId }',
    rateLimited: 'Too many summaries requested. Please wait a moment and try again.',
  },
};

const qnaTask: Task<{ proposalId: string; question: string }, ProposalAnswer, ProposalAnswer> = {
  source: 'governance',
  version: 1,
  input: proposalIdInput.extend({
    question: z.string().trim().min(1).max(AI_QNA_CONFIG.maxQuestionLength),
  }),
  variant: ({ question }) => hash(normalizeQuestion(question)),
  prompt: (p, { question }) =>
    getQnaPrompt(p.title, truncateBody(p.body, AI_QNA_CONFIG.maxBodyLength), p.choices, question),
  maxTokens: AI_QNA_CONFIG.maxAnswerTokens,
  output: ProposalAnswerSchema,
  ttlMs: AI_QNA_CONFIG.maxCacheAgeDays * DAY_MS,
  present: (answer) => answer,
  messages: {
    unavailable: 'Proposal Q&A is not available. Check configuration.',
    invalidRequest: `Invalid request body. Expected { proposalId, question } with a question of 1-${AI_QNA_CONFIG.maxQuestionLength} characters.`,
    rateLimited: 'Too many questions. Please wait a moment and try again.',
  },
};

const extractionOutput = z.object({ events: z.array(AIExtractedEventSchema) });

const extractionTask: Task<
  { proposalId: string },
  z.infer<typeof extractionOutput>,
  ExtractedEvents
> = {
  source: 'timeline',
  version: 1,
  input: proposalIdInput,
  prompt: (p) =>
    getExtractionPrompt(
      p.id,
      p.title,
      new Date(p.end * 1000).toISOString().split('T')[0],
      truncateBody(p.body, AI_EXTRACTION_CONFIG.maxProposalBodyLength),
    ),
  maxTokens: 2000,
  output: extractionOutput,
  ttlMs: AI_EXTRACTION_CONFIG.maxCacheAgeDays * DAY_MS,
  present: ({ events }, p) => {
    const { kept, filtered } = filterTimelineWorthy(events);
    return {
      // Indexed after filtering, so ids stay contiguous per proposal.
      events: serializeAIExtractedEvents(
        kept.map((event, index) => ({
          ...event,
          id: `ai-${p.id}-${index}`,
          sourceProposalId: p.id,
          sourceProposalTitle: p.title,
          sourceProposalUrl: p.link,
        })),
      ),
      eventsFiltered: filtered,
    };
  },
  messages: {
    unavailable: 'AI extraction is not available. Check configuration.',
    invalidRequest: 'Invalid request body. Expected { proposalId }',
    rateLimited: 'Too many extractions requested. Please wait a while and try again.',
  },
};

interface CacheFile {
  entries: Record<string, { expiresAt: number; value: unknown }>;
}

function failure(code: AiErrorCode, message: string, retryAfterSeconds?: number) {
  const error: AiError = { code, message, httpStatus: HTTP_STATUS[code] };
  if (retryAfterSeconds !== undefined) {
    error.retryAfterSeconds = retryAfterSeconds;
  }
  return { ok: false as const, error };
}

export function createAiFeatures(deps: AiFeaturesDeps): AiFeatures {
  const now = deps.now ?? Date.now;
  const limiter = createRateLimiter(now);
  const cache = createJsonFile<CacheFile>(deps.cacheFilePath, () => ({ entries: {} }));

  async function readCache<T>(key: string, schema: z.ZodType<T, unknown>): Promise<T | null> {
    const entry = (await cache.read()).entries?.[key];
    if (!entry || entry.expiresAt <= now()) {
      return null;
    }
    const parsed = schema.safeParse(entry.value);
    return parsed.success ? parsed.data : null;
  }

  async function writeCache(key: string, value: unknown, ttlMs: number): Promise<void> {
    try {
      await cache.update((data) => {
        data.entries ??= {};
        const at = now();
        for (const [existing, entry] of Object.entries(data.entries)) {
          if (entry.expiresAt <= at) {
            delete data.entries[existing];
          }
        }
        data.entries[key] = { expiresAt: at + ttlMs, value };
      });
    } catch (error) {
      // The cache saves cost; the result is still good.
      console.error('Failed to write the AI cache:', error);
    }
  }

  async function run<Input extends { proposalId: string }, Stored, Output>(
    feature: AiFeature,
    task: Task<Input, Stored, Output>,
    request: AiRequest,
  ): Promise<AiResult<Output>> {
    if (!deps.enabled) {
      return failure('unavailable', task.messages.unavailable);
    }
    const parsed = task.input.safeParse(request.body);
    if (!parsed.success) {
      return failure('invalid_request', task.messages.invalidRequest);
    }
    const input = parsed.data;

    let proposal: SourceProposal | null;
    try {
      proposal = await deps[task.source].find(input.proposalId);
    } catch (error) {
      console.error(`Proposal lookup for ${feature} failed:`, error);
      return failure('source_unavailable', 'Snapshot is unavailable. Please try again later.');
    }
    if (!proposal) {
      return failure('not_found', 'Proposal not found');
    }

    // The text hash ties a result to the text it was made from.
    const text = hash(
      JSON.stringify([proposal.title, proposal.body, proposal.choices, proposal.end]),
    );
    const key = [`${feature}@${task.version}`, proposal.id, text, task.variant?.(input)]
      .filter(Boolean)
      .join(':');

    const cached = await readCache(key, task.output);
    if (cached !== null) {
      return { ok: true, value: task.present(cached, proposal), fromCache: true };
    }

    const decision = limiter.take(feature, request.clientKey, deps.limits[feature]);
    if (!decision.allowed) {
      return failure('rate_limited', task.messages.rateLimited, decision.retryAfterSeconds);
    }

    let reply: string;
    try {
      reply = await deps.llm.complete({
        prompt: task.prompt(proposal, input),
        maxTokens: task.maxTokens,
      });
    } catch (error) {
      console.error(`AI ${feature} for proposal ${proposal.id} failed:`, error);
      if (error instanceof LlmError) {
        return failure(error.kind === 'critical' ? 'ai_critical' : 'ai_failed', error.message);
      }
      return failure('ai_failed', 'The AI request failed. Please try again later.');
    }

    let stored: Stored;
    try {
      const validated = task.output.safeParse(extractJSONFromResponse(reply));
      if (!validated.success) {
        throw validated.error;
      }
      stored = validated.data;
    } catch (error) {
      console.warn(`AI ${feature} for proposal ${proposal.id} returned invalid output:`, error);
      return failure('invalid_model_output', 'Invalid response format');
    }

    await writeCache(key, stored, task.ttlMs);
    return { ok: true, value: task.present(stored, proposal), fromCache: false };
  }

  return {
    available: deps.enabled,
    summarize: (request) => run('summary', summaryTask, request),
    answer: (request) => run('qna', qnaTask, request),
    extractEvents: (request) => run('extraction', extractionTask, request),
  };
}
