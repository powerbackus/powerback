# Background Jobs and Watchers System

## Overview

POWERBACK uses a comprehensive background job system to monitor external APIs, update congressional data, track election dates, and manage celebration lifecycles. These jobs run automatically on scheduled intervals to ensure the platform stays current with political data and properly manages user donations.

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
3. **checkHJRes54** - Bill status monitoring
4. **electionDatesUpdater** - Election dates synchronization
5. **defunctCelebrationWatcher** - Defunct celebration conversion

## Individual Jobs

### House Membership Watcher (`houseWatcher.js`)

**Purpose**: Monitors House of Representatives membership changes

**Key Features**:

- Fetches current House members from Congress.gov API
- Compares with previous snapshot to detect changes
- Automatically adds new members to database
- Updates `has_stakes` flags based on competitive race status
- Sends email/SMS alerts for membership changes

**FEC Integration**:

- Fetches FEC candidate data for competitive races
- Determines `has_stakes` flag based on:
  - Seeking re-election
  - Has raised funds
  - Has serious challenger
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
- Sends email alerts to users in affected districts

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
- Handles errors gracefully
- Used by all watcher jobs

## Scheduling Configuration

### Cron Schedule

- **Schedule**: Daily at 3 PM Eastern Time on weekdays
- **Timezone**: America/New_York (Eastern Time)
- **Configuration**: `SERVER.CRON_SCHEDULES.WEEKDAY_3PM`

### Run control

- **START_WATCHERS**: set `START_WATCHERS=1` to run watchers; leave unset or blank to disable (e.g. for maintenance or testing). When disabled, the initial run is skipped.

## Error Handling

### Independent Execution

- Each watcher runs independently
- Failures in one watcher don't stop others
- Results logged for monitoring
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
