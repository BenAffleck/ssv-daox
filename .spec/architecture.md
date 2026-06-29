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
│   │   └── ai-summary/       # AI summary endpoint
│   │       └── route.ts      # POST /api/ai-summary
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
│   │   └── *Badge.tsx            # Server: badge components
│   └── dao-timeline/         # DAO Timeline components
│       ├── Timeline.tsx          # Client: main container + AI state
│       ├── TimelineFilterControls.tsx
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
│   │   ├── config.ts         # Program configuration
│   │   ├── api/              # Data fetching
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
- **Karma API** - Delegate CSV data (5-min cache)
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

**Files:**
- `lib/data/external-tools.ts` — tool registry and `getExternalToolsSorted()` (featured-first, then `sortOrder` ascending)
- `components/ExternalToolsSection.tsx` — client component with filter state, list rows, submit footer

**Category → badge mapping (semantic tonal tints, no new colors):**
- `Simulator` → `badge-sm-secondary` (purple)
- `Calculator` → `badge-sm-primary` (blue)
- `Dashboard` → `badge-sm-accent` (green)
- `Explorer` → `badge-sm-warning` (orange)
- `Claim` → `badge-sm-danger` (red)

The "Featured" pill uses solid `bg-primary text-white` to read as a callout rather than a category.

**Adding an external tool:**
1. Add entry to `lib/data/external-tools.ts`
2. Provide all required fields including `categories` (one or more), `inputs`, `outputs`, `host`, and `sortOrder`
3. Set `featured: true` to pin the tool to the top of the list

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

The primary implemented module. Shows a ranked delegate leaderboard with eligibility and program assignment.

### Data Pipeline

```
1. Fetch CSV from Karma API
2. Fetch committee members from Snapshot (parallel)
3. Fetch delegation recipients from The Graph (parallel)
4. Fetch vote participation from Snapshot (parallel)
5. Build eligibility Sets (O(1) lookups)
6. Transform CSV → Delegate objects (inject participation rates)
7. Calculate ranks by karma score
8. Run three-phase program assignment
9. Pass to client for filtering/sorting
```

### Three-Phase Program Assignment

1. **Pre-phase:** Skip withdrawn delegates
2. **Phase 1:** Fixed list delegates get all programs (bypass limits)
3. **Phase 2:** Competitive allocation for eligible + complete profile delegates

Configuration in `lib/dao-delegates/config.ts`.

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
   - ICS: Fetch → Parse → Transform → Expand recurrence
   - Snapshot: Fetch proposals → Transform to events
3. Merge all events
4. Client-side: Filter by source, toggle past events
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
  sourceId: string;           // For filtering
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  isAllDay: boolean;
  source: EventSource;
  sourceName: string;
  sourceUrl: string | null;   // Link to external event
  location: string | null;
  isRecurring: boolean;
  metadata: Record<string, unknown>;
}
```

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
│   ├── recurrence-expander.ts  # RRULE expansion
│   └── event-aggregator.ts     # Filter, sort, group
└── utils/
    ├── date-utils.ts           # Date helpers
    └── ics-utils.ts            # ICS parsing utilities

lib/ai/                             # Shared AI infrastructure
├── config.ts                       # isAIEnabled(), getAnthropicApiKey(), AI_MODEL_CONFIG
└── client.ts                       # createClient(), getModelId(), parseAPIError(), truncateBody()

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
- **TimelineFilterControls.tsx** (client) - Source filter, past events toggle
- **TimelineView.tsx** (client) - Day groups with headers
- **EventCard.tsx** - Event display with time, title, description, badges, AI source info
- **SourceBadge.tsx** - Color-coded source indicator
- **AIExtractionPanel.tsx** (client) - AI extraction button, progress, stats
- **AISourceBadge.tsx** - Specialized badge with sparkle icon for AI events

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
- `components/ActiveVoteCard.tsx` / `PendingVoteCard.tsx` — optional `space` prop (badge + quorum + Vote Now gating)
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

*Last Updated: 2026-06-29*
