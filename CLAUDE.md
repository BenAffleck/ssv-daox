## Architecture Principles

Each feature is an isolated module with a plugin architecture:
- Active modules are clickable and route to their dedicated pages
- The detailed architecture informations are located in `.spec/architecture.md`

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (also runs type checking)
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run lint` - Run ESLint

**Type Checking:** Do NOT run `tsc` or `npx tsc` directly on files. The project uses Next.js path aliases (`@/`) and JSX configuration that require the full Next.js build context. Always use `npm run build` to check for TypeScript errors.

## Key Files

- `.spec/spec.md` - Complete technical specification
- `.spec/techstack.md` - Technology stack rationale and architecture fit
- `.spec/architecture.md` - Detailed architecture of the project
- `.spec/design.md` - Design system specification (colors, typography, components, do's and don'ts)

## General Rules (IMPORTANT!)

- Always read `.spec/spec.md`, `.spec/architecture.md`, `.spec/techstack.md` and `.spec/design.md` before writing any code.
- Always implement and run unit tests for major features or completed milestones.
- After adding a major feature or completing a milestone, ALWAYS update `.spec/architecture.md` and `.spec/spec.md`. If new technology has been introduced, update `.spec/techstack.md`.
- RFC 2119 keywords for obligations. Commit = imperative subject; body only for a fact the diff cannot show. Comments only where code needs clarification — never narration; Short sentences.