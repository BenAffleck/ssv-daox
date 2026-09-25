## General Rules (IMPORTANT!)

- After adding a major feature or technology, ALWAYS update `docs/architecture.md` and `docs/techstack.md`.
- Do NOT run `tsc` or `npx tsc` directly on files. The project uses Next.js path aliases (`@/`) and JSX configuration that require the full Next.js build context. Always use `npm run build` to check for TypeScript errors.

## Key Files

- `docs/architecture.md` - Module layout, data pipelines, per-feature design. Read before adding or changing a module, data source, or API route.
- `docs/techstack.md` - Chosen technologies and their rationale. Read before adding a dependency or build step.
- `DESIGN.md` - Design system: colors, typography, components, do's and don'ts. Read before writing UI.
- `CODING_STANDARDS.md` - Coding standards: Always read before writing any code or comments.

## Testing
- Write tests that exercise real code through public interfaces / observable behavior.
- Do not write tests for what the type system already guarantees.
- Do not write tests that merely restate the implementation.
- Do not write tautological tests
- Prefer vertical-slice TDD: one failing test → minimal code to pass → refactor.
- Never mock the unit under test; never test private methods.
- Run the tests after major changes before claiming the work is done.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on `BenAffleck/ssv-daox` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/` (created lazily). See `docs/agents/domain.md`.
