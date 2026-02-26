/**
 * @fileoverview Snapshot Management Utility Module
 *
 * This module provides utilities for managing snapshots and deltas used by
 * background watcher jobs. Snapshots store previous state for comparison,
 * and deltas log all changes over time for audit and debugging purposes.
 *
 * KEY FUNCTIONS
 *
 * loadSnapshot(name)
 * - Loads previous snapshot from disk
 * - Returns empty object if snapshot doesn't exist
 * - Used for comparison with current state
 *
 * saveSnapshot(name, data)
 * - Saves current state as new snapshot
 * - Uses atomic write to prevent corruption
 * - Overwrites previous snapshot
 *
 * diffSnapshot({ name, current, keyFn, compareFn })
 * - Compares current state with previous snapshot
 * - Detects changes, additions, and removals
 * - Saves new snapshot automatically
 * - Appends changes to delta log
 *
 * appendDelta(name, entry)
 * - Appends change entry to delta log
 * - Delta log is array of all changes over time
 * - Used for audit trail and debugging
 *
 * BUSINESS LOGIC
 *
 * SNAPSHOT FORMAT
 * - Stored as JSON files in snapshots directory
 * - Format: Object with keys from keyFn(item)
 * - Values are full item objects
 *
 * DELTA FORMAT
 * - Stored as JSON array in deltas directory
 * - Each entry has: date, key, old, new
 * - Changes and removals both logged
 *
 * CHANGE DETECTION
 * - Uses keyFn to identify items
 * - Uses compareFn to detect changes
 * - Tracks additions (new keys)
 * - Tracks removals (missing keys)
 * - Tracks modifications (changed values)
 *
 * ATOMIC WRITES
 * - Uses writeJsonAtomic for safe file writes
 * - Prevents corruption during concurrent writes
 * - Ensures data integrity
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - constants/paths: Snapshot and delta directory paths
 * - services/utils/writeJsonAtomic: Atomic file writing
 *
 * @module jobs/snapshotManager
 * @requires fs
 * @requires path
 * @requires ../constants/paths
 * @requires ../services/utils/writeJsonAtomic
 */

const fs = require('fs');
const path = require('path');
const { getDeltasDir, getSnapshotsDir } = require('../constants/paths');

function getPaths(name) {
  return {
    snapshotPath: path.join(
      getSnapshotsDir(),
      `${name}.snapshot.json`
    ),
    deltaPath: path.join(
      getDeltasDir(),
      `${name}.delta.json`
    ),
  };
}

function loadSnapshot(name) {
  const { snapshotPath } = getPaths(name);
  try {
    return JSON.parse(fs.readFileSync(snapshotPath));
  } catch {
    return {};
  }
}

function saveSnapshot(name, data) {
  const { snapshotPath } = getPaths(name);
  const { writeJsonAtomic } = require('../services/utils/writeJsonAtomic');
  writeJsonAtomic(snapshotPath, data);
}

function appendDelta(name, entry) {
  const { deltaPath } = getPaths(name);
  const log = fs.existsSync(deltaPath)
    ? JSON.parse(fs.readFileSync(deltaPath))
    : [];
  log.push(entry);
  const { writeJsonAtomic } = require('../services/utils/writeJsonAtomic');
  writeJsonAtomic(deltaPath, log);
}

function diffSnapshot({ name, current, keyFn, compareFn }) {
  const previous = loadSnapshot(name);
  const changes = [];
  const removals = [];

  // Track current keys for removal detection
  const currentKeys = new Set();

  // Detect changes in existing items and new items
  for (const item of current) {
    const key = keyFn(item);
    currentKeys.add(key);
    const prior = previous[key];
    const isChanged = !prior || compareFn(item, prior);
    if (isChanged) {
      changes.push({ key, old: prior || null, new: item });
    }
  }

  // Detect removals: items in previous snapshot but not in current
  for (const [key, prior] of Object.entries(previous)) {
    if (!currentKeys.has(key)) {
      removals.push({ key, old: prior, new: null });
    }
  }

  const nextSnapshot = {};
  for (const item of current) {
    nextSnapshot[keyFn(item)] = item;
  }

  // Only save snapshot if there are changes or removals
  if (changes.length > 0 || removals.length > 0) {
    saveSnapshot(name, nextSnapshot);
  }

  // Log both changes and removals to delta
  [...changes, ...removals].forEach((change) =>
    appendDelta(name, {
      date: new Date().toISOString(),
      ...change,
    })
  );

  return { changes, removals };
}

module.exports = {
  appendDelta,
  appendChangelog: appendDelta, // Keep backward compatibility
  diffSnapshot,
  loadSnapshot,
  saveSnapshot,
};
