# DAOx Architecture

## Overview

Next.js 16 App Router application with TypeScript strict mode. Modular design where each feature is an isolated module.

**Core Principles:**

- Server components for data fetching, client components for interactivity
- Semantic color tokens for theming (never hardcode colors)
- Dependency injection for external data (testable)
- 5-minute server-side caching for external APIs

---

## Directory Structure

```
ssv-daox/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing page (module grid)
│   ├── layout.tsx            # Root layout + ThemeProvider
│   ├── globals.css           # Tailwind v4 + theme tokens
│   ├── [slug]/               # Dynamic module routes (fallback)
│   ├── api/                  # API Routes
│   │   ├── ai-extraction/    # AI extraction endpoint
│   │   │   └── route.ts      # POST /api/ai-extraction
│   │   ├── ai-summary/       # AI summary endpoint
│   │   │   └── route.ts      # POST /api/ai-summary
│   │   ├── proposal-qna/     # AI proposal Q&A endpoint
│   │   │   └── route.ts      # POST /api/proposal-qna
│   │   └── vote-index/       # Searchable vote index for the command palette
│   │       └── route.ts      # GET /api/vote-index
│   ├── dao-delegates/        # DAO Delegates module
│   │   └── page.tsx          # Server component (data orchestration)
│   ├── dao-timeline/         # DAO Timeline module
│   │   └── page.tsx          # Server component (event aggregation)
│   └── governance/           # Governance Votes module
│       ├── page.tsx          # Server component (cross-space aggregation)
│       └── loading.tsx       # Loading skeleton
│
├── components/               # Shared components
│   ├── Header.tsx            # App header (full nav bar + global search trigger)
│   ├── SearchPalette.tsx     # Global Ctrl+K command palette + trigger button
│   ├── ModuleCard.tsx        # Landing page cards
│   ├── dao-delegates/        # DAO Delegates components
│   │   ├── DelegatesTable.tsx    # Client: filter/sort state
│   │   ├── FilterControls.tsx    # Client: filter UI
│   │   ├── TableHeader.tsx       # Client: sortable headers
│   │   ├── DelegateRow.tsx       # Server: row rendering
│   │   ├── ScoreCell.tsx         # Score + pillar breakdown tooltip
│   │   └── *Badge.tsx            # Server: badge components
│   └── dao-timeline/         # DAO Timeline components
│       ├── Timeline.tsx          # Client: main container + AI state
│       ├── TimelineFilterControls.tsx
│       ├── TimelineRangeBrush.tsx # Client: date range brush
│       ├── TimelineView.tsx      # Client: grouped display
│       ├── EventCard.tsx         # Event display + AI metadata
│       ├── SourceBadge.tsx       # Source indicator
│       ├── AIExtractionPanel.tsx # AI extraction UI
│       └── AISourceBadge.tsx     # AI event badge with sparkle
│
├── lib/                      # Business logic
│   ├── types.ts              # Core types (Module, ModuleStatus)
│   ├── data/modules.ts       # Module registry
│   ├── search/index.ts       # Unified module + tool search index & scoring
│   ├── theme/                # Theme system
│   │   ├── types.ts          # Theme type definitions
│   │   ├── ThemeProvider.tsx # React Context
│   │   └── ThemeToggle.tsx   # Theme selector
│   ├── dao-delegates/        # DAO Delegates logic
│   │   ├── types.ts          # Delegate types
│   │   ├── config.ts         # Delegate Score API config, cohort labels
│   │   ├── api/              # Delegate Score API fetcher
│   │   ├── eligibility/      # Eligibility rules
│   │   └── logic/            # Business logic
│   ├── dao-timeline/         # DAO Timeline logic
│   │   ├── types.ts          # Event types, sources
│   │   ├── config.ts         # Source configuration
│   │   ├── api/              # Source fetchers, registry
│   │   ├── parsers/          # ICS parser
│   │   ├── logic/            # Transform, expand, aggregate
│   │   └── utils/            # Date + ICS utilities
│   ├── ai/                   # Shared AI infrastructure
│   │   ├── config.ts         # isAIEnabled(), getAnthropicApiKey(), model config
│   │   └── client.ts         # getModelId(), parseAPIError(), truncateBody(), createClient()
│   ├── ai-extraction/        # AI-powered event extraction
│   │   ├── types.ts          # AI extraction types + Zod schemas
│   │   ├── config.ts         # Extraction-specific config + prompt (delegates to lib/ai/)
│   │   ├── cache.ts          # File-based caching
│   │   ├── extract-events.ts # Claude API integration (uses lib/ai/ client)
│   │   ├── transform.ts      # AI events → UnifiedEvent
│   │   └── __tests__/        # Unit tests
│   ├── ai-summary/           # AI proposal TL;DR summaries
│   │   ├── types.ts          # ProposalSummary type + Zod schemas
│   │   ├── config.ts         # Summary-specific config + prompt
│   │   ├── cache.ts          # File-based caching (.cache/ai-summaries.json)
│   │   ├── generate-summary.ts # Core logic (uses lib/ai/ client)
│   │   ├── index.ts          # Module exports
│   │   └── __tests__/        # Unit tests
│   ├── ai-qna/               # AI proposal Q&A (single question per proposal)
│   │   ├── types.ts          # ProposalAnswer type + Zod schemas
│   │   ├── config.ts         # Q&A config + prompt + rate-limit config
│   │   ├── cache.ts          # File-based caching (.cache/ai-qna.json)
│   │   ├── rate-limit.ts     # In-memory fixed-window limiter
│   │   ├── answer-question.ts # Core logic (uses lib/ai/ client)
│   │   ├── index.ts          # Module exports
│   │   └── __tests__/        # Unit tests
│   └── snapshot/             # Snapshot.org integration
│       ├── config.ts         # API config + env vars
│       ├── types.ts          # API types
│       └── api/              # GraphQL queries
│
├── __tests__/                # Unit tests (Vitest)
└── e2e/                      # E2E tests (Playwright)
```

