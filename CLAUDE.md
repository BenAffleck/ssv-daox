## General Rules (IMPORTANT!)

- After adding a major feature or technology, ALWAYS update `docs/architecture.md` and `docs/techstack.md`.
- Check types with `npm run type-check` (whole project, tests included; the pre-commit hook and CI run it). Run `tsc` only through that script: on single files it loses the `@/` aliases.

## Key Files

- `docs/architecture.md` - Module layout, data pipelines, per-feature design. Read before adding or changing a module, data source, or API route.
- `docs/techstack.md` - Chosen technologies and their rationale. Read before adding a dependency or build step.
- `DESIGN.md` - Design system: colors, typography, components, do's and don'ts. Read before writing UI.
- `CODING_STANDARDS.md` - Coding standards: Always read before writing any code or comments.

## Testing

- Prefer vertical-slice TDD: one failing test → minimal code to pass → refactor.
- Run the tests after major changes before claiming the work is done.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on `BenAffleck/ssv-daox` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/` (created lazily). See `docs/agents/domain.md`.
