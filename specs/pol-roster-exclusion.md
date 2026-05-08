# Spec: Pol roster exclusion (policy layer)

## Purpose

Define POWERBACK policy for politicians who must not receive **new** Celebrations and must not appear on **user-selectable** rosters, independent of FEC competitive-race logic (`has_stakes`).

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

## Invariants

- Watchers may continue to set `has_stakes` globally; they must not be required to implement policy exclusions.
- Existing `Celebration` documents for a later-excluded Pol are not retroactively modified by this spec (separate jobs / defunct flows may apply).
- Escrow aggregation for webhooks (`getEscrowedTotalsByPol`) still filters joined `Pol` by `has_stakes`; that is distinct from selectable roster (document if behavior changes).

## Acceptance checks

- With `roster_excluded: true` on a bioguide: absent from `GET /api/congress` roster; `POST /api/celebrations` returns 400 + `POL_ROSTER_EXCLUDED`; `POST /api/payments/celebrations/:customerId` returns 400 before Stripe; UI shows friendly copy when those endpoints return the contract above.
- With field missing or false: behaves as not excluded for roster query (`$ne: true`).

## Links

- Docs: `docs/API.md` (Congress + Celebrations + Payments), `docs/payment-processing.md`, `docs/background-jobs.md`, `docs/hooks.md`
- Cursor: `.cursor/rules/42-pol-roster-exclusion.mdc`, `.cursor/rules/12-models.mdc` (Pol bullet)
