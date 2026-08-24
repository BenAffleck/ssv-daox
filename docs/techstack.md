# DAOx Tech Stack Recommendation

## Philosophy

**Simple. Typed. Proven.**

Minimize moving parts while maximizing developer experience and production reliability.

---

## Recommended Stack

### Frontend

| Layer          | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Framework      | **Next.js 14+**     | SSR, API routes, file-based routing    |
| Language       | **TypeScript**      | Type safety across entire stack        |
| Styling        | **Tailwind CSS**    | Utility-first, zero runtime cost       |

### Infrastructure

| Layer          | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Hosting        | **Vercel**          | Zero-config Next.js deployment         |
| CI             | **GitHub Actions**  | Lint + tests + catalog-sync check on every PR (`.github/workflows/ci.yml`) |
| PR automation  | **Claude Code GitHub Action** | Auto-reviews community tool PRs and answers `@claude` mentions |

### Data validation & tooling

| Concern        | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Schema validation | **Zod**          | Single source of truth for community-contributed external-tool JSON (`lib/external-tool.schema.ts`); generator fails fast on invalid input. JSON Schema mirror gives editors autocomplete. |
| Build-time codegen | **tsx**         | Runs the TypeScript generator (`scripts/gen-external-tools.ts`) that turns `data/external-tools/*.json` into a typed array on `predev` / `prebuild`. |
| Linting        | **ESLint 9 (flat config)** | `eslint.config.mjs` consumes Next 16's flat `core-web-vitals` config (replaces the removed `next lint` + legacy `.eslintrc.json`). |

### Testing

| Type           | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Unit           | **Vitest**          | Fast, ESM-native, Jest-compatible      |
| Component      | **Testing Library** | User-centric assertions                |
| E2E            | **Playwright**      | Cross-browser, reliable                |

---

## Architecture Fit

```
┌────────────────────────────────────────────────────────┐
│                    Vercel Edge                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Next.js App                                          │
│   ├── /app (pages + layouts)                           │
│   └── /lib (shared utilities)                          │
│                                                        │
├──────────────┬─────────────────┬───────────────────────┤
└──────────────┴─────────────────┴───────────────────────┘
```