---

## Core Patterns

### 1. Server/Client Component Split

**Server components** handle:

- Data fetching from external APIs
- Heavy computation (transformations, eligibility checks)
- Static rendering (badges, rows)

**Client components** handle:

- User interaction state (filters, sort)
- Browser APIs (clipboard, localStorage)
- Real-time UI updates

**Pattern:** Data flows server → client via props. Client components never fetch data.

### 2. Theming System

Uses CSS variables + `data-theme` attribute on `<html>`.

**Files involved:**

- `lib/theme/types.ts` - Theme type union
- `app/globals.css` - CSS variable definitions per theme
- `lib/theme/ThemeProvider.tsx` - React Context + localStorage
- `app/layout.tsx` - FOUC prevention script

**Adding a theme:**

1. Add to type in `lib/theme/types.ts`
2. Add CSS variables in `app/globals.css` under `:root[data-theme="name"]`
3. Add to `themes` array in `ThemeProvider.tsx`
4. Add label in `ThemeToggle.tsx`

**Always use semantic tokens:** `bg-background`, `text-foreground`, `border-border`, `text-primary`, etc.

### 3. Header Navigation

The header (`components/Header.tsx`) is a `'use client'` component providing a three-zone navigation bar:

**Layout:** `[Logo Container] — [Home | Module Nav Items | More ▾] — [ThemeToggle | Guest Pill]`

**Features:**

- Logo in bordered container linking to `/`
- Nav items for each active module with Lucide React icons, active route detection via `usePathname()`
- "More" dropdown listing coming-soon modules (dimmed, with badge)
- Guest user profile pill (placeholder for future auth)
- Responsive: hamburger menu on mobile with slide-down panel

**CSS classes:** `.nav-item` / `.nav-item-active` in `@layer components` (follows `.filter-btn` pattern)

**Icon mapping:** Slug-to-icon map in Header component (`dao-delegates` → `Users`, `dao-timeline` → `Calendar`)

**Dependencies:** `lucide-react` (tree-shakeable icon library, ~1KB per icon)

### 4. External Data Integration

All external data uses dependency injection for testability.

**Data sources:**

- **Delegate Score API** - Ranked delegates, scores and cohort allocation (requires `DELEGATE_SCORE_API_URL`)
- **Snapshot Hub API** - Committee member addresses
- **The Graph Subgraph** - Delegation relationships (requires `THEGRAPH_API_KEY`)

**Pattern:**

```
page.tsx → Promise.all([fetchA(), fetchB()]) → buildLists(data) → transform → render
```

Mock data for tests lives in `lib/*/___tests__/__mocks__/`.

### 4. Module System

Modules are registered in `lib/data/modules.ts` with status (ACTIVE/COMING_SOON).

**Adding a module:**

1. Add entry to `lib/data/modules.ts`
2. Create `app/[module-slug]/page.tsx` (or directory for complex modules)
3. Module-specific components go in `components/[module-slug]/`
4. Module-specific logic goes in `lib/[module-slug]/`

### 5. External Tools

External community-built tools (calculators, simulators, dashboards, explorers, claim UIs) displayed in a list-style section on the landing page below the modules grid. This is the only home for external tools — there is no separate "Featured DAO Community" section; featured items are pinned to the top of this list via the `featured` flag.

**Data model:** `ExternalTool` interface in `lib/types.ts`:

- `id`, `name`, `description`, `host`, `url`, `sortOrder`
- `categories`: `ExternalToolCategory[]` — a tool can belong to more than one category (e.g. `[CALCULATOR, DASHBOARD]`); the filter matches when any category is selected
- `inputs`, `outputs`: short formula-style strings (e.g. `Validators · Fee % · APR` → `Net SSV · USD/yr`)
- `featured?`: when `true`, the tool is pinned to the top of the list and rendered with a solid-primary "Featured" pill

**Data pipeline (community-contributable):** each tool is one JSON file in
`data/external-tools/<id>.json`, validated by a Zod schema and assembled at build
time into a generated TypeScript array. This lets non-developers add a tool via a
single-file PR while keeping all existing import sites unchanged.

```
data/external-tools/*.json
  → scripts/gen-external-tools.ts   (validate w/ Zod, derive host, fail on bad input)
  → lib/data/external-tools.generated.ts   (generated ExternalTool[])
  → lib/data/external-tools.ts      (re-export + getExternalToolsSorted())
  → components / search index
```

The generator runs on `predev` / `prebuild` and via `npm run gen:tools`; CI checks
the committed generated file is in sync. See `CONTRIBUTING.md` and the
`.github/` scaffolding (CI, Claude review workflows, CODEOWNERS, PR/issue templates).

**Files:**

- `data/external-tools/<id>.json` — one file per tool (the contribution surface)
- `lib/external-tool.schema.ts` — Zod schema + `parseExternalTool()` (single source of truth)
- `data/external-tool.schema.json` — JSON Schema mirror for editor autocomplete
- `scripts/gen-external-tools.ts` — build-time validator/generator
- `lib/data/external-tools.generated.ts` — generated array (do not hand-edit)
- `lib/data/external-tools.ts` — re-export + `getExternalToolsSorted()` (featured-first, then `sortOrder`, then name)
- `components/ExternalToolsSection.tsx` — client component with filter state, list rows, submit footer

