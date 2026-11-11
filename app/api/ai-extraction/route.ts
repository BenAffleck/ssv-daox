/**
 * Timeline events extracted from one timeline proposal
 * POST /api/ai-extraction  { proposalId }  →  { events, eventsFiltered, fromCache } | { error, code }
 */

import { aiRoute } from '@/lib/ai/http';
import { getAiFeatures } from '@/lib/ai/server';

export const POST = aiRoute(
  (request) => getAiFeatures().extractEvents(request),
  (value) => value,
);

export { getAiAvailability as GET } from '@/lib/ai/server';
