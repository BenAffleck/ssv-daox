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

| Layer         | Choice                        | Rationale                                                                                         |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Hosting       | **Vercel**                    | Zero-config Next.js deployment                                                                    |
| CI            | **GitHub Actions**            | Lint + tests + catalog-sync check on every PR (`.github/workflows/ci.yml`)                        |
| PR automation | **Claude Code GitHub Action** | Auto-reviews community tool PRs and answers `@claude` mentions                                    |
| Toolchain     | **Node 24 (CI), npm 11**      | npm 10 can't resolve the Vercel packages' optional peers against this tree; `engines` enforces it |

### Observability

| Concern        | Choice                                         | Rationale                                                                                                             |
| -------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Page analytics | **Vercel Web Analytics** (`@vercel/analytics`) | Built into the host, cookieless. Custom events (Pro) give the user-flow funnel; one typed catalog in `lib/telemetry`. |
| Performance    | **Vercel Speed Insights**                      | Real-user Core Web Vitals per route, no extra vendor.                                                                 |
| Server errors  | **`instrumentation.ts` `onRequestError`**      | Next's own hook; one JSON log line per failure, searchable in Vercel logs or a log drain. No error SDK.               |

### Data validation & tooling

| Concern            | Choice                     | Rationale                                                                                                                                                                                  |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema validation  | **Zod**                    | Single source of truth for community-contributed external-tool JSON (`lib/external-tool.schema.ts`); generator fails fast on invalid input. JSON Schema mirror gives editors autocomplete. |
| Build-time codegen | **tsx**                    | Runs the TypeScript generator (`scripts/gen-external-tools.ts`) that turns `data/external-tools/*.json` into a typed array on `predev` / `prebuild`.                                       |
| Linting            | **ESLint 9 (flat config)** | `eslint.config.mjs` consumes Next 16's flat `core-web-vitals` config (replaces the removed `next lint` + legacy `.eslintrc.json`).                                                         |

### External data

| Source            | Choice                       | Rationale                                                                                                                                                                                                                                       |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delegate scores   | **SSV Delegate Score API**   | Replaces the retired Karma API. Read-only JSON with an OpenAPI contract, daily runs, cohort allocation, cached 5 min via `fetch`.                                                                                                               |
| Delegate profiles | **Snapshot hub + stamp.fyi** | Name and delegate statement from the Snapshot GraphQL hub DAOx already queries (cached 5 min). Avatars from Snapshot's `cdn.stamp.fyi`, which resolves profile and ENS avatars and falls back to a generated one, so no IPFS gateway is needed. |

### AI features

| Concern         | Choice                               | Rationale                                                                                                                                                               |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model           | **Anthropic Claude** (Haiku default) | Summary, Q&A and timeline extraction. Behind an injected `Llm` port (`lib/ai/llm.ts`), so tests script replies instead of mocking the SDK.                              |
| Proposal text   | **Snapshot hub, proposal by id**     | The server looks proposals up itself and allows only configured spaces, so the endpoints take ids, not text: no LLM proxy, no cache poisoning.                          |
| Cache           | **One JSON file, `ai.json`**         | In `cacheDir()` (`/tmp` on Vercel), via `lib/json-file.ts`. Keys hash the proposal text, so edits invalidate. Per instance; it only saves cost.                         |
| Cost guard rail | **In-memory fixed-window limits**    | Per client and global per feature. Per process, not durable: the global cap bounds spend when client keys are spoofed. A shared store (e.g. Redis) is the upgrade path. |

### Wallet (app-wide)

The providers wrap every page from the root layout, so the header's connect
button works on every module. The cost is the wallet bundle on every page;
it replaced a non-functional "Guest" pill.

| Concern         | Choice                       | Rationale                                                                                                                                                                                                             |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ethereum client | **viem**                     | Typed, tree-shakeable. Covers ENS (name normalization and resolution for the Delegation lookup), EIP-712 signing and `verifyTypedData` with EIP-1271 (Safe) support, which opt-out needs.                             |
| React bindings  | **wagmi 2** (+ React Query)  | Account state, connectors and contract writes as hooks over viem. Pinned to v2: RainbowKit 2 requires `wagmi@^2`.                                                                                                     |
| Connect UI      | **RainbowKit 2**             | Maintained connect modal for injected wallets, WalletConnect and Safe. WalletConnect is optional (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`); without it only injected wallets are offered.                              |
| RPC             | **DAOx proxy (`/api/rpc`)**  | Keeps the keyed `MAINNET_RPC_URL` server-side. Forwards only allowlisted read methods; wallets broadcast transactions. No public RPC fallback.                                                                        |
| Safe signatures | **Safe Transaction Service** | Resumes a Safe opt-out after the tab closed: it holds the co-signers' off-chain message signatures. Called from the server (injected `fetch`, testable, no CORS or client key), mainnet only (`SAFE_TX_SERVICE_URL`). |
| Opt-out store   | **JSON files in `.cache/`**  | Nonces and the Score API mock need no database: one process, short-lived nonces. Ephemeral on serverless hosts, which the "Demo" mock tolerates.                                                                      |

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