**Category → badge mapping (semantic tonal tints, no new colors):**

- `Simulator` → `badge-sm-secondary` (purple)
- `Calculator` → `badge-sm-primary` (blue)
- `Dashboard` → `badge-sm-accent` (green)
- `Explorer` → `badge-sm-warning` (orange)
- `Claim` → `badge-sm-danger` (red)

The "Featured" pill uses solid `bg-primary text-white` to read as a callout rather than a category.

**Adding an external tool:**

1. Create `data/external-tools/<id>.json` (copy an existing file as a template)
2. Fill the required fields: `id`, `name`, `description`, `categories` (one or more), `inputs`, `outputs`, `url` (`host` is derived from `url`)
3. Run `npm run gen:tools` (validates + regenerates) and commit the generated file, then `npm test`
4. `featured` is maintainer-only; community PRs leave it unset

### 6. Global Search (Ctrl+K)

A global search palette indexes all modules and external tools and is reachable from anywhere on the page via `Ctrl+K` / `Cmd+K`. The trigger button lives in the header (desktop right section + mobile menu).

**Files:**

- `lib/search/index.ts` — `buildSearchIndex(modules, tools)`, `searchItems(index, q)`, and `scoreSearchItem`. Pure functions, no React. Searches across name, description, host, and category strings; ranks direct name hits highest, then any direct substring, then subsequence matches.
- `components/SearchPalette.tsx` — client component exporting:
  - default `SearchPalette` — modal + global keyboard listener; mounted once inside `Header`.
  - `SearchTrigger` — pill button with `⌘K` / `Ctrl K` kbd hint (desktop and mobile variants).
  - `openSearchPalette()` — helper that dispatches the `daox:open-search` window event so any caller can open the modal.

**Behavior:**

- `Ctrl+K` / `Cmd+K` toggles the palette; `Esc` closes it; `↑` / `↓` move the active row; `Enter` opens it.
- Active modules navigate via `next/navigation` `router.push`; coming-soon modules are listed but not navigable. External tools open in a new tab with `noopener,noreferrer`.
- Results are grouped by **Modules** and **External tools**. Featured tools render with the same solid-primary "Featured" pill used in `ExternalToolsSection`.
- Empty state shows a "No matches for …" message; footer shows kbd legend and live result count.

**Visuals:** Glassmorphic scrim (`bg-black/45 backdrop-blur-sm`), centered modal at `12vh` from the top, brand glow shadow (`var(--shadow-glow-lg)`), `palette-in` keyframe defined in `globals.css`.

---

## DAO Delegates Module

The primary implemented module. Shows a ranked delegate leaderboard with Delegate Score, eligibility and cohort allocation.

### Data Pipeline

```
1. Fetch the leaderboard + health from the Delegate Score API (parallel)
2. Fetch committee members from Snapshot (parallel)
3. Fetch delegation recipients from The Graph (parallel)
4. Fetch vote participation from Snapshot (parallel)
5. Build eligibility Sets (O(1) lookups)
6. Transform score rows → Delegate objects (inject participation rates)
7. Pass to client for filtering/sorting
```

Rank, score and cohort come from the API; the app no longer ranks or assigns
programs itself.

### Delegate Score API

The Delegate Score API replaced the retired Karma API. It is a read-only JSON
API whose contract is its OpenAPI spec (`/openapi.json`). Each **run** scores
every candidate for one UTC **as-of** day and allocates the DAO's voting power
across five cohorts (`ssvCommunity`, `verifiedOperators`, `professional`,
`grantRecipients`, `ethCommunities`).

- `lib/dao-delegates/api/fetch-leaderboard.ts` pages `GET /v1/leaderboard` at
  the maximum page size. Later pages are pinned to the first page's `as_of`; a
  `run_id` change while paging fails the request.
- `GET /health` answers `503` with the same body when data is stale or absent.
  The page then shows the as-of and age as a warning but still renders.
- The page header cites the `run_id` and `as_of` the rows were read from.
- Scores are unrounded in the API and rounded to one decimal for display.
- The Score cell's tooltip breaks the score into its pillars (community,
  holdings, votes). A pillar with `missing_<pillar>: true` shows as "n/a"; a
  pillar that is `null` is not live and is omitted.
- The Cohort column shows the delegate's cohort and allocated power. "Next
  Round" compares the cohort with live delegation status (The Graph).
- When `DELEGATE_SCORE_API_URL` is unset the page renders a notice instead of
  the table. The page revalidates every 5 minutes so a later-configured URL is
  picked up.

- Every scored address is its own row. Its `identity` groups it with the other
  addresses of one person (linked on HighSignal) and carries the forum and
  Discord handles and each address's ENS name. Handles are current values, not
  as of the run.
- Search matches display name, address, ENS name and handles. The Copy Forum
  and Copy Discord buttons copy the handles of the filtered rows, once per
  handle (`logic/collect-handles.ts`), since addresses of one identity share
  them.

Karma features the API does not cover yet are removed from the UI: delegate
status (withdrawn), profile completeness and its empty state, delegated tokens
and delegator count sorting.

### Vote Participation & Active Vote Status

Shows each delegate's voting activity in two sections:

**Historical Participation** — Color-coded badge showing voting rate across the N most recent closed proposals (configurable via `SNAPSHOT_CONFIG.voteParticipation.proposalCount`, default: 5), with a "Last N closed" label clarifying scope.

