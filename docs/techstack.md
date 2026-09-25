# DAOx Tech Stack Recommendation

## Philosophy

**Simple. Typed. Proven.**

Minimize moving parts while maximizing developer experience and production reliability.

---

## Recommended Stack

### Frontend

| Layer     | Choice           | Rationale                           |
| --------- | ---------------- | ----------------------------------- |
| Framework | **Next.js 14+**  | SSR, API routes, file-based routing |
| Language  | **TypeScript**   | Type safety across entire stack     |
| Styling   | **Tailwind CSS** | Utility-first, zero runtime cost    |

### Infrastructure

| Layer         | Choice                        | Rationale                                                                  |
| ------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Hosting       | **Vercel**                    | Zero-config Next.js deployment                                             |
| CI            | **GitHub Actions**            | Lint + tests + catalog-sync check on every PR (`.github/workflows/ci.yml`) |
| PR automation | **Claude Code GitHub Action** | Auto-reviews community tool PRs and answers `@claude` mentions             |

### Data validation & tooling

| Concern            | Choice                     | Rationale                                                                                                                                                                                  |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema validation  | **Zod**                    | Single source of truth for community-contributed external-tool JSON (`lib/external-tool.schema.ts`); generator fails fast on invalid input. JSON Schema mirror gives editors autocomplete. |
| Build-time codegen | **tsx**                    | Runs the TypeScript generator (`scripts/gen-external-tools.ts`) that turns `data/external-tools/*.json` into a typed array on `predev` / `prebuild`.                                       |
| Linting            | **ESLint 9 (flat config)** | `eslint.config.mjs` consumes Next 16's flat `core-web-vitals` config (replaces the removed `next lint` + legacy `.eslintrc.json`).                                                         |

### External data

| Source          | Choice                     | Rationale                                                                                                                         |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Delegate scores | **SSV Delegate Score API** | Replaces the retired Karma API. Read-only JSON with an OpenAPI contract, daily runs, cohort allocation, cached 5 min via `fetch`. |

### Wallet (Delegation module)

| Concern         | Choice                      | Rationale                                                                                                                                                                                |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ethereum client | **viem**                    | Typed, tree-shakeable. Covers ENS, EIP-712 signing and `verifyTypedData` with EIP-1271 (Safe) support, which opt-out needs.                                                              |
| React bindings  | **wagmi 2** (+ React Query) | Account state, connectors and contract writes as hooks over viem. Pinned to v2: RainbowKit 2 requires `wagmi@^2`.                                                                        |
| Connect UI      | **RainbowKit 2**            | Maintained connect modal for injected wallets, WalletConnect and Safe. WalletConnect is optional (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`); without it only injected wallets are offered. |
| RPC             | **DAOx proxy (`/api/rpc`)** | Keeps the keyed `MAINNET_RPC_URL` server-side. Forwards only allowlisted read methods; wallets broadcast transactions. No public RPC fallback.                                           |
| Opt-out store   | **JSON files in `.cache/`** | Nonces and the Score API mock need no database: one process, short-lived nonces. Ephemeral on serverless hosts, which the "Demo" mock tolerates.                                         |

### Testing

| Type      | Choice              | Rationale                         |
| --------- | ------------------- | --------------------------------- |
| Unit      | **Vitest**          | Fast, ESM-native, Jest-compatible |
| Component | **Testing Library** | User-centric assertions           |
| E2E       | **Playwright**      | Cross-browser, reliable           |

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
