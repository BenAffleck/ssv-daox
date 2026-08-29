---
version: alpha
name: SSV DAOx — The Governance Dashboard
description: >-
  Design system for SSV Network's DAO governance dashboard. Tonal layering over
  structural lines, SSV Network Blue as the single interaction language, and
  data-dense typography built for scanning delegate tables, votes and timelines.
omitted:
  - section: spacing
    reason: "Spacing is Tailwind's default 4px scale; only the non-default values below are documented in prose."
colors:
  # Light theme (default)
  background: '#f7f7f7'
  foreground: '#171717'
  primary: '#2DB1FF'
  secondary: '#6c588d'
  accent: '#22c55e'
  muted: '#737373'
  border: '#e5e5e5'
  card: '#ffffff'
  card-hover: '#fafafa'
  warning: '#d97706'
  danger: '#dc2626'
  # Dark theme (:root[data-theme="ssvdark"])
  dark-background: '#0f0f0f'
  dark-foreground: '#f7f7f7'
  dark-primary: '#2DB1FF'
  dark-secondary: '#9B8BB8'
  dark-accent: '#4ADE80'
  dark-muted: '#a1a1a1'
  dark-border: '#2a2a2a'
  dark-card: '#171717'
  dark-card-hover: '#1f1f1f'
  dark-warning: '#f59e0b'
  dark-danger: '#ef4444'
typography:
  h1:
    fontFamily: Poppins
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h2:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  h3:
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  h4:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  h5:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  label-caps:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.025em
  label-badge:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
  label-badge-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
rounded:
  lg: 8px
  full: 9999px
components:
  button-primary:
    backgroundColor: '{colors.secondary}'
    textColor: '#ffffff'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: 8px
  button-primary-hover:
    backgroundColor: '{colors.secondary}'
  button-ghost:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    padding: 8px
  button-ghost-hover:
    backgroundColor: '{colors.card-hover}'
  filter-btn:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: 6px
  filter-btn-active:
    backgroundColor: '{colors.card}'
    textColor: '{colors.primary}'
  filter-input:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: 10px
  card:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
  card-hover:
    backgroundColor: '{colors.card-hover}'
  badge:
    typography: '{typography.label-badge}'
    rounded: '{rounded.full}'
    padding: 2px
  badge-accent:
    textColor: '{colors.accent}'
    typography: '{typography.label-badge}'
    rounded: '{rounded.full}'
  badge-warning:
    textColor: '{colors.warning}'
    typography: '{typography.label-badge}'
    rounded: '{rounded.full}'
  badge-danger:
    textColor: '{colors.danger}'
    typography: '{typography.label-badge}'
    rounded: '{rounded.full}'
  badge-muted:
    textColor: '{colors.muted}'
    typography: '{typography.label-badge}'
    rounded: '{rounded.full}'
  badge-sm:
    typography: '{typography.label-badge-sm}'
    rounded: '{rounded.full}'
    padding: 2px
  table-col-header:
    textColor: '{colors.muted}'
    typography: '{typography.label-caps}'
  header:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
---

# DESIGN.md — SSV DAOx

## Overview

This design system turns DAO governance data — delegate rankings, vote
participation, timeline events — into a clean, authoritative interface. The
creative direction is **"The Governance Dashboard."**

The objective is an interface that feels trustworthy and precise: the kind of
tool DAO participants rely on for decision-making. It is achieved through
**semantic tonal layering** (background → card → interactive state) and **SSV
Network brand consistency**. The interface is a set of tonal planes, not a
grid of outlined boxes.

- **The aesthetic:** clean, professional, trustworthy; dense rather than airy.
- **The signature:** SSV Network Blue (`#2DB1FF`) anchors every interactive
  element — links, active filters, focused inputs, CTAs — creating one coherent
  data-navigation language. Brand-coloured _glow_ shadows, never drop shadows,
  signal interactivity.

Two themes ship: light (default) and dark (`data-theme="ssvdark"`). Components
reference semantic token names only; hex values never appear in component code.

## Colors

A "minimal-border" palette: primary structural separation comes from background
shifts, not strokes.

- **Background (`#f7f7f7` light / `#0f0f0f` dark):** warm off-white / deep
  near-black page foundation. Level 0 of the tonal stack.
- **Card (`#ffffff` / `#171717`) and Card-hover (`#fafafa` / `#1f1f1f`):**
  content surfaces and their interactive state.
- **Primary — SSV Blue (`#2DB1FF`, unchanged across themes):** every
  interactive element, active state and CTA. SSV blue is always SSV blue.
