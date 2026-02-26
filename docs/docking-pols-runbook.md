# Docking / Pols: Staging and Promotion Runbook

This document explains the docking system for safely managing the `pols` (politician) collection.

## Overview

The docking system provides a staging area (`docking_pols`) between external data sources (Congress.gov API, FEC API) and the live `pols` collection. All writes go to `docking_pols` first. A human-run promotion step moves data from staging to production.

**Flow:** External API data -> `docking_pols` (staging) -> `pols` (live)

## Adding New Members

To add specific House members to the staging collection:

```bash
node scripts/add-members-to-docking.js V000139 G000606
```

This script:

- Fetches member details from Congress.gov API
- Shapes data to the Pol schema
- Preserves existing social media handles (never overwrites non-null with null)
- Upserts into `docking_pols`

The `houseWatcher` background job also writes new members to `docking_pols` automatically when it detects House membership changes.

## Inspecting the Staging Collection

Before promoting, always inspect what will change:

```bash
# Show collection counts and sizes
node services/utils/dockingManager.js stats pols

# Sample comparison of docking vs live docs
node services/utils/dockingManager.js compare pols

# Dry run: show exactly what would be inserted, updated, or unchanged
node services/utils/dockingManager.js dryrun pols
```

The `dryrun` command performs zero writes and reports:

- **Inserts**: New pols not yet in the live collection
- **Updates**: Existing pols with changed data
- **Unchanged**: Pols identical in both collections

## Promoting to Production

When satisfied with the dry run results:

```bash
node services/utils/dockingManager.js promote pols
```

Promotion process:

1. Upserts all docking docs into the live `pols` collection
2. Deletes promoted docs from `docking_pols`
3. Logs the count of upserted and deleted documents

**Environment:** Ensure `MONGODB_URI` points to the correct database. Use `.env.cli` or `.env.local` for credentials.

## Rollback

If a promotion causes issues, restore from the most recent backup:

```bash
node services/utils/dockingManager.js rollback pols
```

This drops the current `pols` collection and renames the backup collection in its place.

## Social Media Handle Safety

The staging script and the `houseWatcher` follow a strict rule for social media fields:

- **API-provided fields** (`twitter_account`, `youtube_account`, `facebook_account`, `instagram_account`): Only set when the API returns a non-empty value. Never overwrite an existing value with null or empty string.
- **Manually-maintained fields** (`mastodon_account`, `bluesky_account`, `truth_social_account`): Never set by API-sourced scripts. These are updated only via the social-handles gap-fill script or manual database operations.

## Why `docking_pols` Might Show 500+ Documents

The `houseWatcher` fetches all current House members from the Congress.gov API and diffs against a local snapshot (`snapshots/house.snapshot.json`). On first run or after a snapshot reset, all members are treated as "new" and added to docking. The snapshot should stabilize after the first successful run.

If Senators appear in the docking collection, the Congress.gov API's `currentMember=true` filter may include both chambers depending on the endpoint parameters. The `houseWatcher` filters by checking the last term's chamber, but edge cases (e.g., chamber transfers) can slip through.

## Related Files

- `scripts/add-members-to-docking.js` -- Staging script for specific members
- `services/utils/dockingManager.js` -- DockingManager class and CLI
- `jobs/houseWatcher.js` -- Background job that auto-stages new members
- `models/Pol.js` -- Pol schema definition
