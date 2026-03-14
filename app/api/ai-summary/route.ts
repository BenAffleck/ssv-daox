/**
 * API route for AI-powered proposal summary generation
 * POST /api/ai-summary
 *
 * Request body: { proposalId, title, body, choices }
 * Response: { summary: ProposalSummary | null, fromCache, error? }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateProposalSummary,
  isAISummaryAvailable,
} from '@/lib/ai-summary';
import type { SummaryRequest, SummaryResponse } from '@/lib/ai-summary';

/**
 * Validate that the request body contains valid summary request data
 */
function validateRequest(body: unknown): body is SummaryRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { proposalId, title, body: proposalBody, choices } = body as Record<string, unknown>;

  return (
    typeof proposalId === 'string' &&
    typeof title === 'string' &&
    typeof proposalBody === 'string' &&
    Array.isArray(choices) &&
    choices.every((c) => typeof c === 'string')
  );
}

/**
 * Handle POST request for AI summary generation
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SummaryResponse>> {
  if (!isAISummaryAvailable()) {
    return NextResponse.json(
      {
        summary: null,
        fromCache: false,
        error: 'AI summary is not available. Check configuration.',
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        summary: null,
        fromCache: false,
        error: 'Invalid JSON in request body',
      },
      { status: 400 }
    );
  }

  if (!validateRequest(body)) {
    return NextResponse.json(
      {
        summary: null,
        fromCache: false,
        error: 'Invalid request body. Expected { proposalId, title, body, choices }',
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateProposalSummary(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return NextResponse.json(
      {
        summary: null,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Summary generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to check if AI summary is available
 */
export async function GET(): Promise<NextResponse<{ available: boolean }>> {
  return NextResponse.json({
    available: isAISummaryAvailable(),
  });
}
