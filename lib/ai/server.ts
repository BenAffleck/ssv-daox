import path from 'path';
import { NextResponse } from 'next/server';

import { getSnapshotTimelineSpaceId } from '@/lib/dao-timeline/config';
import { getGovernanceSpaces } from '@/lib/snapshot/config';

import { createAnthropicLlm } from './client';
import { getAnthropicApiKey, isAIEnabled } from './config';
import { createAiFeatures, type AiFeature, type AiFeatures, type Limits } from './features';
import { createSnapshotProposalSource } from './proposal-source';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Per feature, at most this many model calls a day across all clients. */
const GLOBAL_DAILY_CALLS = 300;

const AI_LIMITS: Record<AiFeature, Limits> = {
  summary: {
    perClient: { windowMs: HOUR_MS, max: 30 },
    global: { windowMs: DAY_MS, max: GLOBAL_DAILY_CALLS },
  },
  qna: {
    perClient: { windowMs: 10 * 60 * 1000, max: 10 },
    global: { windowMs: DAY_MS, max: GLOBAL_DAILY_CALLS },
  },
  // A first pass over an uncached timeline takes about 50 calls.
  extraction: {
    perClient: { windowMs: HOUR_MS, max: 60 },
    global: { windowMs: DAY_MS, max: GLOBAL_DAILY_CALLS },
  },
};

let features: AiFeatures | null = null;

/**
 * The AI features wired to Anthropic, Snapshot and `.cache/ai.json`. One
 * instance per process, so its cache writes are serialized.
 */
export function getAiFeatures(): AiFeatures {
  if (!features) {
    const apiKey = getAnthropicApiKey();
    features = createAiFeatures({
      enabled: isAIEnabled() && apiKey !== null,
      llm: createAnthropicLlm(apiKey ?? ''),
      governance: createSnapshotProposalSource({
        spaceIds: getGovernanceSpaces().map((space) => space.spaceId),
        fetch,
      }),
      timeline: createSnapshotProposalSource({
        spaceIds: [getSnapshotTimelineSpaceId() ?? ''],
        fetch,
      }),
      cacheFilePath: path.join(process.cwd(), '.cache', 'ai.json'),
      limits: AI_LIMITS,
    });
  }
  return features;
}

/** Whether AI is switched on and an API key is set. */
export function isAiAvailable(): boolean {
  return getAiFeatures().available;
}

/** GET handler shared by the AI routes: `{ available }`. */
export function getAiAvailability() {
  return NextResponse.json({ available: isAiAvailable() });
}
