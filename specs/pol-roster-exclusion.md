# Spec: Pol roster exclusion (policy layer)

## Purpose

Define POWERBACK policy for politicians who must not receive **new** Celebrations and must not appear on **user-selectable** rosters, independent of FEC competitive-race logic (`has_stakes`).

## Internal Policy

POWERBACK may exclude a politician from user-selectable rosters and from receiving new Celebrations when eligibility creates a procedural, data integrity, compliance, or operational safety concern.

This policy is separate from `has_stakes`. `has_stakes` reflects whether POWERBACK has identified a qualifying active challenger through public FEC-derived race data. Roster exclusion reflects POWERBACK policy and must use dedicated `roster_exclusion_*` fields.

Exclusion is not ideological and should not be treated as an endorsement, punishment, or judgment about any politician.

The Speaker of the House is excluded because the Speaker has unusual procedural control over whether House votes occur. Members who have left office, resigned, died, are non-voting delegates where the condition is inapplicable, or are under data review may also be excluded.

Excluded members must not appear in user-selectable rosters and must be rejected server-side before any Celebration, checkout, payment intent, or other non-idempotent payment-related side effect occurs.

## Scope

- In-scope: `Pol` schema fields, roster API filtering, celebration creation gate, payment-intent gate, client error surfacing, relationship to watchers.
- Out-of-scope: Changing how `has_stakes` is computed; mutating `fec_candidate_id` for exclusion; full payment flow refactors.

## Requirements

1. **Separation**: `has_stakes` remains watcher-derived (OpenFEC / job pipeline). Policy exclusion uses dedicated fields on `Pol`, not `has_stakes` toggles.
2. **Storage** (Mongo `Pol` documents):
   - `roster_excluded` (Boolean, default false)
   - `roster_exclusion_reason` (String)
   - `roster_exclusion_category` (String; see allowed values in code: `ROSTER_EXCLUSION_CATEGORIES` in `services/congress/polRosterEligibility.js`)
   - `roster_exclusion_updated_at` (Date)
3. **Selectable roster**: `GET /api/congress` returns only politicians who have `has_stakes: true` **and** `roster_excluded` is not true (query uses `roster_excluded: { $ne: true }` so missing field counts as selectable).
4. **New celebrations**: Before persistence and non-idempotent side effects, server rejects requests whose `pol_id` (bioguide) maps to `roster_excluded: true`.
5. **Payment intent**: Before Stripe payment intent creation, same rejection as (4).
6. **Payment stakes check**: `vest` (used on the celebration payment path) requires `has_stakes: true` **and** `roster_excluded: { $ne: true }`.
7. **User-facing errors**: HTTP `400` with `code: POL_ROSTER_EXCLUDED` and a plain-language `message` (single constant in `polRosterEligibility.js`). Client (`usePaymentProcessing`) maps this to rejection reasons instead of a raw axios error where applicable.

## Allowed exclusion categories and labels

| Category                 | User-facing label              | Notes                                                                                 |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------------- |
| `speaker_of_house`       | Speaker of the House           | Procedural safeguard because the Speaker has control over whether House votes happen. |
| `left_office`            | No longer in office            | Member is no longer serving in the relevant office.                                   |
| `deceased`               | No longer serving              | Avoid showing "deceased" in normal user UI unless needed in admin context.            |
| `resigned`               | Resigned from office           | Member resigned and should not receive new Celebrations.                              |
| `delegate_or_non_voting` | Non-voting delegate            | Use only where non-voting status makes the Celebration condition inapplicable.        |
| `manual_admin_exclusion` | Unavailable by platform review | Manual safety/compliance hold.                                                        |
| `data_integrity_hold`    | Pending data review            | Temporary hold while records are checked.                                             |

## Admin-facing exclusion notes

