/**
 * Answers one question about a governance proposal
 * POST /api/proposal-qna  { proposalId, question }  →  { answer, fromCache } | { error, code }
 */

import { aiRoute } from '@/lib/ai/http';
import { getAiFeatures } from '@/lib/ai/server';

export const POST = aiRoute(
  (request) => getAiFeatures().answer(request),
  (answer) => ({
    answer,
  }),
);

export { getAiAvailability as GET } from '@/lib/ai/server';
