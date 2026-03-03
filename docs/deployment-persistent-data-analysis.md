# Deployment Architecture: Persistent Data Separation Analysis

## Issue Summary

The POWERBACK backend deployment process risks deleting critical persistent data files (delta audit trails) because they are located within the deploy directory (`/home/deploy/app`). The rsync-based deployment with `--delete` flag can remove these files during each deployment.

**Critical Risk**: Delta files in `jobs/deltas/` are permanent audit trails that cannot be regenerated. If deleted, historical change tracking is lost.

> **📖 Related Documentation:**
>
> - [Background Jobs](./background-jobs.md) - Job system and snapshot management
> - [Deployment Automation](./deployment-automation.md) - Deployment process
> - [Production Setup](./production-setup.md) - Production setup

## Affected Files and Modules

### Core Persistent Data Locations

1. **Delta Files** (CRITICAL - Permanent Audit Trail)
   - Location: `jobs/deltas/*.delta.json`
   - Files: `challengers.delta.json`, `hjres54.delta.json`, `house.delta.json`
   - Written by: `jobs/snapshotManager.js::appendDelta()`
   - Used by: `challengersWatcher.js` (via `diffSnapshot()`)

2. **Snapshot Files** (May be regenerable, but currently in deploy tree)
   - Location: `snapshots/*.snapshot.json`
   - Files:
     - `house.snapshot.json` (houseWatcher.js)
     - `house.fec-cache.json` (houseWatcher.js)
     - `challengers.snapshot.json` (challengersWatcher.js)
     - `electionDates.snapshot.json` (electionDatesUpdater.js)
   - Written by: Multiple watchers via `snapshotManager.js` and direct writes

3. **User-Uploaded Profile Pictures (pfp)**
   - Location: `/var/lib/powerback/pfp/` (persistent storage)
   - Symlink: `/opt/powerback/app/client/public/pfp` → `/var/lib/powerback/pfp`
   - Written by: Application when users upload profile pictures
   - Served by: NGINX from `/home/deploy/public_html/pfp/` (via symlink)
   - **Critical**: Must persist across deployments to prevent data loss

### Code Files Requiring Changes

1. **`jobs/snapshotManager.js`** - Core path resolution for snapshots and deltas
2. **`jobs/houseWatcher.js`** - Direct snapshot path references
3. **`jobs/challengersWatcher.js`** - Direct snapshot path reference
4. **`jobs/electionDatesUpdater.js`** - Direct snapshot path references
5. **`scripts/deploy/deploy.remote.sh`** - Directory creation and permissions
6. **Systemd service file** (if exists) - `ReadWritePaths` configuration

## Recommended Directory Layout

### Production Structure

```
/home/deploy/app/                    # Deploy directory (code only)
├── jobs/                            # Code only
├── routes/                          # Code only
├── services/                        # Code only
└── ... (all other code)

/var/lib/powerback/                  # Persistent state (outside deploy tree)
├── deltas/                          # Delta audit trails (CRITICAL)
│   ├── challengers.delta.json
│   ├── hjres54.delta.json
│   └── house.delta.json
├── snapshots/                       # Snapshot files (may be regenerable)
│   ├── challengers.snapshot.json
│   ├── electionDates.snapshot.json
│   ├── house.snapshot.json
│   └── house.fec-cache.json
└── pfp/                             # User-uploaded profile pictures (CRITICAL)
    └── ... (user-uploaded .webp files)

/var/log/powerback/                  # Logs (already moved)
└── ... (existing log files)

/home/deploy/public_html/            # Frontend build (already separate)
└── ... (React build output)

/opt/powerback/app/                  # Backend application code
└── client/
    └── public/
        └── pfp -> /var/lib/powerback/pfp  # Symlink to persistent storage
```

### Rationale

- `/var/lib/powerback/` follows Linux FHS conventions for application state
- Separates deploy artifacts from persistent data
- Delta files are protected from deployment operations
- Snapshots can be regenerated but benefit from persistence
- User-uploaded files (pfp) persist across deployments via symlink
- Aligns with systemd hardening (`ReadWritePaths`)

## Concrete Code Changes

### 1. Create Path Configuration Module

**New file: `constants/paths.js`**

```javascript
const path = require('path');

/**
 * Get base directory for persistent data
 * Production: /var/lib/powerback
 * Development: project root
 */
function getPersistentDataDir() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PERSISTENT_DATA_DIR || '/var/lib/powerback';
  }
  return path.resolve(__dirname, '..');
}

/**
 * Get directory for delta files (permanent audit trail)
 */
function getDeltasDir() {
  return path.join(getPersistentDataDir(), 'deltas');
}

/**
 * Get directory for snapshot files
 */
function getSnapshotsDir() {
  return path.join(getPersistentDataDir(), 'snapshots');
}

module.exports = {
  getPersistentDataDir,
  getDeltasDir,
  getSnapshotsDir,
};
```

