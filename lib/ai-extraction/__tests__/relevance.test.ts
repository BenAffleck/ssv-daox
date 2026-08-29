import { describe, expect, it } from 'vitest';

import { filterTimelineWorthy, isPublicReportingObligation, isTimelineWorthy } from '../relevance';
import { AIExtractedEvent, AIExtractedEventSchema } from '../types';

function extracted(overrides: Partial<AIExtractedEvent> = {}): AIExtractedEvent {
  return {
    title: 'Community Call',
    date: '2026-03-04',
    dateConfidence: 'high',
    description: 'Open call for all delegates',
    excerpt: 'community call every second Wednesday',
    eventType: 'meeting',
    recurrence: null,
    ...overrides,
  };
}

const recurrence = (overrides = {}) => ({
  audience: 'community' as const,
  freq: 'WEEKLY' as const,
  interval: 2,
  ...overrides,
});

describe('isTimelineWorthy', () => {
  it('keeps one-off events', () => {
    expect(isTimelineWorthy(extracted())).toBe(true);
  });

  it('keeps a community-facing recurring event', () => {
    expect(isTimelineWorthy(extracted({ recurrence: recurrence() }))).toBe(true);
  });

  it('drops a recurring event internal to a role or team', () => {
    // "the Grants Council meets monthly" is an operating detail, not a date
    // every DAO member should carry on their timeline.
    expect(
      isTimelineWorthy(
        extracted({
          title: 'Grants Council Review',
          description: 'The Grants Council reviews applications',
          excerpt: 'the Grants Council meets monthly to review applications',
          recurrence: recurrence({ audience: 'internal', freq: 'MONTHLY' }),
        }),
      ),
    ).toBe(false);
  });

  it('keeps a one-off event regardless of who it concerns', () => {
    // Only recurrence claims a permanent slot, so only recurrence is gated.
    expect(isTimelineWorthy(extracted({ title: 'Council handover', recurrence: null }))).toBe(true);
  });
});

describe('AIRecurrenceSchema audience default', () => {
  it('treats an unlabelled cadence as internal, so it fails closed', () => {
    const parsed = AIExtractedEventSchema.parse({
      title: 'Ops Sync',
      date: '2026-03-04',
      dateConfidence: 'high',
      description: 'Weekly sync',
      excerpt: 'ops sync every week',
      eventType: 'meeting',
      recurrence: { freq: 'WEEKLY', interval: 1 },
    });

    expect(parsed.recurrence?.audience).toBe('internal');
    expect(isTimelineWorthy(parsed)).toBe(false);
  });

  it('still parses an event with no recurrence key at all', () => {
    const parsed = AIExtractedEventSchema.parse({
      title: 'Launch',
      date: '2026-06-01',
      dateConfidence: 'high',
      description: 'Mainnet launch',
      excerpt: 'launch on June 1',
      eventType: 'launch',
    });

    expect(isTimelineWorthy(parsed)).toBe(true);
  });
});

describe('filterTimelineWorthy', () => {
  it('reports how many events it dropped', () => {
    const { kept, filtered } = filterTimelineWorthy([
      extracted({ title: 'Community Call', recurrence: recurrence() }),
      extracted({
        title: 'Operators Sync',
        recurrence: recurrence({ audience: 'internal' }),
      }),
      extracted({ title: 'Mainnet Launch' }),
    ]);

    expect(kept.map((e) => e.title)).toEqual(['Community Call', 'Mainnet Launch']);
    expect(filtered).toBe(1);
  });

  it('is a no-op for an empty extraction', () => {
    expect(filterTimelineWorthy([])).toEqual({ kept: [], filtered: 0 });
  });
});

/**
 * DIP-43 "SSV Foundation Transparency Policy" is the case this gate must not
 * get wrong. Its language is written entirely in terms of the Foundation, so
 * the cadence reads as belonging to one body — yet the DAO is who the report
 * is for. Excerpts below are verbatim from the proposal.
 *
 * https://snapshot.box/#/s:mainnet.ssvnetwork.eth/proposal/0x9a9abafce96bd8a4d134d386b321cbe819e7510503fdd802a0c705c71550beeb
 */
