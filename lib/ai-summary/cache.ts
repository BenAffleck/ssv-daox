/**
 * File-based caching for AI proposal summaries
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ProposalSummary, CachedSummary, SummaryCache } from './types';
import { AI_SUMMARY_CONFIG } from './config';

/**
 * Get the full path to the cache file
 */
function getCacheFilePath(): string {
  return path.join(process.cwd(), AI_SUMMARY_CONFIG.cacheFilePath);
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
 * Load the summary cache from file
 */
async function loadCache(): Promise<SummaryCache> {
  const emptyCache: SummaryCache = {
    version: AI_SUMMARY_CONFIG.cacheVersion,
    summaries: {},
  };

  try {
    const cacheFile = getCacheFilePath();
    const content = await fs.readFile(cacheFile, 'utf-8');
    const cache = JSON.parse(content) as SummaryCache;

    if (cache.version !== AI_SUMMARY_CONFIG.cacheVersion) {
      return emptyCache;
    }

    return cache;
  } catch {
    return emptyCache;
  }
}

/**
 * Save the summary cache to file
 */
async function saveCache(cache: SummaryCache): Promise<void> {
  try {
    await ensureCacheDir();
    const cacheFile = getCacheFilePath();
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save summary cache:', error);
  }
}

/**
 * Check if a cached summary is still valid
 */
function isCacheEntryValid(entry: CachedSummary): boolean {
  const cachedAt = new Date(entry.cachedAt);
  const maxAge = AI_SUMMARY_CONFIG.maxCacheAgeDays * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt.getTime() < maxAge;
}

/**
 * Get cached summary for a proposal if available and valid
 */
export async function getCachedSummary(
  proposalId: string
): Promise<ProposalSummary | null> {
  const cache = await loadCache();
  const entry = cache.summaries[proposalId];

  if (entry && isCacheEntryValid(entry)) {
    return entry.summary;
  }

  return null;
}

/**
 * Store a summary in cache
 */
export async function cacheSummary(
  proposalId: string,
  summary: ProposalSummary
): Promise<void> {
  const cache = await loadCache();

  cache.summaries[proposalId] = {
    proposalId,
    cachedAt: new Date().toISOString(),
    summary,
  };

  await saveCache(cache);
}