### 2. Update `jobs/snapshotManager.js`

**Changes:**

- Import path configuration
- Update `getPaths()` to use persistent data directories
- Ensure directory creation in `writeJsonAtomic` calls

```javascript
const { getDeltasDir, getSnapshotsDir } = require('../constants/paths');

function getPaths(name) {
  return {
    snapshotPath: path.join(getSnapshotsDir(), `${name}.snapshot.json`),
    deltaPath: path.join(getDeltasDir(), `${name}.delta.json`),
  };
}
```

### 3. Update `jobs/houseWatcher.js`

**Changes:**

- Replace hardcoded snapshot paths with path configuration

```javascript
const { getSnapshotsDir } = require('../constants/paths');

const SNAPSHOT = path.join(getSnapshotsDir(), 'house.snapshot.json');
const FEC_CACHE_PATH = path.join(getSnapshotsDir(), 'house.fec-cache.json');
```

### 4. Update `jobs/challengersWatcher.js`

**Changes:**

- Replace hardcoded snapshot path with path configuration

```javascript
const { getSnapshotsDir } = require('../constants/paths');

const SNAPSHOT = path.join(getSnapshotsDir(), 'challengers.snapshot.json');
```

### 5. Update `jobs/electionDatesUpdater.js`

**Changes:**

- Replace all hardcoded snapshot paths with path configuration

```javascript
const { getSnapshotsDir } = require('../constants/paths');

// Update all path.join(__dirname, '..', 'snapshots', ...) calls
const snapshotPath = path.join(
  getSnapshotsDir(),
  'electionDates.snapshot.json'
);
```

### 6. Update `scripts/deploy/deploy.remote.sh`

**Changes:**

- Remove directory creation in deploy tree (lines 125-127)
- Add persistent data directory setup
- Ensure proper permissions for persistent directories

```bash
# STEP 8 - Setup persistent data directories (outside deploy tree)
echo "==> Setting up persistent data directories..."

PERSISTENT_DATA_DIR="/var/lib/powerback"

ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  sudo mkdir -p $PERSISTENT_DATA_DIR/deltas $PERSISTENT_DATA_DIR/snapshots &&
  sudo chown -R powerback:powerback $PERSISTENT_DATA_DIR &&
  sudo chmod -R 750 $PERSISTENT_DATA_DIR &&
  sudo chmod -R 770 $PERSISTENT_DATA_DIR/deltas $PERSISTENT_DATA_DIR/snapshots &&

  sudo mkdir -p $REMOTE_BACKEND_DIR/client/public/pfp &&
  sudo chown -R deploy:deploy $REMOTE_FRONTEND_DIR &&
  sudo chmod -R 755 $REMOTE_FRONTEND_DIR &&
  sudo chown -R deploy:powerback $REMOTE_BACKEND_DIR &&
  sudo find $REMOTE_BACKEND_DIR -type d -exec chmod 750 {} \; &&
  sudo chmod 751 /home/deploy
"
```

**Note:** Remove lines 125-127 that create directories in deploy tree.

### 7. PFP Symlink Setup

The deployment script (`scripts/deploy/deploy.remote.sh`) automatically creates a symlink for user-uploaded profile pictures:

```bash
# STEP 9 - Persist pfp (user uploads)
echo "==> Setting up persistent pfp storage and symlink..."

ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  # Migrate existing files from old deploy tree location (idempotent)
  if [ -d $APP_ROOT/client/public/pfp ] && [ ! -L $APP_ROOT/client/public/pfp ] && [ \"\$(ls -A $APP_ROOT/client/public/pfp 2>/dev/null)\" ]; then
    echo 'Migrating existing pfp files to persistent storage...' &&
    sudo rsync -a $APP_ROOT/client/public/pfp/ $PFP_PERSIST/ || true
  fi &&

  # Ensure persistent pfp directory exists
  sudo mkdir -p $PFP_PERSIST &&
  sudo chown -R powerback:powerback $PFP_PERSIST &&
  sudo chmod 2775 $PFP_PERSIST &&

  # Ensure public dir exists in app tree
  sudo mkdir -p $APP_ROOT/client/public &&

  # Replace pfp in app tree with symlink
  sudo rm -rf $APP_ROOT/client/public/pfp &&
  sudo ln -s $PFP_PERSIST $APP_ROOT/client/public/pfp &&

  # Sanity check (should print the symlink)
  ls -l $APP_ROOT/client/public/pfp
"
```

