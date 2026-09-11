/**
 * Configuration for AI event extraction
 */

// Re-export shared AI config for backwards compatibility
export { isAIEnabled as isAIExtractionEnabled, getAnthropicApiKey } from '@/lib/ai/config';

/**
 * AI extraction configuration
 */
export const AI_EXTRACTION_CONFIG = {
  /**
   * Maximum budget for a single extraction run (in USD)
   * Default: $1.00
   */
  maxBudgetUsd: parseFloat(process.env.AI_EXTRACTION_MAX_BUDGET || '1.00'),

  /**
   * Budget limit per individual proposal (in USD)
   * This ensures no single proposal consumes too much budget
   */
  perProposalBudgetUsd: 0.1,

  /**
   * Model to use for extraction
   * haiku is cost-efficient and fast for text extraction
   */
  model: (process.env.AI_EXTRACTION_MODEL || 'haiku') as 'haiku' | 'sonnet' | 'opus',

  /**
   * Delay between processing proposals (ms)
   * Helps with rate limiting
   */
  processingDelayMs: 100,

  /**
   * Maximum proposal body length to process.
   * Matches Snapshot's 50,000-character cap.
   */
  maxProposalBodyLength: 50000,

  /**
   * Cache file path (relative to project root)
   */
  cacheFilePath: '.cache/ai-extractions.json',

  /**
   * Cache version - increment when schema changes
   */
  cacheVersion: 2,

  /**
   * Maximum age for cached extractions (in days)
   * Older extractions will be re-processed
   */
  maxCacheAgeDays: 30,
} as const;

/**
 * Get the prompt for extracting events from a proposal
 */
export function getExtractionPrompt(
  proposalId: string,
  proposalTitle: string,
  proposalEndDate: string,
  proposalBody: string,
): string {
  return `You are analyzing a DAO governance proposal to extract timeline events.

Extract any dates, deadlines, milestones, or scheduled events mentioned in the proposal text.
Only extract events with specific dates (not vague references like "soon" or "later").

IMPORTANT: This proposal passed on ${proposalEndDate}. When the proposal mentions relative
timeframes without specifying a start date (e.g., "within 2 weeks", "30 days after approval",
"Phase 1 starts immediately"), use the proposal passing date (${proposalEndDate}) as the
reference point to calculate absolute dates.

For each event found:
- title: Clear, action-oriented title (e.g., "Testnet Launch", "Funding Deadline")
- date: The specific date in ISO format (YYYY-MM-DD)
- dateConfidence:
  - "high" if exact date given (e.g., "March 15, 2026")
  - "medium" if approximate (e.g., "mid-March", "Q1 2026") or calculated from relative timeframe
  - "low" if inferred from context
- description: What happens on this date
- excerpt: The exact text snippet mentioning this date (max 100 chars)
- eventType: milestone, deadline, launch, meeting, or other
- recurrence: null for a one-off event. Set it only when the text describes a
  regular cadence (a standing call, a recurring report, a periodic review):
  - audience: "community" or "internal" (see the recurrence bar below)
  - freq: DAILY, WEEKLY, MONTHLY or YEARLY
  - interval: how many of those units between occurrences (2 = every other)
    There is no QUARTERLY or SEMI-ANNUAL option, so express those with MONTHLY
    and an interval. Use this mapping exactly:
      every quarter / quarterly / "each quarter"  -> MONTHLY, interval 3
      twice a year / semi-annual / "each half"    -> MONTHLY, interval 6
      every other month / bi-monthly              -> MONTHLY, interval 2
      every two weeks / bi-weekly / fortnightly   -> WEEKLY,  interval 2
      once a year / annual                        -> YEARLY,  interval 1
    Only use YEARLY when the cadence really is once a year. A quarterly report
    is NOT yearly.
  - byDay: weekday codes when the text names them, e.g. ["TU"] or ["MO","TH"]
  - count: total number of occurrences, only if the text states how many
  - until: YYYY-MM-DD end date, only if the text states one
  For a recurring event, "date" must be the FIRST occurrence.

  Emit ONE event per recurring series. If the text names several dates that
  belong to the same cadence ("every 1st of January and 1st of July"), that is
  one series with interval 6 starting on the earlier date — not two events.

THE BAR FOR RECURRING EVENTS (important):
A one-off date appears once and scrolls away. A recurring one claims a
permanent place on every DAO member's timeline, so it must be worth one to the
whole DAO — something a member could show up to, vote in, receive, or must act
on.

"audience" is about WHO THE CADENCE IS FOR, not who performs it. Almost every
recurring obligation is carried out by some specific body — the Foundation, a
committee, a council, a contractor. That alone does NOT make it internal. Ask
instead: does the DAO or the community receive something, or is this a group's
own working rhythm?

ALWAYS audience "community" — a standing obligation to deliver something to the
DAO or the public. These are the most valuable recurring events there are, so
never skip one:
- any transparency report, public report, disclosure or financial statement
- anything "published to the forum", "published to the DAO", or made public
- recurring treasury, budget, spending or balance-sheet reporting
- a recurring vote, election, renewal or ratification the DAO takes part in
- calls, town halls or AMAs open to the community or to delegates
Examples:
- "on the 30th day of each quarter the Foundation will publish a transparency
  report to the forum" -> audience "community" (the Foundation performs it, the
  DAO receives it)
- "the quarterly treasury report published to the DAO" -> "community"
- "a community call every second Wednesday, open to all delegates" -> "community"
- "a recurring vote each month to renew the budget" -> "community"

audience "internal" — a group's own working rhythm, where nothing is delivered
to the DAO. Skip these events entirely rather than extracting them:
- "the Grants Council meets monthly to review applications"
- "Operators sync every Tuesday"
- "the core team holds a weekly standup"
- "the security lead reports privately to the multisig each month"
- "bi-weekly check-ins between the working group and the contractor"

If the cadence produces anything the community can read, attend or vote on,
it is "community". Only when nothing reaches the DAO is it "internal".

Examples of recurrence interpretation:
- "bi-weekly community call, open to all, starting March 4" ->
  date 2026-03-04,
  recurrence {audience: "community", freq: "WEEKLY", interval: 2, byDay: ["WE"]}
- "monthly treasury report published to the DAO for the next 6 months" ->
  recurrence {audience: "community", freq: "MONTHLY", interval: 1, count: 6}
- "on the 30th day since the start of each quarter, the Foundation will publish
  to the forum a report containing a balance sheet breakdown" ->
  recurrence {audience: "community", freq: "MONTHLY", interval: 3}
  (quarterly is MONTHLY interval 3 — never YEARLY)
- "every 1st of January and 1st of July the representative is chosen" ->
  ONE event, date 2026-01-01,
  recurrence {audience: "community", freq: "MONTHLY", interval: 6}
- "the working group meets every Tuesday" -> skip this event entirely
- "the mainnet launch on June 1" -> recurrence null (happens once)

Examples of relative date interpretation (assuming proposal passed on ${proposalEndDate}):
- "within 2 weeks" -> calculate 2 weeks from ${proposalEndDate} (confidence: medium)
- "30 days after approval" -> calculate 30 days from ${proposalEndDate} (confidence: medium)
- "Q2 2026" -> use quarter start date 2026-04-01 (confidence: medium)
- "immediately upon passing" -> use ${proposalEndDate} (confidence: high)

If no timeline events with specific dates are found, return an empty events array.

Proposal ID: ${proposalId}
Proposal Title: ${proposalTitle}
Proposal Passed On: ${proposalEndDate}

--- Proposal Body ---
${proposalBody}`;
}
