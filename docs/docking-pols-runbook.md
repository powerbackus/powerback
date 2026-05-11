# Docking / Pols: Staging and Promotion Runbook

This document explains the docking system for safely managing the `pols` (politician) collection.

## Overview

The docking system provides a staging area (`docking_pols`) between external data sources (Congress.gov API, FEC API) and the live `pols` collection. All writes go to `docking_pols` first. A human-run promotion step moves data from staging to production. There is no stable key linking Congress.gov members to OpenFEC candidates; FEC IDs are resolved by office (incumbent for district) or by name + district + election year (see [Background jobs – Congress.gov and OpenFEC data](./background-jobs.md#congressgov-and-openfec-data)).

**Flow:** External API data -> `docking_pols` (staging) -> `pols` (live)

## Adding New Members

To add specific House members to the staging collection:

```bash
node scripts/add-members-to-docking.js V000139 G000606
```

This script:

- Fetches member details from Congress.gov API
- Shapes data to the Pol schema (same House `district` / `ocd_id` resolution as `houseWatcher`, via `services/utils/normalizeHouseDistrict.js`)
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

## House headshot files (`pfp` WebP sync)

After new House members exist in live `pols`, bundled headshots should appear as `{BIOGUIDE_ID}.webp` where the app serves `pfp/` (locally `client/public/pfp/`; on the VPS use your **persistent** directory, e.g. `/var/lib/powerback/pfp` or the path nginx serves).

**Script:** `scripts/pfp-sync.js` (also `npm run pfp-sync`)

- Reads **`pols`** with `roles.0.chamber` = `House`, `has_stakes: true`, and `roster_excluded` not true (aligned with selectable House roster / donation funnel).
- For each bioguide, if `{id}.webp` is missing or zero-byte (unless `--force`), downloads the official House Clerk **`POL_IMG_FALLBACK_URL`** JPG (default matches the client clerk base), resizes to **227×277** (cover), encodes **WebP** with a quality sweep targeting **≤ 10 KB** (may exceed slightly at lowest quality; see logs), then writes **`{id}.webp`** atomically.
- **Rate limit:** ~400 ms between downloads toward `clerk.house.gov`.

**Environment**

| Variable                                                   | Purpose                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                              | Required (same as other CLI tools).                                                                           |
| `PFP_SYNC_OUT_DIR`                                         | Output directory (absolute path on VPS). Default: repo `client/public/pfp`.                                   |
| `POL_IMG_FALLBACK_URL` or `REACT_APP_POL_IMG_FALLBACK_URL` | JPG base URL (must end with `/` or the script normalizes). Default: `https://clerk.house.gov/images/members/` |

**Examples**

```bash
# Preview actions (no writes, no JPG download for encoding — logs would-fetch only)
npm run pfp-sync -- --dry-run

# Sync missing WebPs for all has_stakes House pols (writes under PFP_SYNC_OUT_DIR or client/public/pfp)
npm run pfp-sync

# Only specific bioguides (must still be House + has_stakes + not roster_excluded in DB)
npm run pfp-sync -- M001246 F000485

# Regenerate even when .webp exists; exit 1 if any download/encode failed (for cron alerting)
npm run pfp-sync -- --force --strict
```

**Cron (VPS):** Run on the host that **owns** the persistent `pfp` tree, e.g. hourly after `houseWatcher` or after you promote docking pols:

`15 * * * * cd /opt/powerback/app && PFP_SYNC_OUT_DIR=/var/lib/powerback/pfp /usr/bin/npm run pfp-sync -- --strict >> /var/log/powerback-pfp-sync.log 2>&1`

**GitHub Actions (production deploy):** `.github/workflows/ci_cd.yml` runs `npm run pfp-sync -- --strict` on the deploy runner after the client build. Add repository secret **`MONGODB_URI`** (production). Optional secret **`PFP_SYNC_OUT_DIR`**: if unset, the script defaults to `client/public/pfp`; if set, it overrides. A follow-up step rsyncs `./client/public/pfp/` to the same host as the static site, at `PROD_PUBLIC_HTML_PATH` from secrets with `/pfp/` appended.

New members promoted from `docking_pols` are picked up on the next run; no manual copy step is required once this job is scheduled.

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
- `scripts/pfp-sync.js` -- House headshot WebP sync (see [House headshot files](#house-headshot-files-pfp-webp-sync))
- `services/utils/dockingManager.js` -- DockingManager class and CLI
- `jobs/houseWatcher.js` -- Background job that auto-stages new members
- `models/Pol.js` -- Pol schema definition (`has_stakes`, policy `roster_excluded`; see [`specs/pol-roster-exclusion.md`](../specs/pol-roster-exclusion.md))
