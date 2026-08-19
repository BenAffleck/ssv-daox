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

**Voting power breakdown:** Each row's voting power opens a popover detailing total, incoming, outgoing and net delegated power (SSV + cSSV, sourced from the Gnosis Guild Delegation API). It lists the delegating addresses in both directions with the absolute amount each edge carries, and offers a per-list copy icon that copies only the addresses.

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
- **Two single-select filters plus a search box**, all synced to the URL for
  shareable views:
  - **Status** — a segmented control (All / Active / Upcoming / Past), `?status=`.
  - **Space** — chips with color dots; "All spaces" or exactly one space
    (DAO / Leads / Operators / Grants / Multisig), `?space=`.
  - **Search** — free-text over proposal titles, body text and space names,
    `?q=`, debounced 300 ms, showing an "N of M votes match" count. Search
    intersects with the other two filters rather than overriding them.
- Distinct loading / empty / error states; a single failing space is reported
  while the others still render. An empty result explains itself in terms of the
  search when one is active.

**Proposal Q&A:** each card carries an **"Ask"** button (shown only when AI is
configured) opening a dialog where a member asks **a single question** about that
proposal, answered by Claude. Asking again replaces the previous answer — this is
deliberately not a chat thread.
- Answers are grounded in the proposal's **title, body and voting choices only**.
  The model has no access to live tallies, quorum status or dates, and is
  instructed to say so rather than guess; the dialog renders that as a distinct
  "not covered by the proposal text" notice.
- Each answer may carry up to three verbatim excerpts from the proposal, so a
  reader can check it against the source.
- Answers are neutral and explanatory — the feature never recommends how to vote.
- Every answer is labelled AI-generated with a link out to the proposal.
- Repeat questions are served from a shared cache; the endpoint is rate-limited
  per client to bound cost.

**Finding a vote:** proposals are also indexed in the global **Ctrl+K** command
palette under a "Votes" group alongside modules and external tools. Selecting one
opens the governance page with that proposal's Q&A dialog already open, so
"I half-remember a vote about fees" reaches a grounded answer in two steps.

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
### 4.5 DAO Timeline Module

A chronological view of DAO events drawn from multiple sources — the DAO's ICS
calendar, Snapshot governance proposals, and optional AI-extracted milestones —
grouped by day. Route: `/timeline` (module `dao-timeline`).

**Date range filter ("range brush"):**

The timeline's primary control is a two-handle brush over an event-density
histogram. It replaced an earlier "Show Past Events" checkbox — the past is now
a direction on the axis rather than an on/off toggle, so members can look back
over a chosen window instead of all-or-nothing.

- **Axis** — spans every loaded event, never narrower than 30 days back / 90
  days forward, snapped to whole months. Derived from all events rather than
  the source-filtered set, so toggling a source never moves the axis. Month
  labels thin to quarters, half-years or years on a long calendar rather than
  colliding.
- **Histogram** — event density per bucket behind the brush, in three tones:
  in range, upcoming but outside the range, and past. It tracks the source
  filter, so the bars answer "where are this source's events?".
- **Selection** — drag an edge to resize, drag the middle to pan, arrow keys to
  nudge (shift steps a week). Presets: Past 90d / Next 30d / Next 180d /
  Next 12 months / All, each clamped to the axis. The
  header states the range and counts (`"6 upcoming · 3 past"`).
- **Opening range** — the near-term window (-14…+30 days), falling back to the
  whole axis when that window holds no events, so the view never opens empty
  with no hint of where the events are.

**Recurring events:**

A weekly DAO call would otherwise contribute a card for every week it meets,
burying the one-off events the timeline exists to surface. So a recurring
series shows **only its most recent occurrence and its next one**, and carries
a badge stating the cadence ("Every 2 weeks on Tue"). Nothing is hidden — the
series is summarised rather than listed.

- The pair is anchored to today when the brushed range spans today, and to the
  range itself when it does not, so brushing months ahead still shows the
  series where the member is looking. Every card falls inside the range.
- Series are not expandable: the cadence badge and the "Next: Apr 1" /
  "Previous: Mar 4" line on each card convey the rhythm without the list.
- "Add to calendar" on a recurring event exports the whole series (`RRULE` plus
  any `EXDATE` cancellations) under a stable UID, so the member subscribes to
  the cadence rather than to one meeting.
- Works identically for ICS `RRULE` series and AI-extracted events.
- **AI-extracted recurrence is gated on relevance.** A recurring event claims a
  permanent slot on every member's timeline, so it must be worth one to the DAO
  at large — a community call, a governance call, a public reporting deadline.
  Cadences internal to a role, team, council or working group ("Operators sync
  every Tuesday") are dropped rather than shown, and an unlabelled cadence is
  treated as internal. One-off events are never gated. The extraction panel
  reports how many were skipped.
- **Reports the DAO is owed are never filtered.** A standing obligation to
  publish to the community — a transparency report, a treasury statement, a
  public disclosure — is always kept, even though the body producing it is
  always a specific one. DIP-43's quarterly Foundation Transparency Report is
  the reference case: written entirely in terms of the Foundation, but the DAO
  is who receives it.

**Making upcoming events stand out:**
- Events today or tomorrow carry an emphasised countdown badge; those further
  out carry a muted relative label ("in 9 days").
- Past events keep their content but lose the card surface and the "Add to
  calendar" action, and their day headers mute — so upcoming events read as the
  foreground of the list.

**Accessibility:** both brush edges are `role="slider"` with `aria-valuemin`,
`aria-valuemax`, `aria-valuenow` and an `aria-valuetext` carrying the readable
date, fully operable from the keyboard.