| Category                 | Admin note                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `speaker_of_house`       | Use when the member is Speaker of the House. This is a procedural safeguard because the Speaker has unusual control over whether House votes occur.                          |
| `left_office`            | Use when the person no longer holds the relevant office and should not receive new Celebrations.                                                                             |
| `deceased`               | Use when the member is deceased. User-facing copy should normally say "No longer serving," not "Deceased."                                                                   |
| `resigned`               | Use when the member resigned from office. This should block new Celebrations but does not automatically modify existing records.                                             |
| `delegate_or_non_voting` | Use when the person is a non-voting delegate and the Celebration condition is not applicable to that role. Do not use this for voting at-large representatives.              |
| `manual_admin_exclusion` | Use for a manual compliance, safety, or operational hold that does not fit another category. Add a clear internal reason in `roster_exclusion_reason`.                       |
| `data_integrity_hold`    | Use as a temporary hold when POWERBACK cannot confidently verify the member, district, FEC ID, office status, or eligibility data. Clear it once the data issue is resolved. |

## Interfaces & code map

| Concern                 | Primary module                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| Constants / lookup      | `services/congress/polRosterEligibility.js`                          |
| Roster list             | `controller/congress/pols.js` (`getPols`)                            |
| Stakes + exclusion gate | `controller/congress/vest.js`                                        |
| Celebration create      | `services/celebration/orchestrationService.js` (`createCelebration`) |
| Payment route           | `routes/api/payments.js` (`POST .../celebrations/:customer_id`)      |
| Schema                  | `models/Pol.js`                                                      |
| Client types            | `client/src/interfaces/pols/HouseMember.ts` (optional fields)        |
| Admin Mongo updates     | `scripts/roster-exclude-pol.js` (interactive TUI; see below)         |

## Operations: roster exclusion script

Operators with DB access can set or clear `roster_excluded` (and `roster_exclusion_*` fields) on a `Pol` document via the **interactive TUI** in `scripts/roster-exclude-pol.js`. The script uses `inquirer` (lists and confirms); it connects to MongoDB **only after** you confirm an action, so canceling early does not require a valid `MONGODB_URI`.

**Step-by-step usage, environment order, and troubleshooting:** [scripts/USAGE-roster-exclude-pol.md](../scripts/USAGE-roster-exclude-pol.md)

**Entry point (from repo root):** `node scripts/roster-exclude-pol.js` (optional bioguide positional to prefill the first prompt; `node scripts/roster-exclude-pol.js --help` for a short summary).

## Event-triggered eligibility communications

POWERBACK may notify affected users when a politician’s eligibility or visibility changes in a way that affects new Celebrations.

These communications must distinguish between:

1. `has_stakes` changes  
   Race-status changes derived from public FEC data, such as no longer detecting a qualifying active challenger.

2. `roster_excluded` changes  
   Platform-policy changes, such as Speaker exclusion, left office, resignation, death, manual exclusion, or data integrity hold.

These emails should be neutral status updates. They must not imply that POWERBACK is judging the politician, resolving an existing Celebration, or changing previously accepted Celebration rules unless a separate resolution process actually applies.

Default safety line:

> This affects new Celebrations only. Any existing Celebration continues to follow the rules shown when it was confirmed unless POWERBACK sends a separate resolution notice.

## Invariants

- Watchers may continue to set `has_stakes` globally; they must not be required to implement policy exclusions.
- Existing `Celebration` documents for a later-excluded Pol are not retroactively modified by this spec (separate jobs / defunct flows may apply).
- Escrow aggregation for webhooks (`getEscrowedTotalsByPol`) still filters joined `Pol` by `has_stakes`; that is distinct from selectable roster (document if behavior changes).

## Acceptance checks

- With `roster_excluded: true` on a bioguide: absent from `GET /api/congress` roster; `POST /api/celebrations` returns 400 + `POL_ROSTER_EXCLUDED`; `POST /api/payments/celebrations/:customerId` returns 400 before Stripe; UI shows friendly copy when those endpoints return the contract above.
- With field missing or false: behaves as not excluded for roster query (`$ne: true`).

## Links

- Script usage: `scripts/USAGE-roster-exclude-pol.md`, `scripts/README.md` (root scripts list)
- Docs: `docs/API.md` (Congress + Celebrations + Payments), `docs/payment-processing.md`, `docs/background-jobs.md`, `docs/hooks.md`
- Cursor: `.cursor/rules/42-pol-roster-exclusion.mdc`, `.cursor/rules/12-models.mdc` (Pol bullet)
