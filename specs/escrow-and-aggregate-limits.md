### Spec: Escrow Pledges and Aggregate Limits

#### Purpose

Define how Celebrations (pledges) function as escrowed funds and how they count toward legal limits, with emphasis on compliant-tier per‑candidate per‑election limits and consistent frontend guidance.

#### Scope

- In-scope: Definition of escrow commitment, counting rules, UI gating/UX copy requirements, compliant vs lower-tier aggregation expectations, reset alignment with backend.
- Out-of-scope: Payment processor details, DB schema, migrations.

#### Requirements

- Escrow commitment
  - A Celebration immediately moves funds out of user control to POWERBACK.us (the conduit) and is earmarked for execution under the user's instruction.
  - Unresolved/pending Celebrations must count toward the applicable cap the same as resolved ones. Defunct/paused do not count.
- Compliant tier (highest)
  - Per‑candidate per‑election limit; legal amount from backend constants (currently $3,500).
  - Remaining limit = per‑election cap − sum of all non‑defunct/non‑paused Celebrations to this candidate in the active election cycle (including unresolved).
  - Resets on election boundaries as defined server‑side (Eastern Time; server snapshot authoritative).
- Lower tiers
  - Per‑donation ceiling + annual cap across all candidates (guest tier); resets at year boundary (Eastern Time).
- Frontend behavior
  - Suggested amounts and max input must never exceed the remaining limit derived above.
  - If a user exceeds the limit, clamp to remaining and display the limit modal with clear guidance.
  - Donation UI and tooltips must explain escrow: "pledges count immediately toward your cap."
- Backend authority
  - Server is authoritative. If validation cannot be ensured (missing dates, etc.), server may reject; client must surface responses.

#### Inputs / Outputs

- Inputs: user donations (including unresolved), compliance tier, election cycle context (state/pols), backend constants, server election snapshots.
- Outputs: effective limit, remaining limit, reset dates (as surfaced), and user‑facing guidance.

#### Logic & Invariants

- Count non‑defunct/non‑paused Celebrations toward caps regardless of resolved state.
- Compliant tier: aggregate per candidate in the active cycle; do not use aggregate across all candidates.
- Timezone: Eastern Time for resets; election boundaries come from server snapshot/statutory rules.

#### Acceptance Checks

- Given a compliant-tier user with a prior $1,000 Celebration to Candidate A in the current election cycle, the UI's max suggestion for Candidate A is $2,500 (not $3,500).
- The same user can donate up to $3,500 to Candidate B in the same election cycle.
- Attempting to enter more than the remaining limit clamps to remaining and opens the limit modal.
- Lower tiers display per‑donation ceilings and honor annual caps across all candidates.

#### Copy Registry

- UX strings and tooltips are centralized in domain-specific registries under `client/src/constants/copy/`
- Celebrate flow: `celebrate.ts` (DonationPrompt, DonationInput, LimitModal, Payment, TipAsk, PolCarousel)
- Other flows: `splash.ts`, `search.ts`, `account.ts`
- Components import from the registry instead of hardcoding strings
- Parametric functions handle dynamic values (remaining limits, amounts)
- Legacy constants moved from `constants.js` are marked with comments
- See `.cursor/rules/26-copy-registry.mdc` for enforcement

#### PAC Limit Integration

- **Separate System**: PAC limits ($5,000 annual) are independent of compliance tiers
- **Tip Contributions**: Tips to POWERBACK.us count toward PAC limit
- **Escrow Counting**: PAC contributions count toward limit regardless of celebration status
- **Reset Logic**: PAC limits reset annually (January 1st), not on election cycles

#### Links

- See: specs/backend-compliance.md, specs/pac-limit-system.md, client hooks under `client/src/hooks/compliance/`, Donation UI under `client/src/contexts/DonationStateContext.tsx` and `client/src/pages/Celebrate/`.
