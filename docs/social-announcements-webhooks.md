# Social Announcements Webhooks

## Overview

Watcher jobs send event payloads to an external webhook (e.g. Make.com) to drive automated social posts (Bluesky, Mastodon, Discord, etc.). The app does not post directly; it POSTs a JSON body to a configured URL, and the automation platform formats and publishes.

**Module**: `services/utils/socialPoster.js` (`postToSocial`)

**Environment**: `SOCIAL_WEBHOOK_URL`, `SOCIAL_WEBHOOK_API_KEY` (sent as header `x-make-apikey`)

## Event types

| Event type         | Source job                | When                                                                                          |
| ------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `challengers`      | challengersWatcher        | New serious challenger appears in a district (first time or reappearance).                    |
| `incumbents`       | challengersWatcher        | Incumbent running status changes (e.g. incumbent drops out of the race for a given district). |
| `house_membership` | houseWatcher              | House roster change: member added or removed.                                                 |
| `bill_status`      | checkHJRes54              | H.J.Res.54 bill status or activity changed (status, last action, etc.).                       |
| `election_dates`   | electionDatesUpdater      | Election dates snapshot updated; one or more states had date changes.                         |
| `session_end`      | defunctCelebrationWatcher | Congressional session ended; active Celebrations converted to defunct.                        |
| `celebration`      | orchestrationService      | New Celebration created (donation amount, district, pol, bill; no donor).                     |
| `deploy`           | CI/CD (announce_deploy)   | After successful deploy to production (main); one-line summary + run URL.                     |

## Payload shape

All requests are `POST` with `Content-Type: application/json` and header `x-make-apikey: <SOCIAL_WEBHOOK_API_KEY>`.

**Common fields** (snake_case in JSON):

- `event_type` – One of the event types above.
- `dedupe_key` – Unique per occurrence; automation uses this to avoid duplicate posts (e.g. retries, same run).
- `state` – Two-letter state code when applicable.
- `district` – Congressional district (string) when applicable.
- `polName` – Display name of the politician when applicable.
- `handles` – Object with optional social handles: `bluesky`, `twitter`, `mastodon`, `facebook`, `instagram`, `youtube`, `truth`.

**House membership only** (`house_membership`):

- `action` – `"added"` or `"removed"`.

**Bill status** (`bill_status`):

- `bill_id` – e.g. `H.J.Res.54`.
- `bill_title` – Bill title (e.g. We The People Amendment).
- `previous_status` – Status before the change.
- `new_status` – Current status.
- `last_action_text` – Text of the latest action (when available).
- `update_date` – Date of bill update (YYYY-MM-DD), when available.
- `committees_changed` – Boolean; whether committee assignments changed.
- `committees` – Array of committee codes (e.g. `HJUD`), when applicable.

**Election dates** (`election_dates`):

- `states` – Array of state codes that had changes.
- `change_summary` – Array of human-readable change lines (e.g. `Updated CA: 2026-03-05/2026-11-05 → 2026-03-12/2026-11-05`).

**Session end** (`session_end`):

- `session_label` – Human-readable session (e.g. `119th Congress, 2nd Session`).
- `converted_count` – Number of Celebrations converted to defunct.

**Celebration** (`celebration`):

- `donation` – Donation amount in dollars.
- `total_donations` – Total escrowed for this pol this election cycle (active only, has_stakes); omitted if aggregation fails.
- `state`, `district`, `polName`, `handles` – Politician and district (no donor info).
- `bill_id`, `bill_title` – Bill/condition for the celebration.

**Deploy** (`deploy`):

- `text` – Single-line deploy summary (e.g. `Deploy <short_sha>: <commit subject> | <GitHub Actions run URL>`).
- `dedupe_key` – `deploy:<run_id>` where `run_id` is the GitHub Actions run ID (stable per run for de-duplication in automation).

## Where it is used

