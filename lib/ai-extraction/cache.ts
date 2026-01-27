/**
 * File-based caching for AI extractions
 * Stores extracted events to avoid re-processing the same proposals
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  AIExtractedEvent,
  CachedExtraction,
  ExtractionCache,
} from './types';
import { AI_EXTRACTION_CONFIG } from './config';

/**
 * Get the full path to the cache file
 */
function getCacheFilePath(): string {
  return path.join(process.cwd(), AI_EXTRACTION_CONFIG.cacheFilePath);
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
 * Load the extraction cache from file
 * Returns empty cache if file doesn't exist or is invalid
 */
export async function loadCache(): Promise<ExtractionCache> {
  const emptyCache: ExtractionCache = {
    version: AI_EXTRACTION_CONFIG.cacheVersion,
    extractions: {},
  };

  try {
    const cacheFile = getCacheFilePath();
    const content = await fs.readFile(cacheFile, 'utf-8');
    const cache = JSON.parse(content) as ExtractionCache;

    // Check version compatibility
    if (cache.version !== AI_EXTRACTION_CONFIG.cacheVersion) {
      console.log('Cache version mismatch, starting fresh');
      return emptyCache;
    }

    return cache;
  } catch {
    // File doesn't exist or is invalid
    return emptyCache;
  }
}

/**
 * Save the extraction cache to file
 */
export async function saveCache(cache: ExtractionCache): Promise<void> {
  try {
    await ensureCacheDir();
    const cacheFile = getCacheFilePath();
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save extraction cache:', error);
  }
}

/**
 * Check if a cached extraction is still valid (not too old)
 */
function isCacheEntryValid(entry: CachedExtraction): boolean {
  const extractedAt = new Date(entry.extractedAt);
  const maxAge = AI_EXTRACTION_CONFIG.maxCacheAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now - extractedAt.getTime() < maxAge;
}

/**
 * Get cached extraction for a proposal if available and valid
 */
export async function getCachedExtraction(
  proposalId: string
): Promise<AIExtractedEvent[] | null> {
  const cache = await loadCache();
  const entry = cache.extractions[proposalId];

  if (entry && isCacheEntryValid(entry)) {
    return entry.events;
  }

  return null;
}

/**
 * Store extraction results in cache
 */
export async function cacheExtraction(
  proposalId: string,
  events: AIExtractedEvent[]
): Promise<void> {
  const cache = await loadCache();

  cache.extractions[proposalId] = {
    proposalId,
    extractedAt: new Date().toISOString(),
    events,
  };

  await saveCache(cache);
}

/**
 * Get multiple cached extractions at once
 * Returns a map of proposalId -> events (or null if not cached)
 */
export async function getCachedExtractions(
  proposalIds: string[]
): Promise<Map<string, AIExtractedEvent[] | null>> {
  const cache = await loadCache();
  const results = new Map<string, AIExtractedEvent[] | null>();

  for (const proposalId of proposalIds) {
    const entry = cache.extractions[proposalId];
    if (entry && isCacheEntryValid(entry)) {
      results.set(proposalId, entry.events);
    } else {
      results.set(proposalId, null);
    }
  }

  return results;
}

/**
 * Batch save multiple extractions
 */
export async function cacheExtractions(
  extractions: Array<{ proposalId: string; events: AIExtractedEvent[] }>
): Promise<void> {
  const cache = await loadCache();
  const now = new Date().toISOString();

  for (const { proposalId, events } of extractions) {
    cache.extractions[proposalId] = {
      proposalId,
      extractedAt: now,
      events,
    };
  }

  await saveCache(cache);
}

/**
 * Clear all cached extractions
 */
export async function clearCache(): Promise<void> {
  const emptyCache: ExtractionCache = {
    version: AI_EXTRACTION_CONFIG.cacheVersion,
    extractions: {},
  };
  await saveCache(emptyCache);
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const cache = await loadCache();
  let removedCount = 0;

  for (const [proposalId, entry] of Object.entries(cache.extractions)) {
    if (!isCacheEntryValid(entry)) {
      delete cache.extractions[proposalId];
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await saveCache(cache);
  }

  return removedCount;
}