**Data flow (historical):**

1. `fetchProposals()` - Get latest closed, non-flagged proposals from Snapshot Hub
2. `fetchVotes()` - Get all votes for those proposals (paginated, 1000/page)
3. `fetchVoteParticipation()` - Build map: `address → participation %`

All proposal queries use `flagged: false` to exclude moderator-deleted spam proposals.

**Active Vote Status** — Colored dots showing whether a delegate has voted on each currently active proposal (accent=voted, danger=not voted). Capped at 3 dots with "+N" overflow.

**Data flow (active):**

1. `fetchActiveProposals()` - Get active proposals with scores/quorum/choices
2. `fetchActiveVoteStatus()` - Combines active proposals + `fetchVotes()` into a `voterMap: Map<address, Set<proposalId>>`
3. `transformDelegates()` - Populates `delegate.activeVoteStatus[]` per delegate

**Display:** `VoteParticipationCell` component (replaces `VoteParticipationBadge`)

- Historical badge colors: 90-100% `accent`, 80-89% `warning`, 0-79% `danger`
- Active dots: `accent` (voted) / `danger` (not voted), with `title` tooltips
- Column header: "Vote Activity"

Uses the same space ID as delegation (`SNAPSHOT_DELEGATION_SPACE_FILTER`).

### Voting Power Breakdown

The Voting Power column shows a compact total plus an info icon that opens a portal-rendered breakdown popover (`components/dao-delegates/VotingPowerBadge.tsx`). Rows without pre-fetched data render a fetch icon that loads on demand from `/api/voting-power/[address]`.

**Data source:** Gnosis Guild Delegation API `pin` endpoint (`lib/gnosis/`), posted with the SSV split-delegation strategy payload. Values are SSV + cSSV.

The pin response carries both flat address lists (`delegators`, `delegates`) and weighted trees (`delegatorTree`, `delegateTree`) that pair each counterparty with its `delegatedPower`. `toVotingPowerData()` (`lib/gnosis/logic/transform-voting-power.ts`) is the single transform shared by the server-side batch fetcher and the on-demand API route; it flattens both trees into `incomingDelegations` / `outgoingDelegations` (`DelegationEntry[]`, sorted by power descending). When a response omits the tree, incoming entries fall back to the flat `delegators` list with `power: null`, rendered as an em dash.

**Popover contents:** total / incoming / outgoing / net delegated / delegator count, then a "Delegating in" and a "Delegating out" list. Each list row shows the full counterparty address with its signed absolute amount (`accent` for in, `danger` for out), and each list header carries a copy icon that copies only that list's addresses (newline separated). Empty lists are omitted entirely.

### Active Votes on Home Page

The landing page displays currently active governance proposals when any exist (renders nothing when none).

**Data flow:**

1. `fetchActiveProposals()` called in `app/page.tsx` (async server component)
2. `isAISummaryAvailable()` checked server-side and passed as prop
3. `ActiveVotes` section renders `ActiveVoteCard` for each proposal

**ActiveVoteCard displays:**

- Proposal title (linked to Snapshot)
- Time remaining badge (e.g., "2d 5h left")
- Stacked progress bar with score distribution per choice (semantic colors)
- Voter count and quorum status
- **"Vote Now" CTA** - Primary-colored button linking to Snapshot
- **"AI TL;DR" button** (when AI is available) - Fetches/toggles AI-generated summary with choice explanations via `/api/ai-summary`

**AI Summary flow:**

1. User clicks "AI TL;DR" on an ActiveVoteCard (client component)
2. Client POSTs `{ proposalId, title, body, choices }` to `/api/ai-summary`
3. Server checks file cache (`.cache/ai-summaries.json`), returns cached if valid
4. Otherwise calls Claude API via shared `lib/ai/` client
5. Caches result and returns `ProposalSummary` with `tldr` + `choiceExplanations`
6. Card displays summary inline; subsequent clicks toggle visibility

**Files:**

- `lib/snapshot/api/fetch-active-proposals.ts` - GraphQL query for active proposals (includes `body`)
- `lib/snapshot/api/fetch-active-vote-status.ts` - Orchestrator combining proposals + votes
- `lib/snapshot/utils/time-remaining.ts` - Time formatting utility
- `lib/ai-summary/` - Summary generation module (types, config, cache, generate)
- `app/api/ai-summary/route.ts` - POST endpoint for summary generation
- `components/ActiveVotes.tsx` - Section wrapper (passes `isAISummaryAvailable`)
- `components/ActiveVoteCard.tsx` - Client component with Vote Now CTA + AI TL;DR

### Key Environment Variables

```bash
# Snapshot committee spaces (have defaults)
SNAPSHOT_GRANTS_SPACE_ID=grants.ssvnetwork.eth
SNAPSHOT_OPERATOR_SPACE_ID=vo.ssvnetwork.eth
SNAPSHOT_MULTISIG_SPACE_ID=msig.ssvnetwork.eth

# Required for the delegates leaderboard
DELEGATE_SCORE_API_URL=http://127.0.0.1:8000

# Required for delegation status feature
THEGRAPH_API_KEY=your_key
SNAPSHOT_DELEGATION_SOURCE_ADDRESSES=0x...,0x...
SNAPSHOT_DELEGATION_SPACE_FILTER=ssv.dao.eth
```

---

## DAO Timeline Module

Displays events from multiple calendar sources in a chronological timeline view. Supports ICS calendars and Snapshot governance proposals.

### Data Pipeline

