/**
 * @fileoverview Atomic JSON File Writing Utility
 *
 * This utility provides crash-safe JSON file writing using a temporary file
 * and atomic rename pattern. It ensures that if the process dies mid-write,
 * the final file remains intact and the temp file can be cleaned up on next run.
 *
 * KEY FEATURES
 *
 * ATOMIC WRITES
 * - Writes to temporary file first
 * - Renames temp file to final file (atomic operation)
 * - Prevents corruption during concurrent writes
 * - Ensures data integrity
 *
 * CRASH SAFETY
 * - If process dies mid-write, final file remains intact
 * - Temp file can be cleaned up on next run
 * - No partial writes to final file
 *
 * FSYNC SUPPORT
 * - Attempts to fsync temp file before rename
 * - Ensures data is written to disk
 * - Handles fsync failures gracefully (non-fatal)
 *
 * BUSINESS LOGIC
 *
 * WRITE PROCESS
 * 1. Create directory if it doesn't exist
 * 2. Serialize data to JSON string
 * 3. Write to temp file (with process ID in name)
 * 4. Fsync temp file (best effort)
 * 5. Atomically rename temp file to final file
 * 6. Clean up temp file on error
 *
 * TEMP FILE NAMING
 * - Format: `.${basename}.tmp.${pid}`
 * - Process ID ensures uniqueness
 * - Dot prefix hides temp files
 *
 * JSON FORMATTING
 * - Consistent indentation (default: 2 spaces)
 * - Trailing newline for clean file endings
 * - Configurable indent via options
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - services/logger: Logging (requireLogger(__filename))
 *
 * @module services/utils/writeJsonAtomic
 * @requires fs
 * @requires path
 * @requires ../logger
 */

const fs = require('fs');
const path = require('path');
const { requireLogger } = require('../logger');

const logger = requireLogger(__filename);

/**
 * Writes JSON data to a file atomically using a temp file + rename pattern.
 *
 * Ensures crash-safety: if the process dies mid-write, the final file remains
 * intact and the temp file can be cleaned up on next run.
 *
 * @param {string} finalPath - Absolute path to the final JSON file
 * @param {any} data - Data to serialize as JSON
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.indent=2] - JSON indentation spaces
 * @throws {Error} If write fails (directory creation, write, or rename)
 */
function writeJsonAtomic(finalPath, data, options = {}) {
  const { indent = 2 } = options;
  const dir = path.dirname(finalPath);
  const basename = path.basename(finalPath);
  const pid = process.pid;
  const tempPath = path.join(dir, `.${basename}.tmp.${pid}`);

  try {
    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });

    // Serialize JSON with consistent formatting (2-space indent + trailing newline)
    const jsonString = JSON.stringify(data, null, indent) + '\n';

    // Write to temp file
    fs.writeFileSync(tempPath, jsonString, 'utf8');

    // Best-effort fsync (may not be available on all systems)
    try {
      const fd = fs.openSync(tempPath, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
    } catch (fsyncError) {
      // Non-fatal: fsync may not be available or may fail
      logger.debug(
        `fsync failed for ${tempPath} (non-fatal):`,
        fsyncError.message
      );
    }

    // Atomic rename (same filesystem required)
    fs.renameSync(tempPath, finalPath);

    logger.debug(`Atomically wrote JSON to ${finalPath}`);
  } catch (error) {
    // Clean up temp file on error
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      logger.warn(
        `Failed to cleanup temp file ${tempPath}:`,
        cleanupError.message
      );
    }

    logger.error(
      `Failed to write JSON atomically to ${finalPath}:`,
      error.message
    );
    throw error;
  }
}

module.exports = { writeJsonAtomic };