- **Secondary — Purple (`#6c588d` / `#9B8BB8`):** secondary actions, community
  and external tools.
- **Accent — Green (`#22c55e` / `#4ADE80`):** positive status — voted,
  eligible, complete.
- **Muted (`#737373` / `#a1a1a1`):** supporting text and metadata labels.
- **Warning (`#d97706` / `#f59e0b`):** partial status, caution.
- **Danger (`#dc2626` / `#ef4444`):** errors, negative status, missed votes.
- **Border (`#e5e5e5` / `#2a2a2a`):** subtle structural strokes, used sparingly.

**The tonal separation rule.** Prefer background shifts over borders for
sectioning: a `bg-card` element on `bg-background` is self-delineating. Reach
for `border-border` only where spatial separation aids scanning — card
outlines, form inputs, filter controls. **Active and selected states use
`border-primary`**, not `border-border`, so selection always reads as brand.

## Typography

The geometric warmth of **Poppins** is contrasted with the neutral precision of
**Inter**.

- **Headings (Poppins, `font-heading`):** applied in `@layer base` to all
  `h1`–`h6`. Tight tracking (`-0.025em`) and `line-height: 1.2` give an
  authoritative, locked-in feel. `h1` 30px/bold, `h2` 24px, `h3` 18px, `h4`
  16px, `h5`/`h6` 14px, all semibold.
- **Body (Inter, `font-body`):** the default for prose, form elements and UI
  copy. 15px, `line-height: 1.6`, `letter-spacing: -0.01em`.
- **Data and controls:** table text, filter controls, buttons and inline UI
  drop to 13px with `line-height: 1.4` for density.
- **Metadata labels:** `text-xs font-semibold uppercase tracking-wide
text-muted` in Poppins — table column headers (`.table-col-header`) and info
  card labels. This tier exists to separate labels from values at a glance.

## Layout

A single-column, max-width application shell with a sticky glassmorphic header;
content is composed of full-width `.card` modules stacked vertically.

Spacing follows Tailwind's default 4px scale. Cards use `p-5` for data modules
and `p-4` for list rows; `p-12` for empty states (`.card-empty`). Filter rows
sit directly above the module they filter, separated by `gap-2`/`gap-3`, never
by a rule.

**Emphasis rule (upcoming vs. past).** Where a list mixes past and upcoming
items, the past keeps its content but gives up its surface: swap `.card` for
`rounded-lg border border-transparent p-4 opacity-55`, mute the timestamp, and
drop that row's actions. Imminent items (today/tomorrow) take a
`badge-sm-primary` countdown; later items take a muted relative label. Tonal
demotion — not a coloured left border — is how this system separates them.

## Elevation & Depth

Depth is expressed by tonal stacking, not traditional shadows.

1. **Level 0 — Page:** `bg-background`.
2. **Level 1 — Card:** `bg-card` — cards, tables, data modules.
3. **Level 2 — Interactive:** `bg-card-hover` — hover states, active selections.
4. **Level 3 — Inset / well:** `bg-card/50` inside a `bg-card` parent — nested
   info panels such as profile requirement lists.

**Glass.** Floating and sticky elements (header, modals) use glassmorphism:
`bg-background/80 backdrop-blur-md`.

**Ambient glow.** The only shadows in the system are brand glows, reserved for
interactive emphasis — featured cards, primary buttons, drag handles, CTAs:

- `--shadow-glow`: `0 0 8px 0 oklch(from #2DB1FF l c h / 0.25)`
- `--shadow-glow-lg`: `0 0 16px 2px oklch(from #2DB1FF l c h / 0.20), 0 0 6px 0 oklch(from #2DB1FF l c h / 0.30)`

Dark theme raises both opacities automatically via the same token names.

Gradient sections (community and featured cards) stay subtle:
`from-secondary/10 to-accent/10` or `from-secondary/5 to-primary/5`.

## Shapes

`rounded-lg` (8px) is the standard radius and the maximum for structural
elements — cards, buttons, inputs, filter controls, nav items. `rounded-full`
is reserved for badges and avatars. Nothing in the system uses `rounded-xl` or
larger.

## Components

### Buttons

- **Primary:** `bg-secondary px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-secondary/90` — primary external actions (e.g. "Complete Profile on Karma").
- **Secondary / ghost:** `border border-border bg-card px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-card-hover` — default internal actions.
- **Active filter:** `.filter-btn-active` — `border border-primary bg-primary/10 px-3 py-1.5 text-primary rounded-lg`.

### Cards and data modules