```
1. Load event sources from config (env vars)
2. Fetch from all sources in parallel:
   - ICS: Fetch → Parse → Transform (a recurring series stays ONE event)
   - Snapshot: Fetch proposals → Transform to events
3. Merge all events
4. Client-side: Filter by source, then collapse each series to the
   occurrences worth showing within the brushed date range
5. Group by day for display
```

### Event Sources

**ICS Calendar** (`EventSource.ICS`)

- Custom RFC 5545 parser (no external dependency)
- Handles line folding, all-day events, timezones
- Expands RRULE recurrence (DAILY, WEEKLY, MONTHLY, YEARLY)

**Snapshot Proposals** (`EventSource.SNAPSHOT_PROPOSALS`)

- Fetches from Snapshot Hub GraphQL API
- Shows voting period (start → end) as timeline events
- Links directly to proposal on Snapshot
- Auto-enabled when `SNAPSHOT_DELEGATION_SPACE_FILTER` is set

**AI Extracted Events** (`EventSource.AI_EXTRACTED`)

- Uses Anthropic Claude API to extract milestones and deadlines from proposal text
- Client-triggered extraction via button in Timeline UI
- Time window selection (30d/90d/6m/all) to control costs
- File-based caching to avoid re-processing proposals
- Displays with distinct "AI Insights" badge and sparkle icon
- Shows confidence level (high/medium/low) and source proposal link
- Cost-controlled with budget limits (~$0.10 per extraction run)
- Uses Claude Haiku model for efficiency
- Can mark an event as recurring. The model emits a **structured** recurrence
  (`freq`/`interval`/`byDay`/`count`/`until`), never a raw RRULE; `buildRRule`
  turns it into one, so AI and ICS series are the same thing by the time the
  timeline sees them and collapse has a single code path.
- **Recurrence relevance gate** (`lib/ai-extraction/relevance.ts`): a recurring
  event claims a permanent slot on every member's timeline, so it must be worth
  one to the DAO at large. The model labels each cadence's `audience` as
  `community` or `internal`, and internal ones — a council's monthly review, a
  team's weekly sync — are dropped. `audience` defaults to `internal`, so an
  unlabelled cadence fails closed and the timeline stays crisp. One-off events
  are never gated. The filter runs on read in `hydrateEvents`, so it applies to
  cached extractions too and tightening the policy costs nothing to re-extract.
  Dropped events are reported as `ExtractionStats.eventsFiltered`.
- **Public reporting is exempt.** `isPublicReportingObligation` overrides the
  audience label for standing obligations to report to the DAO — transparency
  reports, treasury statements, anything published to the forum. These are the
  most valuable recurring events the timeline carries and the easiest to
  misread, because the body producing them is always a specific one (DIP-43's
  report is described entirely in terms of the Foundation, yet the DAO is who
  it is for). The rule requires a reporting term _and_ a public-recipient term,
  so "the security lead reports privately to the multisig" stays internal. It
  is deliberately an allowlist: a false positive keeps one extra event, a false
  negative loses a report the DAO is owed.
- **Cadence mapping.** RRULE has no quarterly or semi-annual frequency, so the
  prompt maps them onto `MONTHLY` with interval 3 and 6. Without this the model
  reaches for `YEARLY` and a quarterly report renders as annual.

### AI Extraction Pipeline

```
1. User selects time window (30d, 90d, 6m, all)
2. User clicks "Extract Events" button
3. Client filters proposals by selected time window
4. Client → POST /api/ai-extraction with filtered proposals
5. Server checks cache for existing extractions
6. For uncached proposals:
   - Generate extraction prompt with proposal body
   - Call Claude API with Zod schema for structured output
   - Parse dates (absolute or relative to proposal end date)
   - Cache results to .cache/ai-extractions.json
7. Transform AI events → SerializedEvent format
8. Return to client with extraction stats
9. Client merges AI events with regular events
10. Display with filtering support
```

### Key Types

```typescript
interface UnifiedEvent {
  id: string;
  sourceId: string; // For filtering
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  isAllDay: boolean;
  source: EventSource;
  sourceName: string;
  sourceUrl: string | null; // Link to external event
  location: string | null;
  isRecurring: boolean;
  recurrenceId: string | null;
  recurrence: SeriesInfo | null; // The cadence, when this is a series
  metadata: Record<string, unknown>;
}

interface SeriesInfo {
  rrule: string; // RFC 5545 RRULE — the source of truth for the cadence
  summary: string; // "Every 2 weeks on Tue", for the badge
  exceptions: string[]; // Cancelled dates (ICS EXDATE), as YYYY-MM-DD
}

// Set only on an occurrence the collapse step materialised for display.
interface OccurrenceInfo {
  role: 'previous' | 'next';
  siblingDate: string | null;
}
```

### Recurring Events

A recurring series is never materialised into one event per occurrence. It
travels as a single `UnifiedEvent` carrying its `SeriesInfo`, and the timeline
renders **at most two cards per series**: the most recent occurrence and the
next one. A weekly call therefore costs two rows instead of twenty-six, and the
`RecurringBadge` states the cadence so nothing is hidden — only summarised.

**Anchoring.** The split point is today, clamped into the brushed range:

| Brushed range             | Anchor      | Shows                                 |
| ------------------------- | ----------- | ------------------------------------- |
| Spans today (the default) | today       | most recent + next occurrence         |
| Entirely in the future    | range start | the first occurrence(s) in the window |
| Entirely in the past      | range end   | the last occurrence in the window     |

Every card the collapse returns falls inside the brushed range, so the brush
contract holds: what the range says is showing is what shows.

