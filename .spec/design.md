# Design System Specification

## 1. Overview & Creative North Star: "The Governance Dashboard"

This design system is built to transform DAO governance data—delegate rankings, vote participation, and timeline events—into a clean, authoritative interface. We call the creative direction **"The Governance Dashboard."**

The objective is an interface that feels trustworthy and precise: the kind of tool DAO participants rely on for decision-making. We achieve this through **Semantic Tonal Layering** (background → card → interactive states) and **SSV Network brand consistency**. We treat the interface as a set of tonal planes—background, card surface, hover—rather than relying on heavy outlines or shadows.

- **The Aesthetic:** Clean, Professional, Trustworthy.
- **The Signature:** SSV Network Blue (`#2DB1FF`) anchors every interactive element—links, active filters, focused inputs, and CTAs—creating a coherent data navigation language. Brand-colored glow shadows (not drop-shadows) signal interactivity.

---

## 2. Colors: Tonal Depth vs. Structural Lines

We employ a "minimal-border" philosophy. Primary structural separation comes from background shifts, not strokes.

### The Palette

Two themes are supported. Tokens always reference semantic names—**never hardcode hex values in components**.

#### Light Theme (default)
- **Base:** `background` (`#f7f7f7`) – Warm off-white page foundation.
- **Surface:** `card` (`#ffffff`) / `card-hover` (`#fafafa`) – Card surfaces and hover states.
- **Borders:** `border` (`#e5e5e5`) – Subtle structural borders; used sparingly.
- **Brand:** `primary` (`#2DB1FF`) – SSV Network Blue; all interactive elements, active states, CTAs.
- **Accent:** `accent` (`#22c55e`) – Positive status (voted, eligible, complete).
- **Secondary:** `secondary` (`#6c588d`) – Purple; secondary actions, community tools.
- **Muted:** `muted` (`#737373`) – Supporting text, metadata labels.
- **Warning:** `warning` (`#d97706`) – Partial status, caution states.
- **Danger:** `danger` (`#dc2626`) – Errors, negative status, missed votes.

#### Dark Theme (`ssvdark`)
- **Base:** `background` (`#0f0f0f`) – Deep near-black page foundation.
- **Surface:** `card` (`#171717`) / `card-hover` (`#1f1f1f`) – Card surfaces and hover states.
- **Borders:** `border` (`#2a2a2a`) – Low-contrast borders for dark environment.
- **Brand:** `primary` (`#2DB1FF`) – Unchanged across themes; SSV blue is always SSV blue.
- **Accent:** `accent` (`#4ADE80`) – Slightly brighter green for dark contrast.
- **Secondary:** `secondary` (`#9B8BB8`) – Lighter purple for dark contrast.
- **Muted:** `muted` (`#a1a1a1`) – Lighter muted text for dark environment.
- **Warning:** `warning` (`#f59e0b`)
- **Danger:** `danger` (`#ef4444`)

### The "Tonal Separation" Rule

**Prefer background shifts over borders for sectioning.** A `bg-card` element on `bg-background` is self-delineating. Only use `border-border` when spatial separation is needed for scannability (e.g., table rows, form inputs, card outlines).

### Glass & Glow Rule

For floating/sticky elements (header, modals), use **glassmorphism**:
- **Pattern:** `bg-background/80 backdrop-blur-md` — as used on the sticky header.
- **Brand Glow:** Use `shadow-glow` or `shadow-glow-lg` CSS variables on interactive cards, buttons, or featured elements to simulate SSV Blue ambient light:
  - `shadow-glow`: `0 0 8px 0 oklch(from #2DB1FF l c h / 0.25)`
  - `shadow-glow-lg`: `0 0 16px 2px oklch(from #2DB1FF l c h / 0.20), 0 0 6px 0 oklch(from #2DB1FF l c h / 0.30)` (stronger in dark theme)
- For gradient sections (e.g., community cards), use `from-secondary/10 to-accent/10` or `from-secondary/5 to-primary/5` — subtle, not dominant.

---

## 3. Typography: The Governance Editorial

We contrast the geometric warmth of **Poppins** with the neutral precision of **Inter**.

- **Headings (Poppins — `font-heading`):** Applied via `@layer base` to all `h1`–`h6`. Tight letter spacing (`-0.025em`) and `line-height: 1.2` for a locked-in, authoritative feel.
  - `h1`: `text-3xl font-bold`
  - `h2`: `text-2xl font-semibold`
  - `h3`: `text-lg font-semibold`
  - `h4`: `text-base font-semibold`
  - `h5`/`h6`: `text-sm font-semibold`
- **Body (Inter — `font-body`):** Default for all prose, form elements, and UI text. Base size `15px`, `line-height: 1.6`, `letter-spacing: -0.01em`.
- **Table / Data (`font-body` tight):** Table text tightened to `13px`, `line-height: 1.4`. All filter controls, buttons, and inline UI use `13px` for density.
- **Metadata Labels:** `text-xs font-semibold uppercase tracking-wide text-muted` — used in table column headers (`.table-col-header`) and info card labels. Creates clear label/value hierarchy.

---

## 4. Elevation & Depth: Tonal Layering

We define depth through tonal stacking, not traditional shadows.

### The Layering Principle

