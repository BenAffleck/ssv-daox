/**
 * API route for AI-powered Q&A against a governance proposal
 * POST /api/proposal-qna
 *
 * Request body: { proposalId, question }
 * Response: { answer: ProposalAnswer | null, fromCache, error? }
 *
 * Note: unlike /api/ai-summary, this route does NOT accept the proposal text
 * from the client. Taking only an id and resolving the proposal server-side
 * keeps a free-form-question endpoint from doubling as a general LLM proxy.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  answerProposalQuestion,
  isProposalQnaAvailable,
  AI_QNA_CONFIG,
  checkRateLimit,
  getClientKey,
} from '@/lib/ai-qna';
import type { QnaRequest, QnaResponse } from '@/lib/ai-qna';
import { fetchGovernanceProposals } from '@/lib/snapshot/api/fetch-governance-proposals';

/**
 * Validate that the request body contains a usable proposal id and question
 */
function validateRequest(body: unknown): body is QnaRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { proposalId, question } = body as Record<string, unknown>;

  if (typeof proposalId !== 'string' || proposalId.trim().length === 0) {
    return false;
  }

  if (typeof question !== 'string') {
    return false;
  }

  const trimmed = question.trim();
  return trimmed.length > 0 && trimmed.length <= AI_QNA_CONFIG.maxQuestionLength;
}

/**
 * Handle POST request for a proposal question
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<QnaResponse>> {
  if (!isProposalQnaAvailable()) {
    return NextResponse.json(
      {
        answer: null,
        fromCache: false,
        error: 'Proposal Q&A is not available. Check configuration.',
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { answer: null, fromCache: false, error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  if (!validateRequest(body)) {
    return NextResponse.json(
      {
        answer: null,
        fromCache: false,
        error: `Invalid request body. Expected { proposalId, question } with a question of 1-${AI_QNA_CONFIG.maxQuestionLength} characters.`,
      },
      { status: 400 }
    );
  }

  const rateLimit = checkRateLimit(getClientKey(request.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        answer: null,
        fromCache: false,
        error: 'Too many questions. Please wait a moment and try again.',
      },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    // Resolve the proposal from the same 5-min-cached aggregator the vote
    // cards render from, so the reachable set is identical to the UI's.
    const { proposals } = await fetchGovernanceProposals();
    const proposal = proposals.find((p) => p.id === body.proposalId);

    if (!proposal) {
      return NextResponse.json(
        { answer: null, fromCache: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const result = await answerProposalQuestion(
      { proposalId: proposal.id, question: body.question.trim() },
      {
        id: proposal.id,
        title: proposal.title,
        body: proposal.body,
        choices: proposal.choices,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Proposal Q&A failed:', error);
    return NextResponse.json(
      {
        answer: null,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Failed to answer question',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to check if proposal Q&A is available
 */
export async function GET(): Promise<NextResponse<{ available: boolean }>> {
  return NextResponse.json({
    available: isProposalQnaAvailable(),
  });
}