**Why the symlink?**

- The application writes profile pictures to `/opt/powerback/app/client/public/pfp/`
- This directory is in the deploy tree and gets wiped on each deployment
- The symlink redirects writes to `/var/lib/powerback/pfp/` (persistent storage)
- User uploads survive deployments because they're stored outside the deploy tree
- The symlink is recreated on each deployment to ensure it exists

**Note:** The frontend serves pfp files from `/home/deploy/public_html/pfp/` via NGINX. The symlink in the backend app tree is for the application's write path. If the frontend path changes, the symlink location may need to be updated accordingly.

## Systemd Configuration Updates

### ReadWritePaths Configuration

If systemd service uses `ProtectSystem=full` and `ReadWritePaths`, update to include:

```ini
[Service]
ProtectSystem=full
ReadWritePaths=/var/lib/powerback /var/log/powerback
```

This allows the service to write to persistent data and log directories while protecting the rest of the filesystem.

**Note:** The pfp symlink allows writes to `/var/lib/powerback/pfp/` even though the application writes to `/opt/powerback/app/client/public/pfp/`. The symlink resolves to the persistent storage location.

## Migration Strategy

### One-Time Migration Steps

1. **Before deploying code changes:**

   ```bash
   # On production server
   sudo mkdir -p /var/lib/powerback/{deltas,snapshots,pfp}
   sudo cp -r /home/deploy/app/jobs/deltas/* /var/lib/powerback/deltas/ 2>/dev/null || true
   sudo cp -r /home/deploy/app/snapshots/* /var/lib/powerback/snapshots/ 2>/dev/null || true
   # Migrate pfp files if they exist in the old location
   if [ -d /opt/powerback/app/client/public/pfp ] && [ ! -L /opt/powerback/app/client/public/pfp ]; then
     sudo cp -r /opt/powerback/app/client/public/pfp/* /var/lib/powerback/pfp/ 2>/dev/null || true
   fi
   sudo chown -R powerback:powerback /var/lib/powerback
   sudo chmod -R 750 /var/lib/powerback
   sudo chmod -R 770 /var/lib/powerback/deltas /var/lib/powerback/snapshots
   sudo chmod 2775 /var/lib/powerback/pfp
   ```

2. **Deploy code changes** (with new path configuration)

3. **Verify migration:**
   - Check that watchers can read existing deltas/snapshots
   - Verify new writes go to `/var/lib/powerback`
   - Confirm old files in deploy tree are no longer used

4. **Cleanup (after verification):**

   ```bash
   # Backup first!
   sudo tar -czf /tmp/deploy-tree-snapshots-backup.tar.gz /home/deploy/app/snapshots /home/deploy/app/jobs/deltas

   # After confirming new location works, remove old files
   # (Keep backup for safety)
   ```

## Environment Variable

Add to production environment:

```bash
PERSISTENT_DATA_DIR=/var/lib/powerback
```

This allows override if needed, though default is appropriate for production.

## Testing Checklist

- [ ] Delta files persist across deployments
- [ ] Snapshot files persist across deployments
- [ ] PFP files persist across deployments (via symlink)
- [ ] Symlink is recreated correctly on each deployment
- [ ] Watchers can read existing deltas/snapshots after migration
- [ ] New delta entries append correctly
- [ ] New snapshot writes succeed
- [ ] User profile picture uploads work correctly
- [ ] Systemd service has proper permissions
- [ ] Deploy script doesn't touch persistent data
- [ ] Logs confirm writes to new locations

## Risk Mitigation

1. **Backup before migration**: Create full backup of existing deltas/snapshots
2. **Gradual rollout**: Test in staging/dev first
3. **Verification**: Confirm reads/writes work before removing old files
4. **Monitoring**: Watch logs for path errors after deployment
5. **Rollback plan**: Keep old path logic as fallback during transition

## Summary

This architectural change separates deploy artifacts from persistent state, protecting critical audit trail data (deltas) and user-uploaded files (pfp) from accidental deletion during deployments. The solution:

- Moves persistent data to `/var/lib/powerback` (FHS-compliant)
- Uses symlinks to redirect application writes to persistent storage
- Updates all path references to use centralized configuration
- Maintains backward compatibility during migration
- Aligns with systemd hardening requirements
- Minimal code changes with clear separation of concerns
- User uploads survive deployments via symlink to persistent storage