`collapseSeriesInRange` drives the list. The axis and the density histogram use
`collapseSeriesAroundToday` instead — range-independent, so they cannot reshape
while the brush is being dragged. The two agree whenever the range spans today.
The brush header's counts come from the rendered list, so the numbers never
contradict the cards.

**Occurrence engine** (`logic/recurrence-expander.ts`) is a query API, not an
expander: `occurrencesBetween`, `previousOccurrence`, `nextOccurrence`, plus
`buildRRule` / `describeRecurrence` / `buildSeriesInfo`. It honours `FREQ`,
`INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` (including ordinals such as `1MO` /
`-1FR`), `BYMONTHDAY` and `BYMONTH`, and skips `EXDATE` cancellations. `COUNT`
is counted from the seed, independently of the query window, so narrowing the
window can never lengthen a series. `RDATE`, `RECURRENCE-ID` and `TZID` remain
unhandled.

### Directory Structure

```
lib/dao-timeline/
├── types.ts                    # UnifiedEvent, EventSource enum
├── config.ts                   # Source registration, colors
├── api/
│   ├── fetch-ics.ts            # ICS fetcher
│   └── event-source-registry.ts # Orchestrates all sources
├── parsers/
│   └── ics-parser.ts           # RFC 5545 parser
├── logic/
│   ├── event-transformer.ts    # Raw → UnifiedEvent
│   ├── recurrence-expander.ts  # RRULE parsing and occurrence queries
│   ├── series-collapse.ts      # Series → its most recent + next occurrence
│   ├── event-aggregator.ts     # Filter, sort, group
│   └── range-brush.ts          # Date-range brush domain/histogram/labels
└── utils/
    ├── date-utils.ts           # Date helpers
    └── ics-utils.ts            # ICS parsing utilities

lib/ai/                             # Shared AI infrastructure
├── config.ts                       # isAIEnabled(), getAnthropicApiKey(), AI_MODEL_CONFIG
└── client.ts                       # createClient(), getModelId(), parseAPIError(),
                                    #   truncateBody(), extractJSONFromResponse()

lib/ai-extraction/                  # AI event extraction (uses lib/ai/)
├── types.ts                        # AI event types, Zod schemas, time window utils
├── config.ts                       # Extraction-specific config + prompt (re-exports from lib/ai/)
├── cache.ts                        # File-based extraction cache
├── extract-events.ts               # Claude API integration
├── transform.ts                    # AI events → UnifiedEvent
├── index.ts                        # Module exports
└── __tests__/

lib/ai-summary/                     # AI proposal summaries (uses lib/ai/)
├── types.ts                        # ProposalSummary, Zod schemas
├── config.ts                       # Summary-specific config + prompt
├── cache.ts                        # File-based summary cache
├── generate-summary.ts             # Claude API integration
├── index.ts                        # Module exports
└── __tests__/

lib/ai-qna/                         # AI proposal Q&A (uses lib/ai/)
├── types.ts                        # ProposalAnswer, Zod schemas
├── config.ts                       # Q&A config, prompt, rate-limit config
├── cache.ts                        # File-based answer cache, keyed proposal + question
├── rate-limit.ts                   # In-memory fixed-window limiter
├── answer-question.ts              # Claude API integration
├── index.ts                        # Module exports
└── __tests__/

lib/dao-governance/
└── vote-search.ts                  # Proposal → SearchItem adapter, snippet builder,
                                    #   filterProposalsByQuery() (reuses lib/search scorer)

lib/snapshot/api/
└── fetch-timeline-proposals.ts # Snapshot proposals fetcher
```

### Environment Variables

```bash
# ICS Calendar (optional)
DAO_CALENDAR_ICS_URL=https://calendar.example.com/dao.ics

# Snapshot Proposals (uses existing delegation space)
SNAPSHOT_DELEGATION_SPACE_FILTER=mainnet.ssvnetwork.eth
# Or override with:
SNAPSHOT_TIMELINE_SPACE_ID=mainnet.ssvnetwork.eth

# AI Extraction (optional)
ANTHROPIC_API_KEY=sk-ant-...           # Anthropic API key
AI_EXTRACTION_ENABLED=true             # Enable AI extraction feature
AI_EXTRACTION_MAX_BUDGET=1.00          # Max USD per extraction run
AI_EXTRACTION_MODEL=haiku              # Model: haiku, sonnet, or opus
```

### UI Components

- **Timeline.tsx** (client) - Filter state, event grouping, AI extraction state
- **TimelineFilterControls.tsx** (client) - Source filter
- **TimelineRangeBrush.tsx** (client) - Two-handle date range brush over an event histogram
- **TimelineView.tsx** (client) - Day groups with headers
- **EventCard.tsx** - Event display with time, countdown, title, description, badges, AI source info
- **SourceBadge.tsx** - Color-coded source indicator
- **AIExtractionPanel.tsx** (client) - AI extraction button, progress, stats
- **AISourceBadge.tsx** - Specialized badge with sparkle icon for AI events

### Date Range Brush

The timeline's date filter is a two-handle brush over an event-density
histogram (`TimelineRangeBrush.tsx`, backed by `logic/range-brush.ts`). It
replaced the earlier "Show Past Events" checkbox: the past is a direction on
the axis rather than an on/off toggle.

**Day offsets, not dates.** All brush maths runs in whole-day offsets from
today (`0` = today, negative = past). The control is anchored at "now", so
offsets keep the geometry integer-safe and let presets ("Next 30") be plain
numbers. Conversion happens only at the edges (`toDayOffset` / `fromDayOffset`).