Stack surfaces to communicate hierarchy:
1. **Level 0 (Page):** `bg-background` (`#f7f7f7` light / `#0f0f0f` dark) — The base page surface.
2. **Level 1 (Card):** `bg-card` (`#ffffff` light / `#171717` dark) — Standard cards, tables, data modules.
3. **Level 2 (Interactive):** `bg-card-hover` (`#fafafa` light / `#1f1f1f` dark) — Hover states, active selections.
4. **Level 3 (Inset / Well):** `bg-card/50` with `bg-card` parent — Used for nested info panels (e.g., profile requirement lists inside cards).

### Border Usage

Borders (`border-border`) are allowed for:
- Card outlines: `.card { rounded-lg border border-border bg-card }`
- Form inputs: `border-border` resting, `focus:border-primary` active
- Filter controls: `border-border` resting, `border-primary bg-primary/10` active
- Ghost/secondary buttons: `border-border bg-card`

**Active/selected states use `border-primary`** rather than `border-border` to signal selection with the brand color.

### Ambient Glow (Brand Shadows)

For elements that need elevated presence (featured cards, primary buttons, call-to-action areas):
- Light: `var(--shadow-glow)` for subtle, `var(--shadow-glow-lg)` for strong.
- Dark: Same tokens, higher opacity values auto-applied.

---

## 5. Components

### Buttons

- **Primary:** `bg-secondary px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-secondary/90` — Used for primary external actions (e.g., "Complete Profile on Karma").
- **Secondary (Ghost):** `border border-border bg-card px-4 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-card-hover` — Default internal actions.
- **Active Filter:** `border border-primary bg-primary/10 px-3 py-1.5 text-primary rounded-lg` — `.filter-btn-active` for toggled filter states.

### Cards & Data Modules

Use `.card` (`.rounded-lg border border-border bg-card`) for all module containers, table wrappers, and data panels.

**Row separation in tables:** Use tonal hover (`hover:bg-card-hover`) rather than dividers between rows. No full-opacity `border-b` between table rows.

For community/featured cards: gradient overlay `from-secondary/10 to-accent/10` with `border-secondary/40 hover:border-secondary` and `hover:shadow-secondary/20`.

### Badges

All badges use `.badge` base (`.inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`) with semantic variants:
- `.badge-primary` — `bg-primary/20 text-primary`
- `.badge-accent` — `bg-accent/20 text-accent` (positive/voted)
- `.badge-secondary` — `bg-secondary/20 text-secondary`
- `.badge-muted` — `bg-muted/30 text-muted`
- `.badge-warning` — `bg-warning/20 text-warning`
- `.badge-danger` — `bg-danger/20 text-danger`

Small variant (11px): `.badge-sm-primary`, `.badge-sm-secondary`, `.badge-sm-muted` — used in cards and inline table cells.

### Input Fields

- **Resting:** `border-border bg-card` with `font-body text-foreground placeholder:text-muted/70`
- **Active:** `focus:border-primary focus:ring-1 focus:ring-primary` — brand blue underline on focus, not a full high-contrast box border.
- Class: `.filter-input`

### Filter Controls

- **Label-style toggle:** `.filter-label` — `rounded-lg border border-border bg-card px-3.5 py-2 hover:bg-card-hover cursor-pointer` (13px)
- **Button-style:** `.filter-btn` (resting) / `.filter-btn-active` (selected with primary color)

### Header

Sticky, glassmorphic: `sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md`. Contains the SSV diamond logo SVG (`fill="#2DB1FF"`) and DAOx wordmark in `font-heading`.

### Table Column Headers

`.table-col-header` — `font-heading text-xs font-semibold uppercase tracking-wide text-muted`. Creates a metadata-label tier distinct from data values.

---

## 6. Do's and Don'ts

### Do:
- **Use semantic color tokens exclusively.** Always `text-primary`, `bg-card`, `border-border` — never hardcoded hex values in components.
- **Use brand glow (`shadow-glow`, `shadow-glow-lg`) for interactive callouts.** It ties visual emphasis to the SSV brand color.
- **Use `font-heading` (Poppins) for all `h1`–`h6` and metadata labels.** Use `font-body` (Inter) for all prose and UI copy.
- **Use `primary` for all interactive state indicators:** active filter borders, focus rings, links on hover, active votes CTAs.
- **Use tonal hover transitions for rows.** `hover:bg-card-hover` on table rows for a frictionless scan experience.
- **Use `rounded-lg` as the standard border radius.** Applied consistently to cards, badges (use `rounded-full`), buttons, and inputs.

### Don't:
- **Don't hardcode colors.** Using `#2DB1FF` directly breaks theme support — use `text-primary` / `bg-primary` tokens.
- **Don't use full-opacity divider lines between table rows.** Separate rows with tonal hover and vertical padding (`spacing-4`), not `border-b border-border`.
- **Don't use `rounded-xl` or larger for structural elements.** `rounded-lg` (0.5rem) is the max for cards and containers; `rounded-full` is reserved for badges and avatars only.
- **Don't apply drop-shadows for elevation.** Use tonal layering (`bg-card` on `bg-background`) for depth; use brand glow shadows only for interactive emphasis.
- **Don't invent new color values.** All semantic states (warning, danger, accent, muted) are pre-defined in the token system.
