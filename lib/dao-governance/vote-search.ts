/**
 * Text search across governance votes.
 *
 * Adapts proposals onto the shared `SearchItem` shape so the governance page
 * search bar and the global Ctrl+K palette rank identically off one scorer
 * (`lib/search/index.ts`) rather than growing a second matching implementation.
 */

import { searchItems, type SearchItem } from '@/lib/search';
import type { GovernanceProposal } from '@/lib/snapshot/types';

/** Characters of proposal body used as the searchable/preview snippet. */
const SNIPPET_LENGTH = 180;

/**
 * The slim proposal shape the client needs to search and display a vote.
 * Sent over the wire by /api/vote-index — deliberately excludes the full body.
 */
export interface VoteIndexEntry {
  id: string;
  title: string;
  snippet: string;
  spaceKey: string;
  spaceLabel: string;
  state: string;
  end: number;
  link: string;
}

const STATE_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Upcoming',
  closed: 'Past',
};

/** Human label for a proposal state, used as a search term and a badge. */
export function getStateLabel(state: string): string {
  return STATE_LABELS[state] ?? state;
}

/**
 * Flatten proposal body markdown into a short single-line snippet: strips
 * fenced code, images, link syntax, headings, emphasis and list markers so a
 * search for plain words isn't defeated by formatting characters.
 */
export function buildSnippet(body: string, maxLength: number = SNIPPET_LENGTH): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Project a proposal into the wire/index shape.
 */
export function toVoteIndexEntry(proposal: GovernanceProposal): VoteIndexEntry {
  return {
    id: proposal.id,
    title: proposal.title,
    snippet: buildSnippet(proposal.body),
    spaceKey: proposal.space.key,
    spaceLabel: proposal.space.label,
    state: proposal.state,
    end: proposal.end,
    link: proposal.link,
  };
}

/**
 * Deep link that opens the governance page with a vote's Ask dialog already
 * open — the direct path from "find a proposal" to "ask a question".
 */
export function getVoteAskUrl(proposalId: string): string {
  return `/governance?ask=${encodeURIComponent(proposalId)}`;
}

/**
 * Build search index entries for votes, reusing the shared SearchItem shape.
 */
export function buildVoteSearchIndex(votes: VoteIndexEntry[]): SearchItem[] {
  return votes.map((vote) => ({
    kind: 'vote' as const,
    id: `vote:${vote.id}`,
    name: vote.title,
    description: vote.snippet,
    category: getStateLabel(vote.state),
    categories: [getStateLabel(vote.state), vote.spaceLabel],
    host: vote.spaceLabel,
    url: getVoteAskUrl(vote.id),
    external: false,
  }));
}

/**
 * Filter proposals by a free-text query.
 *
 * Returns matches in the caller's original order rather than by score, so the
 * governance page keeps its Active → Upcoming → Past grouping and per-section
 * sort. An empty query returns the input untouched.
 */
export function filterProposalsByQuery(
  proposals: GovernanceProposal[],
  query: string
): GovernanceProposal[] {
  if (!query.trim()) return proposals;

  const index = buildVoteSearchIndex(proposals.map(toVoteIndexEntry));
  const matchedIds = new Set(
    searchItems(index, query).map((r) => r.item.id.slice('vote:'.length))
  );

  return proposals.filter((p) => matchedIds.has(p.id));
}