- **challengersWatcher**: When processing added challengers (new or reappearance), calls `postToSocial` with `eventType: 'challengers'`, plus `state`, `district`, `polName`, `handles`, `dedupeKey`.
- **houseWatcher**: For each added or removed member, calls `postHouseMemberChange` (which uses `postToSocial`) with `eventType: 'house_membership'`, `action: 'added'` or `'removed'`, and validated state/district/polName/handles.
- **checkHJRes54**: When the bill snapshot diff detects changes and a previous state exists, calls `postToSocial` with `eventType: 'bill_status'`, `billId`, `billTitle`, `previousStatus`, `newStatus`, `lastActionText`, and a time-based `dedupeKey`. May also pass `updateDate`, `committeesChanged`, and `committees` when available.
- **electionDatesUpdater**: In `saveElectionDatesToSnapshot`, when there are states with date changes (after sending email notifications), calls `postToSocial` with `eventType: 'election_dates'`, `states`, `changeSummary`, and a `dedupeKey` including election year and timestamp.
- **defunctCelebrationWatcher**: When a Congressional session has ended and active Celebrations were converted to defunct (`result.convertedCount > 0`), calls `postToSocial` with `eventType: 'session_end'`, `sessionLabel`, `convertedCount`, and a `dedupeKey` including Congress/session and timestamp.
- **orchestrationService**: After a new Celebration is created, calls `postToSocial` with `eventType: 'celebration'`, `donation`, `totalDonations` (from getEscrowedTotalsByPol for this pol_id), `state`, `district`, `polName`, `handles`, `billId`, `billTitle`, and `dedupeKey: celebration:<id>`. No donor information is sent.
- **CI/CD (announce_deploy)**: After the deploy job succeeds on push to `main`, the `announce_deploy` job POSTs to the same webhook with `event_type: 'deploy'`, `text` (deploy summary with short SHA, commit subject, and run URL), and `dedupe_key` (`deploy:<run_id>`). Not sent via `postToSocial`; built in `.github/workflows/ci_cd.yml`.

## Testing

**Script**: `scripts/tests/socialTest.js`

Loads `.env.local`, accepts CLI args, validates `house_membership` (state, district, polName required), builds the same payload shape as the app, and POSTs to `SOCIAL_WEBHOOK_URL`.

```bash
node scripts/tests/socialTest.js house_membership added TX 12 "Jane Smith"
node scripts/tests/socialTest.js house_membership removed CA 12 "Jane Smith"
node scripts/tests/socialTest.js celebration 50 TX 12 "Jane Smith" 150
```

Curl examples (same body shape) are in the script header. For house events use snake_case, `event_type`, `dedupe_key`, and `action` (`added` or `removed`). For celebration, optional fifth arg is `total_donations`.

(Test helpers for `bill_status` and `election_dates` can be added to the script or as separate examples as needed.)

## Automation (Make.com) notes

- Reference webhook output from the Webhook module (e.g. module 2) with the module number: `{{2.state}}`, `{{2.district}}`, `{{2.polName}}`, `{{2.action}}`, `{{2.handles.bluesky}}`, `{{2.bill_id}}`, `{{2.new_status}}`, `{{2.states}}`, `{{2.total_donations}}`, etc. For house_membership, branch on `action` (`added` or `removed`).
- Route by `event_type` to different scenarios or branches (challenger vs House vs bill vs election dates vs session_end vs celebration vs deploy). For `deploy`, use `{{2.text}}` for the message body.
- One post per webhook execution; use `dedupe_key` to avoid duplicate posts on retries or repeated runs.
- To include the POWERBACK.us URL in every post, append it in the Make text formula (e.g. `+ " " + "https://powerback.us"` or your production URL). The app does not add the URL; build it in the scenario.

## Make.com copy (Bluesky, Discord, Mastodon)

Use the Webhook module (e.g. module 2) and route by `{{2.event_type}}`. Append your site URL in the scenario (e.g. `+ " " + "https://powerback.us"`). No donor information is used in any copy.

### bill_status

**Webhook fields**: `bill_id`, `bill_title`, `previous_status`, `new_status`, `last_action_text`, `update_date` (optional), `committees_changed` (optional), `committees` (optional, array)

**Bluesky** (300 char limit; truncate `last_action_text` if needed):

