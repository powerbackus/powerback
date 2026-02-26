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

## build/

- **build-faq.js** – Read `client/src/tuples/faq.js`, write FAQ JSON-LD into `client/public/index.html` and `docs/FAQ.md`. Run by client `prebuild`.
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
