/**
 * TL;DR summary of a governance proposal
 * POST /api/ai-summary  { proposalId }  →  { summary, fromCache } | { error, code }
 */

import { aiRoute } from '@/lib/ai/http';
import { getAiFeatures } from '@/lib/ai/server';

export const POST = aiRoute(
  (request) => getAiFeatures().summarize(request),
  (summary) => ({
    summary,
  }),
);

export { getAiAvailability as GET } from '@/lib/ai/server';