describe('DIP-43 — SSV Foundation Transparency Policy', () => {
  const transparencyReport = (recurrenceOverrides = {}) =>
    extracted({
      title: 'Foundation Transparency Report',
      description: 'The Foundation publishes a balance sheet breakdown to the ssv.network forum',
      excerpt:
        'On the 30th day since the start of each quarter, the Foundation will publish to the ssv.network forum a report',
      eventType: 'deadline',
      recurrence: recurrence({ freq: 'MONTHLY', interval: 3, ...recurrenceOverrides }),
    });

  it('keeps the quarterly transparency report', () => {
    expect(isTimelineWorthy(transparencyReport())).toBe(true);
  });

  it('keeps it even when the model reads the Foundation as internal', () => {
    // The likeliest misread: every sentence names the Foundation, so the model
    // labels the cadence by its performer rather than its recipient.
    expect(isTimelineWorthy(transparencyReport({ audience: 'internal' }))).toBe(true);
  });

  it('keeps it when the model omits audience entirely', () => {
    // audience defaults to 'internal', so without the override an unlabelled
    // transparency report would be silently dropped.
    const parsed = AIExtractedEventSchema.parse({
      title: 'Foundation Transparency Report',
      date: '2026-04-30',
      dateConfidence: 'high',
      description: 'Quarterly balance sheet breakdown published to the forum',
      excerpt:
        'the Foundation will publish to the ssv.network forum a report that contains a balance sheet breakdown',
      eventType: 'deadline',
      recurrence: { freq: 'MONTHLY', interval: 3 },
    });

    expect(parsed.recurrence?.audience).toBe('internal');
    expect(isTimelineWorthy(parsed)).toBe(true);
  });

  it('recognises the report as a public obligation, not a meeting', () => {
    expect(isPublicReportingObligation(transparencyReport())).toBe(true);
  });

  it('still drops a private report to a committee', () => {
    // The override needs a public recipient, not merely the word "report" —
    // otherwise it would readmit exactly the noise it was added beside.
    expect(
      isTimelineWorthy(
        extracted({
          title: 'Security Report to Multisig',
          description: 'The security lead reports privately to the multisig',
          excerpt: 'the security lead reports privately to the multisig each month',
          recurrence: recurrence({ audience: 'internal', freq: 'MONTHLY' }),
        }),
      ),
    ).toBe(false);
  });

  it("still drops the committee's own working rhythm", () => {
    expect(
      isTimelineWorthy(
        extracted({
          title: 'Oversight Committee Access Review',
          description: 'The FOC reviews Foundation information',
          excerpt: 'The FOC will have continuous access to all Foundation information',
          recurrence: recurrence({ audience: 'internal', freq: 'MONTHLY' }),
        }),
      ),
    ).toBe(false);
  });

  it('keeps the semi-annual Community Representative selection', () => {
    // Chosen by the FOC, but it decides who represents the community — the
    // model should label it community, and nothing here should override that.
    expect(
      isTimelineWorthy(
        extracted({
          title: 'Community Representative Selection',
          description: 'The FOC chooses the Community Representative',
          excerpt:
            'Every 1st of January and 1st of July, the Community Representative will be chosen by the FOC',
          recurrence: recurrence({ audience: 'community', freq: 'MONTHLY', interval: 6 }),
        }),
      ),
    ).toBe(true);
  });

  it('keeps the report while dropping the internal cadences alongside it', () => {
    const { kept, filtered } = filterTimelineWorthy([
      transparencyReport({ audience: 'internal' }),
      extracted({
        title: 'Operators Sync',
        description: 'Weekly operator sync',
        excerpt: 'Operators sync every Tuesday',
        recurrence: recurrence({ audience: 'internal' }),
      }),
    ]);

    expect(kept.map((e) => e.title)).toEqual(['Foundation Transparency Report']);
    expect(filtered).toBe(1);
  });
});