```
{{2.bill_id}} ({{2.bill_title}}) status: {{2.previous_status}} → {{2.new_status}}. {{2.last_action_text}} https://powerback.us
```

**Mastodon** (500 chars):

```
Update: {{2.bill_id}} ({{2.bill_title}})

Status: {{2.previous_status}} → {{2.new_status}}

{{2.last_action_text}}

https://powerback.us
```

**Discord** (plain message or embed):

- Title: `Bill update: {{2.bill_id}}`
- Description: `**{{2.bill_title}}**\nStatus: {{2.previous_status}} → {{2.new_status}}\n\n{{2.last_action_text}}\n\nhttps://powerback.us`

---

### election_dates

**Webhook fields**: `states` (array), `change_summary` (array of strings). In Make, join arrays for display, e.g. `join(2.states; ", ")` and `join(2.change_summary; "\n")` (syntax may vary by Make version).

**Bluesky** (300 char; use joined states and first change line or short summary):

```
Election date updates: {{join(2.states; ", ")}}. {{2.change_summary[0]}} https://powerback.us
```

(If your Make version does not support `2.change_summary[0]`, use an Iterator over `change_summary` and take the first item, or build a single-line summary in a previous step.)

**Mastodon** (500 chars):

```
Election date updates for {{join(2.states; ", ")}}:

{{join(2.change_summary; "\n")}}

https://powerback.us
```

**Discord**:

- Title: `Election date updates`
- Description: `States: {{join(2.states; ", ")}}\n\n{{join(2.change_summary; "\n")}}\n\nhttps://powerback.us`

---

### session_end

**Webhook fields**: `session_label`, `converted_count`

**Bluesky** (300 char):

```
{{2.session_label}} has ended. {{2.converted_count}} celebration(s) concluded. https://powerback.us
```

**Mastodon** (500 chars):

```
{{2.session_label}} has ended.

{{2.converted_count}} celebration(s) concluded with the session.

https://powerback.us
```

**Discord**:

- Title: `Session end: {{2.session_label}}`
- Description: `{{2.converted_count}} celebration(s) concluded.\n\nhttps://powerback.us`

---

### celebration

**Webhook fields**: `donation`, `total_donations` (when available), `state`, `district`, `polName`, `handles`, `bill_id`, `bill_title`. No donor information.

**Bluesky** (300 char; one handle only if space):

```
${{2.donation}} celebration in {{2.state}}-{{2.district}}: {{2.polName}} — {{2.bill_title}}. {{2.handles.bluesky}} https://powerback.us
```

(If you want a handle link only when present: use a conditional in Make, e.g. `if(2.handles.bluesky; " " + 2.handles.bluesky; "")`.) Optional: include total escrowed with `${{2.total_donations}}` when present.

**Mastodon** (500 chars):

```
New ${{2.donation}} celebration in {{2.state}}-{{2.district}}: {{2.polName}} — {{2.bill_title}}.

{{2.handles.bluesky}} {{2.handles.twitter}} {{2.handles.mastodon}}

https://powerback.us
```

**Discord**:

- Title: `New celebration: ${{2.donation}} in {{2.state}}-{{2.district}}`
- Description: `**{{2.polName}}** — {{2.bill_title}}\n\nHandles: {{2.handles.bluesky}} {{2.handles.twitter}} {{2.handles.mastodon}}\n\nhttps://powerback.us`
- Optional: add `Total escrowed (this cycle): ${{2.total_donations}}` when `total_donations` is present.

---

**Incumbents** (`incumbents`):

- `action` – `"added"` or `"removed"`.
- `state` – Two-letter state code.
- `district` – Congressional district (string).
- `polName` – Display name of the incumbent.
- `handles` – Same handle shape as `challengers`/`house_membership`.

Incumbent dropouts from `challengersWatcher` currently emit `event_type: 'incumbents'` with `action: 'removed'`. Additional incumbent-entry events can reuse the same shape with `action: 'added'`.

## Related

- [Background Jobs](./background-jobs.md) – Watcher orchestration and job list
- [Webhook System](./webhooks.md) – Stripe webhooks (separate system)