**Domain.** `computeDomain` spans every event, never narrower than 30 days back
and 90 days forward, snapped to whole months. It is derived from _all_ events,
not the source-filtered set, so toggling a source never moves the axis; the
histogram behind the brush does track the source filter.

**Adaptive ticks.** A calendar with years of history would collide dozens of
month labels, so `buildMonthTicks` widens the step to quarters, half-years or
years (aligned to natural boundaries) to stay within `MAX_MONTH_TICKS`.
Year-stepped ticks render as bare years; January carries its year otherwise.

**Initial range.** `resolveInitialRange` prefers the near-term window
(-14…+30). If that window is empty — the live DAO calendar is historical, with
its most recent event weeks in the past — it falls back to the whole domain so
the view never opens on an empty list with no hint of where the events are.

**Emphasis.** Upcoming events carry the card surface; events within
`IMMINENT_DAYS` get a `badge-sm-primary` countdown, others a muted relative
label. Past events keep their content but lose the card surface (transparent
border, 55% opacity) and their "Add to calendar" action, so upcoming events
read as the foreground of the list.

**Interaction.** Drag an edge to resize, drag the middle to pan, arrow keys to
nudge (shift steps a week). Both handles are `role="slider"` with
`aria-valuetext` carrying the readable date. Pointer drag uses pointer capture
on the strip, so a drag that leaves the element still tracks.

---

## Governance Votes Module ("Votes at a Glance")

A consolidated, read-only view of every active and upcoming SSV governance vote
across all five Snapshot spaces. Route: `/governance` (module `dao-governance`).

### Data Pipeline

```
1. getGovernanceSpaces() → the five configured spaces (env-driven, single list)
2. fetchGovernanceProposals(spaces, { includeClosed }):
   - per space, in parallel: active + pending (+ 20 recent closed) (Promise.allSettled)
   - tag each proposal with its space; a failing space → failedSpaces[]
   - sort active → pending → closed (soonest end / start; closed newest first)
3. Pass { proposals, failedSpaces } + spaces + AI flag to GovernanceView (client)
4. Client: multi-select space + status filters (URL-synced), group + render cards
```

The home page (`app/page.tsx`) reuses `fetchGovernanceProposals(undefined,
{ includeClosed: false })` to surface active + pending votes across all spaces
(incl. committees) at the top of the landing page; closed votes are exclusive to
`/governance`.

### Filtering, States & Outcomes

Two **single-select**, URL-synced filters:

- **Status** — `StatusFilter` segmented control (All / Active / Upcoming / Past), `?status=`.
- **Space** — `FilterChips` single-select chips with color dots (All spaces, or one
  of DAO / Leads / Operators / Grants / Multisig), `?space=`.

Both default to "all" and omit their param at that default for clean links.
Closed proposals render via `ClosedVoteCard` with an outcome badge derived by
`getProposalOutcome()` (`lib/dao-governance/outcome.ts`): Passed / Failed /
Quorum not met, or the winning option for non-binary ballots. The **"Vote Now"**
CTA shows only for the token-weighted DAO space; member-vote committee spaces
show **"View Proposal"** (whitelist-only voters).

### Per-Space Visual Language

`getSpaceStyle()` (`lib/dao-governance/space-style.ts`) maps each space key to one
semantic color, applied consistently as the card **badge**, the card **left
accent stripe** (`border-l-4`), and the filter **chip dot** — so a space is
recognizable at a glance. Uses existing tokens only (DAO=primary, Leads=secondary,
Operators=accent, Grants=warning, Multisig=muted). The Main space is labelled **"DAO"**.

### Cross-Space Fetch & Error Granularity

The per-feature fetchers (`fetchActiveProposals` / `fetchPendingProposals`)
swallow errors and return `[]` for graceful degradation. To distinguish an
outage from an empty space (PRD P0-7), both now delegate to a shared
`executeProposalsQuery()` helper (`lib/snapshot/api/execute-proposals-query.ts`)
that **throws** on failure. The governance orchestrator calls that helper per
space via `Promise.allSettled`, so one bad space is reported in `failedSpaces`
while the others still render. The existing fetchers keep their graceful
behavior and tests unchanged.

### Vote-Type Distinction

`GovernanceSpace.voteType` (`token` | `member`) drives display: the Main space
shows quorum progress (token-weighted); committee spaces show **"No quorum"**.
`SpaceBadge` maps each space to a distinct semantic badge color (no new colors).

### Files

- `lib/snapshot/config.ts` — `getGovernanceSpaces()` (single source of truth)
- `lib/snapshot/types.ts` — `GovernanceSpace`, `GovernanceProposal`, `GovernanceProposalsResult`
- `lib/snapshot/api/execute-proposals-query.ts` — throwing query executor (shared)
- `lib/snapshot/api/fetch-closed-proposals.ts` — full-field closed proposals fetcher
- `lib/snapshot/api/fetch-governance-proposals.ts` — cross-space orchestrator (`includeClosed` option)
- `lib/snapshot/utils/time-remaining.ts` — `formatTimeAgo()` for closed cards
- `lib/dao-governance/outcome.ts` — `getProposalOutcome()` (Passed/Failed/Quorum-not-met)
- `lib/dao-governance/space-style.ts` — `getSpaceStyle()` (per-space badge/stripe/dot color)
- `app/governance/page.tsx` + `loading.tsx` — route + skeleton
- `components/dao-governance/GovernanceView.tsx` — client view (space + status filters, grouping, states)
- `components/dao-governance/StatusFilter.tsx` — status segmented control
- `components/dao-governance/FilterChips.tsx` — single-select space chips, `SpaceBadge.tsx`, `ClosedVoteCard.tsx`
- `components/ActiveVoteCard.tsx` / `PendingVoteCard.tsx` — optional `space` prop (badge + quorum + Vote Now gating); `isQnaAvailable` gates the Ask button
- `app/page.tsx`, `components/ActiveVotes.tsx` / `PendingVotes.tsx` — home page aggregates all spaces

