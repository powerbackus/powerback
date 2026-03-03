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
 * Get directory for snapshot files
 */
function getSnapshotsDir() {
  return path.join(getPersistentDataDir(), 'snapshots');
}

/**
 * Get directory for delta files (permanent audit trail)
 * Development: project root/jobs/deltas
 * Production: /var/lib/powerback/deltas
 */
function getDeltasDir() {
  const baseDir = getPersistentDataDir();
  if (process.env.NODE_ENV === 'production') {
    return path.join(baseDir, 'deltas');
  }
  return path.join(baseDir, 'jobs', 'deltas');
}

module.exports = {
  getPersistentDataDir,
  getSnapshotsDir,
  getDeltasDir,
};