`.card` (`rounded-lg border border-border bg-card`) wraps every module
container, table and data panel. Table rows separate by tonal hover
(`hover:bg-card-hover`) and vertical padding — never by a divider rule.

Community and featured cards add a gradient overlay
`from-secondary/10 to-accent/10` with `border-secondary/40
hover:border-secondary` and `hover:shadow-secondary/20`.

### Badges

`.badge` base (`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs
font-medium`) with semantic variants: `.badge-primary` (`bg-primary/20
text-primary`), `.badge-accent` (positive/voted), `.badge-secondary`,
`.badge-muted`, `.badge-warning`, `.badge-danger`. An 11px small variant exists
for cards and inline table cells: `.badge-sm-primary`, `.badge-sm-secondary`,
`.badge-sm-accent`, `.badge-sm-warning`, `.badge-sm-danger`, `.badge-sm-muted`.

**Recurring-event badge.** A recurring event carries a `.badge-sm-muted` pill
with a lucide `Repeat` icon stating its cadence ("Every 2 weeks on Tue") —
muted because the cadence is metadata about the event, not a status of it. The
timeline shows only a series' most recent and next occurrence, so this badge is
what tells the reader the rest of the series exists; it is the **only** marker
of recurrence. A past occurrence of a series keeps the standard tonal demotion
and gains no colour, stripe or extra tone of its own.

### Input fields

`.filter-input` — resting `border-border bg-card` with `font-body
text-foreground placeholder:text-muted/70`; active `focus:border-primary
focus:ring-1 focus:ring-primary`. Focus is a brand-blue edge, not a
high-contrast box.

### Filter controls

- **Label-style toggle:** `.filter-label` — `rounded-lg border border-border bg-card px-3.5 py-2 hover:bg-card-hover cursor-pointer`, 13px.
- **Button-style:** `.filter-btn` resting, `.filter-btn-active` selected.

### Range brush (timeline date filter)

A two-handle brush over an event-density histogram, the DAO Timeline's date
filter. Lives in a standard `.card` with `p-5`.

- **Track surface:** the strip is `h-16`; the region before "now" sits on
  `bg-muted/5`, with a baseline `h-px bg-border` and a dashed
  `border-l border-dashed border-foreground/60` marking now.
- **Histogram bars:** three semantic tones carry the whole encoding —
  `bg-primary` (in range), `bg-primary/35` (upcoming, outside range),
  `bg-muted/40` (past); empty buckets are a 2px `bg-border` stub. Never add a
  fourth tone without adding it to the legend.
- **Selection:** `bg-primary/10` with `border-y border-primary`.
- **Handles:** `bg-primary` with `shadow-glow`, rising to `shadow-glow-lg`
  while dragged — the same glow-for-interactivity rule as buttons and featured
  cards. Grips are `bg-foreground/50` so they read on brand blue in both themes.
- **Presets:** reuse `.filter-btn` / `.filter-btn-active`; never a bespoke
  button style.
- **Axis labels:** `text-xs text-muted` with a `border-l border-border` tick.

### Header

Sticky and glassmorphic: `sticky top-0 z-50 border-b border-border
bg-background/80 backdrop-blur-md`. Contains the SSV diamond logo SVG
(`fill="#2DB1FF"`) and the DAOx wordmark in `font-heading`.

### Table column headers

`.table-col-header` — `font-heading text-xs font-semibold uppercase
tracking-wide text-muted`, a metadata tier distinct from data values.

## Do's and Don'ts

- **Do use semantic tokens exclusively** — `text-primary`, `bg-card`, `border-border`. Never a hex value in a component.
- **Don't hardcode colors.** Writing `#2DB1FF` directly breaks theme support.
- **Do use brand glow** (`shadow-glow`, `shadow-glow-lg`) for interactive callouts; it ties emphasis to the SSV brand.
- **Don't apply drop shadows for elevation.** Depth comes from tonal layering (`bg-card` on `bg-background`).
- **Do use `font-heading` (Poppins)** for all `h1`–`h6` and metadata labels, and `font-body` (Inter) for prose and UI copy.
- **Do use `primary` for every interactive state indicator:** active filter borders, focus rings, link hover, active-vote CTAs.
- **Do separate table rows with tonal hover** (`hover:bg-card-hover`) and vertical padding.
- **Don't use full-opacity divider lines between table rows** (`border-b border-border`).
- **Do use `rounded-lg` as the standard radius**, and `rounded-full` only for badges and avatars.
- **Don't use `rounded-xl` or larger for structural elements.**
- **Don't invent new color values.** Every semantic state — accent, warning, danger, muted — already exists in the token system.
