/**
 * API route for AI-powered event extraction from proposals
 * POST /api/ai-extraction
 *
 * Request body: { proposals: ProposalForExtraction[] }
 * Response: { events: SerializedEvent[], stats: ExtractionStats }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractEventsFromProposals,
  isAIExtractionAvailable,
  ProposalForExtraction,
  ExtractionStats,
} from '@/lib/ai-extraction';
import { serializeAIExtractedEvents } from '@/lib/ai-extraction/transform';
import { SerializedEvent } from '@/lib/dao-timeline/types';

/**
 * Request body type
 */
interface AIExtractionRequest {
  proposals: ProposalForExtraction[];
  /** Skip cache and force re-extraction from API */
  skipCache?: boolean;
}

/**
 * Response body type
 */
interface AIExtractionResponse {
  events: SerializedEvent[];
  stats: ExtractionStats;
  error?: string;
}

/**
 * Validate that the request body contains valid proposals
 */
function validateRequest(body: unknown): body is AIExtractionRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { proposals } = body as { proposals?: unknown };

  if (!Array.isArray(proposals)) {
    return false;
  }

  // Validate each proposal has required fields
  for (const proposal of proposals) {
    if (
      typeof proposal !== 'object' ||
      proposal === null ||
      typeof proposal.id !== 'string' ||
      typeof proposal.title !== 'string' ||
      typeof proposal.body !== 'string' ||
      typeof proposal.end !== 'number' ||
      typeof proposal.link !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Handle POST request for AI extraction
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AIExtractionResponse>> {
  // Check if AI extraction is available
  if (!isAIExtractionAvailable()) {
    return NextResponse.json(
      {
        events: [],
        stats: {
          totalProposals: 0,
          proposalsProcessed: 0,
          proposalsFromCache: 0,
          eventsFound: 0,
          errors: 0,
        },
        error: 'AI extraction is not available. Check configuration.',
      },
      { status: 503 }
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        events: [],
        stats: {
          totalProposals: 0,
          proposalsProcessed: 0,
          proposalsFromCache: 0,
          eventsFound: 0,
          errors: 0,
        },
        error: 'Invalid JSON in request body',
      },
      { status: 400 }
    );
  }

  // Validate request body
  if (!validateRequest(body)) {
    return NextResponse.json(
      {
        events: [],
        stats: {
          totalProposals: 0,
          proposalsProcessed: 0,
          proposalsFromCache: 0,
          eventsFound: 0,
          errors: 0,
        },
        error: 'Invalid request body. Expected { proposals: ProposalForExtraction[] }',
      },
      { status: 400 }
    );
  }

  try {
    // Extract events from proposals
    const { events, stats } = await extractEventsFromProposals(body.proposals, {
      skipCache: body.skipCache,
    });

    // Serialize events for client
    const serializedEvents = serializeAIExtractedEvents(events);

    // Include error message from stats if present
    const response: AIExtractionResponse = {
      events: serializedEvents,
      stats,
    };

    if (stats.errorMessage) {
      response.error = stats.errorMessage;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI extraction failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'AI extraction failed. Please try again later.';
    return NextResponse.json(
      {
        events: [],
        stats: {
          totalProposals: body.proposals.length,
          proposalsProcessed: 0,
          proposalsFromCache: 0,
          eventsFound: 0,
          errors: 1,
          errorMessage,
        },
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to check if AI extraction is available
 */
export async function GET(): Promise<NextResponse<{ available: boolean }>> {
  return NextResponse.json({
    available: isAIExtractionAvailable(),
  });
}
