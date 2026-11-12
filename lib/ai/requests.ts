/** Browser side of the AI routes. Records each request; never the question text. */

import type { ProposalAnswer } from '@/lib/ai-qna/types';
import type { ProposalSummary } from '@/lib/ai-summary/types';
import { trackEvent } from '@/lib/telemetry/events';

type Result<K extends string, T> = ({ ok: true } & Record<K, T>) | { ok: false; error: string };

interface AiBody {
  error?: string;
  code?: string;
}

async function post(path: string, body: object): Promise<AiBody & Record<string, unknown>> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function requestProposalSummary(
  proposalId: string,
): Promise<Result<'summary', ProposalSummary>> {
  trackEvent('ai_summary_requested', {});
  try {
    const data = await post('/api/ai-summary', { proposalId });
    if (data.summary) {
      return { ok: true, summary: data.summary as ProposalSummary };
    }
    if (data.code === 'rate_limited') {
      trackEvent('ai_rate_limited', { feature: 'summary' });
    }
    return { ok: false, error: data.error || 'Failed to generate summary' };
  } catch {
    return { ok: false, error: 'Failed to fetch summary' };
  }
}

export async function askProposalQuestion(
  proposalId: string,
  question: string,
): Promise<Result<'answer', ProposalAnswer>> {
  trackEvent('ai_qna_asked', {});
  try {
    const data = await post('/api/proposal-qna', { proposalId, question });
    if (data.answer) {
      return { ok: true, answer: data.answer as ProposalAnswer };
    }
    if (data.code === 'rate_limited') {
      trackEvent('ai_rate_limited', { feature: 'qna' });
    }
    return { ok: false, error: data.error || 'Failed to answer the question' };
  } catch {
    return { ok: false, error: 'Failed to reach the Q&A service' };
  }
}
