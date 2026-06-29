# Contributing to DAOx

Thanks for helping grow the SSV DAO toolkit! The most common contribution is
**adding an external tool** to the hub. That takes a single JSON file and no
TypeScript knowledge — this guide walks you through it.

For larger code contributions, the general requirements are at the bottom.

---

## Add an external tool

External tools are the community-built calculators, simulators, dashboards,
explorers, and claim UIs shown on the DAOx landing page and in the `Ctrl/⌘+K`
search palette. Each tool is **one JSON file** in
[`data/external-tools/`](data/external-tools).

### 1. Create the file

Add `data/external-tools/<id>.json`, where `<id>` is a short, lower-case,
kebab-case identifier (e.g. `stake-easy`). The **filename must match the `id`**
inside the file.

The easiest start is to copy an existing file in that folder and edit it. A
minimal entry looks like:

```json
{
  "$schema": "../external-tool.schema.json",
  "id": "stake-easy",
  "name": "Stake Easy",
  "description": "SSV cluster advisor — find the best operator cluster for staking your ETH.",
  "categories": ["Explorer", "Simulator"],
  "inputs": "ETH amount · Preferences",
  "outputs": "Cluster recommendations",
  "url": "https://stakeeasy.xyz"
}
```

### 2. Field reference

| Field         | Required | Notes |
| ------------- | -------- | ----- |
| `$schema`     | recommended | Keep `"../external-tool.schema.json"` so your editor autocompletes and validates as you type. |
| `id`          | ✅ | Lower-case kebab-case, unique, matches the filename. Never shown to users. |
| `name`        | ✅ | Display name. |
| `description` | ✅ | One or two sentences: what it does and for whom. |
| `categories`  | ✅ | One or more of: `Simulator`, `Calculator`, `Dashboard`, `Explorer`, `Claim`. Drives the filter and the auto-selected icon. |
| `inputs`      | ✅ | Short, formula-style. Separate segments with ` · ` (e.g. `Staked ETH · Tier`). |
| `outputs`     | ✅ | Short, formula-style (e.g. `SSV/yr · USD`). |
| `url`         | ✅ | The tool's real, official `https://` URL. |
| `host`        | optional | Display host. Derived from `url` automatically — only set it if you want to show a different host (e.g. show `ssvrewards.com` for `https://www.ssvrewards.com/`). |
| `featured`    | maintainer-only | Pins the tool to the top with a "Featured" pill. Leave this out — maintainers decide what gets featured. |
| `sortOrder`   | optional | Ordering hint; lower sorts first. Usually unnecessary. |

You don't need to touch any TypeScript, pick an icon, or wire up search — the UI
is fully data-driven and updates automatically.

### 3. Regenerate, test, and open a PR

```bash
npm install        # first time only
npm run gen:tools  # validates your JSON and rebuilds the catalog
npm test           # confirms everything is valid
```

`npm run gen:tools` regenerates `lib/data/external-tools.generated.ts` from the
JSON files. **Commit that generated file along with your JSON** — CI checks that
it is in sync. (It also runs automatically before `npm run dev` / `npm run build`.)

Then open a pull request. The PR template includes a short checklist. CI will
validate your entry, and the bot will leave an automated review. A maintainer
approves and merges.

> Not comfortable opening a PR? Open a
> [tool suggestion issue](../../issues/new?template=suggest-tool.yml) instead and
> a maintainer can take it from there. You can also ask the bot for help on any
> PR or issue by commenting `@claude`.

---

## Code contributions

For changes beyond a tool entry, all code must pass:

- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — E2E tests (Playwright)
- `npm run build` — production build + TypeScript type-check

Please read `.spec/spec.md`, `.spec/architecture.md`, `.spec/techstack.md`, and
`.spec/design.md` before making substantial changes.
