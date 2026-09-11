## General Rules (IMPORTANT!)

- After adding a major feature or technology, ALWAYS update `docs/architecture.md` and `docs/techstack.md`.
- Do NOT run `tsc` or `npx tsc` directly on files. The project uses Next.js path aliases (`@/`) and JSX configuration that require the full Next.js build context. Always use `npm run build` to check for TypeScript errors.

## Key Files

- `docs/architecture.md` - Module layout, data pipelines, per-feature design. Read before adding or changing a module, data source, or API route.
- `docs/techstack.md` - Chosen technologies and their rationale. Read before adding a dependency or build step.
- `DESIGN.md` - Design system: colors, typography, components, do's and don'ts. Read before writing UI.
- `CODING_STANDARDS.md` - Coding standards: Always read before writing any code or comments.
