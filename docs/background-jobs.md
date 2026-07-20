# Background Jobs and Watchers System

## Overview

POWERBACK uses a comprehensive background job system to monitor external APIs, update congressional data, track election dates, and manage celebration lifecycles. These jobs run automatically on scheduled intervals to keep the platform current with political data and celebration state. Delivery of funds to campaigns and FEC filing are not automated; they are handled manually by the PAC operator.

## Job Architecture

### Orchestration

All background jobs are orchestrated through the `runWatchers` system, which:

- Runs daily at 3 PM Eastern Time on weekdays
- Executes jobs in a specific order
- Handles errors gracefully (one job failure doesn't stop others)
- Provides comprehensive logging and monitoring
- Can be disabled via `START_WATCHERS`: leave unset or blank to skip; set `START_WATCHERS=1` to run

### Execution Order

1. **houseWatcher** - House membership monitoring
2. **challengersWatcher** - Challenger status tracking
3. **pfpSync** - House headshot WebP sync (`scripts/pfp-sync`, after stakes are fresh)
4. **checkHJRes54** - Bill status monitoring
5. **electionDatesUpdater** - Election dates synchronization
6. **defunctCelebrationWatcher** - Defunct celebration conversion

## Individual Jobs

### House Membership Watcher (`houseWatcher.js`)

**Purpose**: Monitors House of Representatives membership changes

**Key Features**:

- Fetches current House members from Congress.gov API
- Compares with previous snapshot to detect changes
- Automatically adds new members to database
- Sets `has_stakes: false` on newly shaped House Pols; **competitive** `has_stakes` is recomputed by `challengersWatcher`, not here
- Sends email/SMS alerts for membership changes

**FEC Integration**:

- Resolves FEC candidate IDs for new members (state, district, name, election year)
- Uses in-memory cache to reduce API calls
- Rate limiting to prevent API abuse

**Snapshot System**:

- Stores previous House membership in snapshot file
- Compares current vs previous to detect changes
- Saves new snapshot after processing

**Social announcements**: Posts `house_membership` events to the social webhook (see [Social Announcements Webhooks](./social-announcements-webhooks.md)).

### Challengers Status Watcher (`challengersWatcher.js`)

**Purpose**: Monitors challenger status for House races

**Key Features**:

- Fetches incumbent and challenger data from OpenFEC API
- Tracks challenger status changes (appeared, disappeared, reappeared)
- Tracks incumbent dropouts
- Updates `has_stakes` flags based on competitive race status
- **Policy note**: POWERBACK exclusions from the selectable roster use `Pol.roster_excluded`, not watcher toggles on `has_stakes` alone. See [`specs/pol-roster-exclusion.md`](../specs/pol-roster-exclusion.md).
- Sends email alerts to users in affected districts

**End-to-end pipeline (each `checkChallengers` run)**

1. **Election year** — `ELECTION_YEAR` is derived from `nextStart()` (see `jobs/challengersWatcher.js`).
2. **OpenFEC fetches** — Paginated `/candidates/`: House (`office=H`), active candidates who have raised funds, filtered by `election_year=ELECTION_YEAR` — one pass with `incumbent_challenge=I` (incumbent FEC candidate ids), one with `C` and `O` (challengers and open-seat rows).
3. **Challenger district keys** — For each challenger row, find the index in `election_years` for the target cycle (values may be **numbers or strings**). Read the same index in `election_districts`. Require a non-empty two-letter `state` and a normalizable district via `normalizeHouseDistrictKeyPart(district, state)` from `services/utils/normalizeHouseDistrict.js`; otherwise skip that row (never emit keys with a missing state prefix).
4. **Competitive incumbent FEC ids** — For each incumbent FEC id from OpenFEC, load the `Pol` whose **`roles` array** contains that id (any index) and build the state–district key from **that** role row. If the key is in the challenger set, the incumbent is a **district match**. **Committed `finalIds`** (used for `has_stakes` and the challenger snapshot) include the id only when `roles[0].fec_candidate_id === incId` — **`roles[0]` is the current House role**; later entries are historical. If the district match uses a historical role only, the watcher logs structured diagnostics and **does not** add that id to `finalIds`.
5. **`Pol.has_stakes` writes** — Two `updateMany` calls: set `has_stakes: true` where `roles[0].fec_candidate_id` is in `finalIds`; set `has_stakes: false` where `roles[0].fec_candidate_id` is not in `finalIds`. Full recompute each run.
6. **Snapshot and notifications** — `diffSnapshot` compares the committed competitive set to `challengers.snapshot.json` and drives email/SMS/social and celebration side effects. Bootstrap (empty snapshot) still updates the DB and snapshot but skips bulk alerts.

**Carousel alignment**

- `has_stakes` reflects only **current-role** (`roles[0]`) competitive FEC ids.
- `GET /api/congress` serves Pols with `has_stakes: true` and `roster_excluded` not true (`controller/congress/pols.js`). A gap between `Pol.countDocuments({ has_stakes: true })` and OpenFEC “incumbents with challengers” can be **roster exclusions**, **district match on a historical FEC id only** (skipped for `has_stakes`), or other data drift — see diagnostic log line `has_stakes competitive FEC diagnostics`.

**Diagnostics (309 vs 308 style checks)**

Each run logs, in one line: `committed_finalIds` (length of `finalIds` used for DB), `matching_roles0` (same count when the invariant holds), `matching_any_role` (district match using whichever role carries the FEC id), and `later_role_only_stale` (district match on a non-`roles[0]` row only). When `later_role_only_stale > 0`, each case emits a **warn** with `pol_id`, `fec_incumbent_id`, `roles0`, and `matching_later_role` (FEC id, congress, state, district, chamber) for Compass follow-up. Personal names are omitted from logs (PII policy).

**District email lookup**

- Challenger alerts resolve users via `getUsersInDistrict({ state, district })` (object argument), matching the service signature in `services/celebration/dataService.js`.

**Email Alerts**:

- Different templates for different event types:
  - `ChallengerAppeared`: New challenger entered race
  - `ChallengerDisappeared`: Challenger dropped out
  - `ChallengerReappeared`: Challenger re-entered race
  - `IncumbentDroppedOut`: Incumbent dropped out
- Respects user unsubscribe preferences
- Targets users in affected districts

**Celebration Cancellation**:

- Cancels or defuncts active celebrations for candidates who drop out
- Updates celebration status via StatusService

**Social announcements**: Posts `challengers` (new challenger) and `incumbents` (incumbent dropout) events to the social webhook (see [Social Announcements Webhooks](./social-announcements-webhooks.md)).

### House headshot WebP sync (`pfpSync` / `scripts/pfp-sync.js`)

**Purpose**: Writes missing `{bioguide}.webp` files for House members on the selectable roster (`has_stakes`, not `roster_excluded`), using the same logic as `npm run pfp-sync`.

**Scheduling**: Invoked from `jobs/runWatchers.js` after `challengersWatcher` so `has_stakes` is up to date. Output directory: `PFP_SYNC_OUT_DIR` if set, else `STATIC_PUBLIC_DIR/pfp`, else `client/public/pfp`. Failures are logged and do not block later watchers.

### H.J.Res.54 Bill Watcher (`checkHJRes54.js`)

**Purpose**: Monitors H.J.Res.54 (We The People Amendment) bill status

**Key Features**:

- Fetches bill data from Congress.gov API
- Compares with previous snapshot to detect changes
- Updates database when changes detected
- Uses snapshot diffing for change detection
- Computes total escrowed donations for the bill (Celebrations with `current_status: 'active'`, all users and candidates) and includes it in the email and webhook payload
- Sends email to all users not unsubscribed from the bill-updates topic (template: `Hjres54BillUpdated`; topic: `billUpdates`)
- Optionally POSTs a JSON payload to an external webhook when `HJRES54_WEBHOOK_URL` is set (e.g. for Make.com); see [Webhooks](./webhooks.md#outgoing-hjres54-bill-update-webhook)

**Social announcements**: When bill changes are detected, posts `bill_status` events to the social webhook (see [Social Announcements Webhooks](./social-announcements-webhooks.md)).

**Current Limitation**:

- Hardcoded to monitor only H.J.Res.54
- Bill number, type, and Congress ID are constants

**Future Enhancement**:

- Should be refactored to accept bill parameters dynamically
- Support monitoring multiple bills
- Make snapshot name and comparison logic bill-agnostic

**Testing the H.J.Res.54 email and job**:

1. **Send the bill-update email with mock data (no API or job)**  
   Run: `node scripts/tests/test-hjres54-email.js --email <you@example.com> [--firstName "Name"]`  
   This sends one H.J.Res.54 alert to the given address using the same template and `sendEmail` path as the job. Uses mock change summary (status, action, committees, totalDonations). Requires `.env` (and optionally `.env.local`) and working email config; the recipient will get the same email body and unsubscribe link as in production.

2. **Run the real job with a faked change**  
   The job only sends email when `diffSnapshot` reports a change (current API state differs from the last snapshot). To trigger that without waiting for a real bill update:
   - **Snapshot location**: In development, snapshots live under the project root: `snapshots/hjres54.snapshot.json` (see `constants/paths.js`: `getSnapshotsDir()`). In production, `getPersistentDataDir()` is typically `/var/lib/powerback`, so the file is `snapshots/hjres54.snapshot.json` there.
   - **Fake a change**: Run the job once so it saves the current API state as the snapshot. Then edit `snapshots/hjres54.snapshot.json`: change one tracked field (e.g. `status` or `updateDate`) to a value that will not match the next API response (e.g. set `"status": "Fake"` or `"updateDate": "2000-01-01"`). Save the file. On the next job run, the API returns real data, `diffSnapshot` sees a difference, and the job runs the email and webhook logic for all subscribed users.
   - **Revert**: After testing, either run the job again (it will overwrite the snapshot with current API data) or restore the snapshot from backup so the next run does not fire again.

### Election Dates Updater (`electionDatesUpdater.js`)

**Purpose**: Updates election dates from OpenFEC API

**Key Features**:

- Fetches election dates for current election year
- Groups dates by state (primary, general, runoff)
- Maintains election dates snapshot file
- Detects changes and triggers notifications
- Uses existing snapshot as fallback when API unavailable

**Business Logic**:

- Election year calculation (even years)
- Date grouping by state abbreviation
- Statutory general election date tracking
- Used for compliant-tier per-election limit calculations

**Integration**:

- Triggers election date notification service
- Notifies users with active celebrations
- Notifies users in affected states
- Posts `election_dates` events to the social webhook when dates change (see [Social Announcements Webhooks](./social-announcements-webhooks.md))

### Defunct Celebration Watcher (`defunctCelebrationWatcher.js`)

**Purpose**: Converts active celebrations to defunct when sessions end

**Key Features**:

- Monitors Congressional session status
- Converts active celebrations to defunct when sessions end
- Sends warning emails during warning period
- Sends notification emails to affected users

**Workflow**:

1. Checks if session has ended
2. Finds all active celebrations
3. Converts to defunct status
4. Sends notification emails

**Manual Triggers**:

- `manualTrigger`: For testing or immediate execution
- `forceConversion`: Force all active celebrations to defunct
- `forceWarningEmails`: Force sending of warning emails

**Social announcements**: When conversions run (`convertedCount > 0`), posts `session_end` events to the social webhook with session label and converted count (see [Social Announcements Webhooks](./social-announcements-webhooks.md)).

### PAC Tip Limit Reset (`tipLimitReachedReset.js`)

**Purpose**: Resets PAC tip limit flags annually

**Key Features**:

- Resets `tipLimitReached` to false for all users
- Runs at midnight Eastern Time on January 1st
- Allows users to give tips again after annual limit reset

**Scheduling**:

- Cron schedule: `'0 0 1 1 *'` (midnight on January 1st)
- Timezone: America/New_York (Eastern Time)
- Runs automatically each year

## Congress.gov and OpenFEC data

There is **no stable shared identifier** between Congress.gov (member data) and the OpenFEC API (candidate/committee data). Congress.gov does not expose FEC candidate ID in the member responses we use, and OpenFEC does not expose bioguide_id or a similar key. Pol records are therefore linked to FEC candidate IDs by:

- **Office-first (preferred)**: Query OpenFEC by state, district, office (H), election year, and `incumbent_challenge=I`. For a given district there is at most one incumbent; a single result gives the FEC candidate ID without name matching. Used by `dev/update-fec-ids.js` when backfilling missing FEC IDs.
- **Name + district + year (fallback)**: When incumbent lookup returns zero or multiple results, match by normalized name, state, district, and election year. Used by `houseWatcher.js` (when resolving FEC ID for new members) and by `update-fec-ids.js` as fallback.

See `dev/update-fec-ids.js` (file header and `fetchFecIdByIncumbent` / `fetchFecCandidateId`) and `jobs/houseWatcher.js` (`fetchFecCandidateId`) for the implementation.

### House district and OCD IDs (House roles)

House `roles[].district` and `roles[].ocd_id` are normalized in `services/utils/normalizeHouseDistrict.js` and applied by `jobs/houseWatcher.js`, `jobs/challengersWatcher.js`, and `scripts/add-members-to-docking.js`:

- **Numeric districts**: two-digit strings `01`–`53` (aligned with OpenFEC padding).
- **Voting at-large**: internal district string `00`; `ocd_id` is **state-only**: `ocd-division/country:us/state:xx` (no `/cd:` segment; matches Google Civics-style at-large division ids).
- **Non-voting jurisdictions** (DC, PR, GU, VI, AS, MP): textual at-large labels (including Unicode hyphens and phrases like “Congressional District (At Large)”) resolve to district **`0`** with the same **state-only** `ocd_id` when the seat is whole-area; numbered territorial seats (e.g. `98`) still use `/cd:98`. Voting at-large **`00`** is never used for delegates. FEC resolution uses the delegate path where applicable.
- **Challenger keys**: state–district keys pass the optional state argument into `normalizeHouseDistrictKeyPart` so numeric `0` in a territory does not collide with at-large `00`.

Celebration **`getUsersInDistrict`** (`services/celebration/dataService.js`) matches at-large (`00`) users by **state-only** `ocd_id` or legacy `cd:0` / `cd:00` suffixes.

## Snapshot Management

### Snapshot System (`snapshotManager.js`)

The snapshot system provides utilities for managing snapshots and deltas:

**Functions**:

- `loadSnapshot(name)`: Loads previous snapshot from disk
- `saveSnapshot(name, data)`: Saves current state as new snapshot
- `diffSnapshot({ name, current, keyFn, compareFn })`: Compares current vs previous
- `appendDelta(name, entry)`: Appends change entry to delta log

**Snapshot Format**:

- Stored as JSON files in snapshots directory
- Format: Object with keys from `keyFn(item)`
- Values are full item objects

**Delta Format**:

- Stored as JSON array in deltas directory
- Each entry has: date, key, old, new
- Changes and removals both logged

## Database Connection

### Run Check Utility (`runCheck.js`)

Ensures database connectivity before running check functions:

- Connects to MongoDB before running check
- Logs watcher errors and re-throws them to the caller
- Used by all watcher jobs

## Scheduling Configuration

### Cron Schedule

- **Schedule**: Daily at 3 PM Eastern Time on weekdays
- **Timezone**: America/New_York (Eastern Time)
- **Configuration**: `SERVER.CRON_SCHEDULES.WEEKDAY_3PM`
- **Ownership**: `runWatchers.js` owns the sole watcher cron schedule. Individual watcher modules execute one run and do not schedule themselves.

### Run control

- **START_WATCHERS**: set `START_WATCHERS=1` to run watchers; leave unset or blank to disable (e.g. for maintenance or testing). When disabled, the initial run is skipped.

### Social webhook rate limiting and cold start

- **Rate limiting**: Social webhook posts are throttled (min delay between posts, per-run cap, per-event-type cap). See [Social Announcements Webhooks](./social-announcements-webhooks.md) and `SOCIAL_WEBHOOK_*` env vars in `.env.example.backend`.
- **Cold start**: On a fresh clone or empty `snapshots/` and `deltas/`, the first run can treat all current data as "new" and would otherwise send hundreds of emails and social posts. houseWatcher and challengersWatcher detect bootstrap (no previous snapshot) and skip per-member/per-district social posts and bulk alert emails; they still sync data and save snapshots so the next run is incremental.

## Error Handling

### Independent Execution

- `runWatchers.js` executes watchers sequentially and tracks each result
- `runCheck.js` propagates watcher failures to the orchestrator
- Failures in one watcher don't stop later watchers
- Summary logged at end (completed/failed counts)

### Logging

- Comprehensive logging for each watcher
- Error details logged for debugging
- Success/failure counts tracked
- Performance metrics logged

## Testing

### Manual Triggers

Most watchers provide manual trigger functions for testing:

```javascript
// Defunct celebration watcher
const watcher = require('./jobs/defunctCelebrationWatcher');
await watcher.manualTrigger();
await watcher.forceConversion();
await watcher.forceWarningEmails();
```

### Test Mode

- Watchers skip initial run in test mode
- Reduced logging in test mode
- Test snapshots can be used instead of API calls

## Related Documentation

- [Defunct Celebrations System](./defunct-celebrations-system.md) - Defunct conversion details
- [Election Date Notifications](./election-dates.md) - Election date change notifications
- [Email System](./email-system.md) - Email notifications sent by watchers
- [Status Ledger System](./status-ledger-system.md) - Celebration status tracking
- [Pol roster exclusion](../specs/pol-roster-exclusion.md) - Roster exclusion policy vs watcher `has_stakes`
