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
│   └── dao-delegates/        # DAO Delegates module
│       └── page.tsx          # Server component (data orchestration)
│
├── components/               # Shared components
│   ├── Header.tsx            # App header
│   ├── ModuleCard.tsx        # Landing page cards
│   └── dao-delegates/        # Module-specific components
│       ├── DelegatesTable.tsx    # Client: filter/sort state
│       ├── FilterControls.tsx    # Client: filter UI
│       ├── TableHeader.tsx       # Client: sortable headers
│       ├── DelegateRow.tsx       # Server: row rendering
│       └── *Badge.tsx            # Server: badge components
│
├── lib/                      # Business logic
│   ├── types.ts              # Core types (Module, ModuleStatus)
│   ├── data/modules.ts       # Module registry
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

### 3. External Data Integration

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

### Vote Participation

Shows each delegate's voting activity across the N most recent closed proposals (configurable via `SNAPSHOT_CONFIG.voteParticipation.proposalCount`, default: 5).

**Data flow:**
1. `fetchProposals()` - Get latest closed proposals from Snapshot Hub
2. `fetchVotes()` - Get all votes for those proposals (paginated, 1000/page)
3. `fetchVoteParticipation()` - Build map: `address → participation %`

**Display:** Color-coded badge with tooltip
- 90-100%: Green (high participation)
- 80-89%: Yellow (medium participation)
- 0-79%: Red (low participation)

Uses the same space ID as delegation (`SNAPSHOT_DELEGATION_SPACE_FILTER`).

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

*Last Updated: 2026-01-27*
