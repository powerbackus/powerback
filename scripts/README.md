# Scripts Directory

Utility and automation scripts for the POWERBACK repo. Run from the **project root** unless noted.

## Layout

| Path                      | Purpose                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Root** (`scripts/*.js`) | One-off and dev utilities: env validation, API route tester, audits, data tools                       |
| **build/**                | Build-time codegen (FAQ, breakpoints CSS). Invoked by client `prebuild` / `prestart`.                 |
| **deploy/**               | Deployment and smoke: `deploy.remote.sh`, `gh-actions-wrapper.sh`, `smoke.sh`                         |
| **tests/**                | Manual/dev test scripts (Stripe, donation limits, email templates, etc.). Not part of the Jest suite. |

## Root scripts

- **clean.js** – Remove build artifacts and caches (root + client). Run via `npm run clean`.
- **validate-environment.js** – Validate environment variables and config. Run via `npm run validate:env` (used by `npm run dev`).
- **api-route-tester.js** – Programmatic API route checks. Used by lifecycle/startup when `START_API_ROUTE_TEST=1`.
- **audit-annotations.js** – Audit JSDoc/TSDoc and similar annotations.
- **devXpub.js** – Generate a test extended public key for Bitcoin (see [Bitcoin Donations](../docs/bitcoin-donations.md)).
- **add-members-to-docking.js** – Stage specific members for docking. See [Docking runbook](../docs/docking-pols-runbook.md).
- **pfp-sync.js** – Download House Clerk JPGs for live `pols` (House, `has_stakes`, not `roster_excluded`), write optimized `{bioguide}.webp` under `PFP_SYNC_OUT_DIR` or `STATIC_PUBLIC_DIR/pfp` or `client/public/pfp`. Flags: `--dry-run`, `--force`, `--strict`. Exported `runPfpSync()` is used by **`jobs/runWatchers.js`** (`pfpSync` step after `challengersWatcher`) when `START_WATCHERS=1`; CLI uses `npm run pfp-sync`. Not GitHub Actions deploy. See [Docking runbook – House headshot files](../docs/docking-pols-runbook.md#house-headshot-files-pfp-webp-sync).
- **roster-exclude-pol.js** – Interactive TUI (`inquirer`: lists and confirms) to set or clear `Pol.roster_excluded` by bioguide ID. Optional first argument prefills bioguide; no `--category` / `--reason` flags. Loads `MONGODB_URI` from `.env.cli` / `.env.local` / `.env` **only after** you confirm—cancel exits without connecting. **Walkthrough:** [USAGE-roster-exclude-pol.md](./USAGE-roster-exclude-pol.md). Policy: [Pol roster exclusion spec](../specs/pol-roster-exclusion.md).
- **cleanup-duplicate-adjacent-roles.js** – Data integrity tool: finds `Pol` docs where `roles[1]` is **deeply** identical to `roles[0]` (lodash `isEqual`). **Dry-run by default** (no writes). **`--apply`** removes only `roles[1]`, leaves `roles[0]` and `roles[2+]` unchanged, and updates **no other fields**. Loads env like other root scripts (`.env.cli` → `.env.local` → `.env`). Guardrails: warns when the duplicate count differs from `--expected-duplicates` (default 148); **`--apply` aborts** if duplicates exceed `--max-apply` (default 220) unless **`--allow-excess`**. **Backup `pols` (or full DB) before `--apply`.** Does **not** change `has_stakes`, roster exclusion, payments, or Celebrations.

  **Verification flow**
  1. `node scripts/cleanup-duplicate-adjacent-roles.js` — note the “deeply identical” count and listed bioguides.
  2. After a DB backup/export: `node scripts/cleanup-duplicate-adjacent-roles.js --apply` (add `--allow-excess` only if the count is above `--max-apply` and you accept the risk).
  3. Run step 1 again; duplicate count should be **0**.
  4. Optionally run your usual watcher smoke (e.g. `challengersWatcher`) and any A5 / Compass diagnostics you use for `roles[0]` vs FEC.

  **Help:** `node scripts/cleanup-duplicate-adjacent-roles.js --help`

## build/

- **build-content.js** – Read `client/src/tuples/faq.js`, write FAQ JSON-LD into `client/public/index.html` and `docs/FAQ.md`. Run by client `prebuild`.
- **build-breakpoints-css.js** – Generate `client/src/breakpoints.css` from `client/src/constants/breakpoints.js`. Run by client `prestart` and `prebuild`.

## deploy/

- **smoke.sh** – Smoke checks: validate env, lint, backend/client tests, build. Run via `npm run smoke` (see [NPM Scripts](../docs/npm-scripts.md)).
- **deploy.remote.sh** – Deploy backend to remote host (branch `beta`). Not run via npm.
- **gh-actions-wrapper.sh** – Wrapper script deployed to the server for use by GitHub Actions.

## tests/

Manual and development test scripts. Run with `node scripts/tests/<name>.js` from project root. These are **not** Jest tests; they exercise services or config locally (e.g. Stripe, donation limits, email templates, donor validation).

| Script                   | Purpose                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| test-stripe-api.js       | Validate server-side Stripe config                                                                         |
| test-stripe-client.js    | Validate client Stripe config                                                                              |
| test-donation-limits.js  | Donation limit / compliance scenarios                                                                      |
| test-donor-validation.js | Donor validation (see [Donor Validation](../docs/donor-validation-comprehensive.md))                       |
| test-email-templates.js  | Render email templates to a given address                                                                  |
| test-hjres54-email.js    | H.J.Res.54 notification email (see [Background jobs](../docs/background-jobs.md))                          |
| socialTest.js            | Send test payloads to the social webhook (see [Social webhooks](../docs/social-announcements-webhooks.md)) |
| (others)                 | Various service/feature sanity checks                                                                      |

**Fixtures**: `scripts/tests/fixtures/` holds test data (e.g. JSON) used by some of these scripts.

**Logs**: `scripts/tests/logs/` may contain run logs; it can be gitignored or committed as needed.

## Related docs

- [NPM Scripts](../docs/npm-scripts.md) – npm commands that invoke these scripts
- [Testing strategy](../specs/testing-strategy.md) – Jest suite and test layout
- [.cursor/rules/11-testing.mdc](../.cursor/rules/11-testing.mdc) – Testing patterns and where tests live
