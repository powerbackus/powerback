# Usage: `roster-exclude-pol.js` (roster exclusion TUI)

Interactive terminal UI to set or clear **`Pol.roster_excluded`** (and related fields) in MongoDB by **bioguide ID**. This is the **policy** layer for who may appear on selectable rosters and receive new celebrations—not the same as `has_stakes` watchers.

**Policy reference:** [Pol roster exclusion spec](../specs/pol-roster-exclusion.md)

## Prerequisites

- Run from **project repository root**.
- `MONGODB_URI` must be available when you **confirm** an action (see [Environment](#environment)).
- `inquirer` is a **devDependency**; use a workspace where `npm install` has been run.

## Commands

```bash
node scripts/roster-exclude-pol.js
node scripts/roster-exclude-pol.js J000299
node scripts/roster-exclude-pol.js --help
```

| Invocation                          | Behavior                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| No args                             | Prompts for bioguide ID first.                                                 |
| One positional arg (e.g. `J000299`) | **Prefills** the bioguide ID prompt only; you still choose action and confirm. |
| `--help` or `-h`                    | Prints short usage text and exits (no prompts, no DB).                         |

There are **no** `--category` or `--reason` flags; category and optional reason are chosen in the TUI.

## Environment

Dotenv is loaded in this order (first file that exists wins):

1. `.env.cli` (repo root)
2. else `.env.local`
3. else `.env`

`MONGODB_URI` is read **only after** you complete prompts and confirm. If you cancel at any confirmation, the script exits **without** connecting to MongoDB.

## TUI flow (inquirer)

Use **arrow keys** and **Enter** for lists; type text for bioguide and optional reason; **y** / **n** for confirms (defaults are conservative—often **no**).

1. **Bioguide ID** — e.g. `J000299` (required). Optional CLI arg prefills this field.
2. **Action**
   - **Exclude** — Set `roster_excluded: true`, set category and reason (or default reason from category).
   - **Clear** — Set `roster_excluded: false` and remove category/reason fields.
3. **If Clear** — Confirm clearing exclusion for that ID.
4. **If Exclude** — In order:
   - **Category** — List matches allowed values in `ROSTER_EXCLUSION_CATEGORIES` (`services/congress/polRosterEligibility.js`).
   - **Reason / note** — Optional free text; **Enter** with empty input uses a default label derived from the category.
   - **Final confirm** — Must agree to apply the exclusion.

Canceling at a confirm prints `Cancelled.` and exits with **no** database connection.

## After a successful run

The script logs and prints a short success message. Verify in app behavior per the spec (roster list, celebration create, payment gates).

## Troubleshooting

| Issue                            | What to check                                                            |
| -------------------------------- | ------------------------------------------------------------------------ |
| `No Pol document found for id …` | Bioguide must exist as `Pol.id` in the connected database.               |
| Connection / auth errors         | `MONGODB_URI` in the env file you expect; network/VPN.                   |
| Prompts look broken              | Terminal must support TTY; try a full terminal (not a minimal log pane). |
