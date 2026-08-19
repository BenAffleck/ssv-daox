/**
 * File-based caching for AI proposal answers
 *
 * Mirrors lib/ai-summary/cache.ts, but keyed by proposal + question so repeat
 * askers of a common question share one API call. Like the summary cache this
 * is filesystem-backed and therefore ephemeral on serverless hosts — it is a
 * cost optimisation, never a source of truth.
 */

import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import type { ProposalAnswer, CachedAnswer, AnswerCache } from './types';
import { AI_QNA_CONFIG } from './config';

/**
 * Normalize a question so trivial rewordings (casing, padding, doubled spaces)
 * hit the same cache entry.
 */
export function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Build the cache key for a proposal + question pair.
 */
export function buildCacheKey(proposalId: string, question: string): string {
  const hash = createHash('sha256')
    .update(normalizeQuestion(question))
    .digest('hex')
    .slice(0, 16);
  return `${proposalId}:${hash}`;
}

/**
 * Get the full path to the cache file
 */
function getCacheFilePath(): string {
  return path.join(process.cwd(), AI_QNA_CONFIG.cacheFilePath);
}

/**
 * Ensure the cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const cacheDir = path.dirname(getCacheFilePath());
  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

/**
 * Load the answer cache from file
 */
async function loadCache(): Promise<AnswerCache> {
  const emptyCache: AnswerCache = {
    version: AI_QNA_CONFIG.cacheVersion,
    answers: {},
  };

  try {
    const content = await fs.readFile(getCacheFilePath(), 'utf-8');
    const cache = JSON.parse(content) as AnswerCache;

    if (cache.version !== AI_QNA_CONFIG.cacheVersion) {
      return emptyCache;
    }

    return cache;
  } catch {
    return emptyCache;
  }
}

/**
 * Save the answer cache to file
 */
async function saveCache(cache: AnswerCache): Promise<void> {
  try {
    await ensureCacheDir();
    await fs.writeFile(getCacheFilePath(), JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save Q&A cache:', error);
  }
}

/**
 * Check if a cached answer is still valid
 */
function isCacheEntryValid(entry: CachedAnswer): boolean {
  const cachedAt = new Date(entry.cachedAt);
  const maxAge = AI_QNA_CONFIG.maxCacheAgeDays * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt.getTime() < maxAge;
}

/**
 * Get a cached answer for a proposal + question if available and valid
 */
export async function getCachedAnswer(
  proposalId: string,
  question: string
): Promise<ProposalAnswer | null> {
  const cache = await loadCache();
  const entry = cache.answers[buildCacheKey(proposalId, question)];

  if (entry && isCacheEntryValid(entry)) {
    return entry.answer;
  }

  return null;
}

/**
 * Store an answer in cache
 */
export async function cacheAnswer(
  proposalId: string,
  question: string,
  answer: ProposalAnswer
): Promise<void> {
  const cache = await loadCache();

  cache.answers[buildCacheKey(proposalId, question)] = {
    proposalId,
    question: normalizeQuestion(question),
    cachedAt: new Date().toISOString(),
    answer,
  };

  await saveCache(cache);
}
