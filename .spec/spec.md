# DAOx Technical Specification

## 1. Project Overview

**DAOx** is a modular hub for SSV Network DAO members, providing governance tools and insights through extensible modules.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend (SPA)                │
└─────────────────────────────────────────────────┘
```

### Key Principles

- **Modular:** Each feature is an isolated module
- **Extensible:** Plugin architecture for future modules

---

## 3. Data Schema

### 3.1 Core Entities

#### Module

| Field       | Type     | Description                  |
|-------------|----------|------------------------------|
| id          | UUID     | Primary key                  |
| slug        | String   | URL identifier               |
| name        | String   | Display name                 |
| status      | Enum     | `active`, `coming_soon`      |
| sortOrder   | Integer  | Display order                |

#### ExternalTool

Community-contributed tools shown on the landing page and in the search palette.
Each tool is authored as one JSON file in `data/external-tools/<id>.json`,
validated by a Zod schema (`lib/external-tool.schema.ts`), and assembled at build
time into `lib/data/external-tools.generated.ts` by `scripts/gen-external-tools.ts`.

| Field       | Type     | Description                                            |
|-------------|----------|--------------------------------------------------------|
| id          | String   | Unique kebab-case id; matches the filename             |
| name        | String   | Display name                                           |
| description | String   | One/two-sentence summary                               |
| categories  | Enum[]   | `Simulator`, `Calculator`, `Dashboard`, `Explorer`, `Claim` |
| inputs      | String   | Short formula-style inputs (`A · B`)                   |
| outputs     | String   | Short formula-style outputs                            |
| url         | String   | Official destination URL                               |
| host        | String   | Display host (derived from `url` when omitted)         |
| featured    | Boolean  | Maintainer-only; pins to top with a "Featured" pill    |
| sortOrder   | Number   | Optional ordering hint (featured-first, then sortOrder, then name) |

---

## 4. Core Features

### 4.1 Landing Page

- Display grid of available modules
- Visual distinction for `active` vs `coming_soon` status
- Route to module on click (active only)

### 4.2 DAO Delegates Module

DAO Delegates — a leaderboard displaying active delegates and rotation metrics.

**Filters:**
1. **Rotation Filter** — Visualization of delegation changes over time

### 4.3 Governance Votes Module ("Votes at a Glance")

Consolidates every active and upcoming SSV governance vote across all five
Snapshot spaces (Main token-holder space + Leads / OC / GC / MSIG committee
spaces) into one read-only view, so members do not have to check each Snapshot
space by hand.

**Behavior:**
- Aggregates `active`, `pending`, and recent `closed` proposals (20 most recent
  per space) from all configured spaces. Ordering: active → pending → closed
  (active by soonest deadline, pending by soonest opening, closed newest first).
- Each proposal card shows a **color-coded space badge + left accent stripe**,
  title, vote distribution, voter count, time remaining / "Ended X ago", deep
  link to Snapshot, and an on-demand **AI TL;dr** (reuses `/api/ai-summary`).
  Each space has one consistent color across its badge, accent stripe, and
  filter chip dot, so votes are visually separable per space at a glance.
- **Quorum** is shown for token-weighted spaces (DAO); committee (member-vote)
  spaces show **"No quorum"** rather than a misleading empty value.
- **Closed proposals** carry an outcome badge: **Passed / Failed / Quorum not
  met** (or the winning option for non-binary ballots).
- **"Vote Now"** appears only for the token-weighted DAO space; committee
  spaces are whitelist-only voters and show **"View Proposal"** instead.
- **Two single-select filters**, synced to the URL for shareable views:
  - **Status** — a segmented control (All / Active / Upcoming / Past), `?status=`.
  - **Space** — chips with color dots; "All spaces" or exactly one space
    (DAO / Leads / Operators / Grants / Multisig), `?space=`.
- Distinct loading / empty / error states; a single failing space is reported
  while the others still render.

**Home page:** active + pending votes across all governance spaces (incl.
committees) are surfaced at the top of the landing page with space badges
(closed votes are exclusive to `/governance`).

**Configuration:** the five spaces live in one list (`getGovernanceSpaces()` in
`lib/snapshot/config.ts`) sourced from env vars. Adding/removing a space is a
config-only change. Member counts and notifications remain deferred (P1/P2).

### 4.4 External Tools & Community Contributions

A data-driven catalog of community-built tools (calculators, simulators,
dashboards, explorers, claim UIs), rendered in a filterable list on the landing
page and indexed in the global `Ctrl/⌘+K` search palette. Icons and badges are
auto-selected from each tool's categories — no per-tool UI code.

**Contribution model:** the community grows the catalog via GitHub PRs. Adding a
tool is a single JSON file in `data/external-tools/` — no TypeScript required.
See `CONTRIBUTING.md`.

**Safety & review pipeline:**
- A Zod schema (`lib/external-tool.schema.ts`) + JSON Schema
  (`data/external-tool.schema.json`) validate every entry; the generator
  (`npm run gen:tools`) fails fast on an invalid file.
- CI (`.github/workflows/ci.yml`) checks the generated catalog is in sync, then
  runs lint + unit tests (schema validation, unique ids, valid URLs).
- The Claude GitHub Action auto-reviews tool PRs and answers `@claude` mentions
  (`.github/workflows/claude*.yml`).
- `CODEOWNERS` + branch protection require a passing CI run and maintainer
  approval before merge; `featured` is maintainer-only.