### Environment Variables

```bash
# Reuses the main + committee space env vars; adds the Leads committee space:
SNAPSHOT_DELEGATION_SPACE_FILTER=mainnet.ssvnetwork.eth  # Main (token-weighted)
SNAPSHOT_LEADS_SPACE_ID=                                 # Leads committee (new)
SNAPSHOT_OPERATOR_SPACE_ID=                              # OC
SNAPSHOT_GRANTS_SPACE_ID=                                # GC
SNAPSHOT_MULTISIG_SPACE_ID=                              # MSIG
```

Reuses the existing AI TL;dr service (`/api/ai-summary`) for per-proposal summaries.

### Proposal Q&A

Beside the TL;DR button, each vote card carries an **"Ask"** pill opening a modal dialog
where a member asks a single question about that proposal. One question in, one answer
out — asking again replaces the previous answer rather than building a thread.

**Flow:**

1. User clicks "Ask" on any vote card → `AskProposalDialog` opens (portal modal).
2. Client POSTs `{ proposalId, question }` to `/api/proposal-qna`.
3. Route validates the body, then rate-limits per client (fixed window, default 10 per
   10 min) — free-form user input makes this endpoint a cost vector that `/api/ai-summary`
   is not.
4. Route resolves the proposal **server-side** from `fetchGovernanceProposals()`. It
   deliberately does not accept proposal text from the client, which would let the
   endpoint act as a general-purpose LLM proxy. Unknown id → 404.
5. `lib/ai-qna/` checks the file cache (`.cache/ai-qna.json`, keyed by proposal +
   normalized-question hash), else calls Claude via the shared `lib/ai/` client.
6. Returns `ProposalAnswer` — `answer`, `answered`, and up to 3 `supportingQuotes`.

**Grounding:** answers use the proposal's title, body and choices only — never live
scores, quorum or dates. The prompt instructs the model to set `answered: false` and say
so when a question needs information the text doesn't hold, which the dialog renders as a
distinct "not covered" notice instead of a guess. Because the context is static, answers
don't go stale and share the summaries' plain 7-day TTL.

**Untrusted input:** the question is fenced in explicit delimiters and the model is told
to treat instructions inside it as text to report, not obey. Responses are Zod-validated
and rendered as plain text (never `dangerouslySetInnerHTML`).

### Vote search

Text search across every aggregated proposal, on two surfaces sharing one scorer:

- **Page search bar** — debounced (300 ms) input on `/governance`, synced to `?q=`
  alongside the existing `?space=` / `?status=` params, with a "N of M votes match" count.
- **Global Ctrl+K palette** — a "Votes" group in `SearchPalette`, lazily fetching
  `/api/vote-index` on first open. The palette lives in the client-side `Header`, so
  awaiting the aggregator in the root layout would put a cache miss on every page's
  critical path. A failed fetch degrades to modules + tools.

`lib/dao-governance/vote-search.ts` adapts proposals onto the shared `SearchItem` shape
so both surfaces rank identically off `lib/search/index.ts` rather than growing a second
matching implementation. Selecting a vote in the palette routes to `/governance?ask=<id>`,
which opens that proposal's Ask dialog directly — the path from "find a proposal" to "ask
a question". The `?ask=` target resolves against the _unfiltered_ list, so a deep link
works regardless of the active space/status/search filters.

> **Scorer note:** `searchItems` previously separated direct-substring from
> subsequence-only matches with a `score >= 1000` threshold. Proposal snippets are long
> enough that a genuine substring hit deep in the text scores below 1000, so valid results
> were dropped. The tier boundary is now `> SUBSEQUENCE_SCORE`, which is what the
> threshold was always standing in for.

**Files:**

- `lib/ai-qna/` — Q&A module (types, config/prompt, cache, rate-limit, answer-question)
- `app/api/proposal-qna/route.ts` — POST endpoint + GET availability probe
- `app/api/vote-index/route.ts` — GET slim vote index for the palette
- `lib/dao-governance/vote-search.ts` — proposal → `SearchItem` adapter + query filter
- `components/dao-governance/AskProposalDialog.tsx` / `AskButton.tsx` — Q&A UI
- `components/dao-governance/VoteSearchInput.tsx` — debounced page search bar
- `components/SearchPalette.tsx` — Votes group + lazy index fetch

---

## Testing Strategy

- **Unit tests** (`__tests__/`): Pure functions, business logic
- **Component tests**: React Testing Library for UI behavior
- **E2E tests** (`e2e/`): Critical user flows with Playwright

Run: `npm test` (unit), `npm run test:e2e` (E2E)

---

## Development Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run type-check # TypeScript check
```

---

## Key Conventions

1. **Styling:** Tailwind utility classes only, semantic color tokens
2. **Types:** Strict TypeScript, no `any`
3. **State:** Local state + props drilling; Context only for global state (theme)
4. **Caching:** 5-min revalidation for external API fetches
5. **Error handling:** Fail-fast for critical data, graceful degradation for optional features
6. **Testing:** Mock external data via dependency injection

---

_Last Updated: 2026-06-29_
