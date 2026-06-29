<!--
Thanks for contributing to DAOx! If you're adding an external tool, please use
the checklist below. For other changes, feel free to delete it and describe your
change instead.
-->

## What does this PR do?

<!-- One or two sentences. -->

## Adding an external tool? Checklist

- [ ] One tool per PR — added a single `data/external-tools/<id>.json` file
- [ ] `id` is lower-case kebab-case and the **filename matches** the id (`<id>.json`)
- [ ] Filled in `name`, `description`, `categories`, `inputs`, `outputs`, and `url`
- [ ] `url` points to the tool's **real, official** page (no look-alike domains)
- [ ] Chose appropriate `categories` (Simulator / Calculator / Dashboard / Explorer / Claim)
- [ ] Left `featured` unset (maintainers decide what gets featured)
- [ ] Ran `npm run gen:tools` and committed the updated `lib/data/external-tools.generated.ts`
- [ ] `npm test` passes locally

<!--
New to the repo? See CONTRIBUTING.md for a step-by-step guide.
You can ask the bot for help or a pre-review by commenting: @claude please review
-->
