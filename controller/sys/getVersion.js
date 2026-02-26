/**
 * @fileoverview Application Version Controller
 *
 * This controller retrieves application version information from multiple sources
 * with fallback mechanisms. It attempts to read from deployment-created version
 * file first, then falls back to git commands, and finally to package.json version.
 *
 * VERSION SOURCES (Priority Order)
 *
 * 1. .version.json FILE (Preferred)
 *    - Created during deployment process
 *    - Contains: commit hash, branch name, deployment timestamp
 *    - Most reliable source in production
 *
 * 2. GIT COMMANDS (Fallback)
 *    - git rev-parse HEAD: Current commit hash
 *    - git rev-parse --abbrev-ref HEAD: Current branch name
 *    - git log -1 --format=%ci: Last commit timestamp
 *    - Used when version file doesn't exist
 *
 * 3. PACKAGE.JSON (Final Fallback)
 *    - Always includes package.json version
 *    - Other fields set to 'unknown' if git unavailable
 *
 * BUSINESS LOGIC
 *
 * VERSION RETRIEVAL FLOW
 * 1. Check if .version.json exists (deployment file)
 * 2. If exists: Parse and return version data
 * 3. If not: Execute git commands to get version info
 * 4. If git fails: Return package.json version with 'unknown' fields
 *
 * ERROR HANDLING
 * - Version file read errors: Fall through to git commands
 * - Git command errors: Fall through to package.json
 * - Always returns valid version object (never throws)
 *
 * DEPENDENCIES
 * - fs: File system operations
 * - path: Path manipulation
 * - child_process: Git command execution
 * - package.json: Package version
 *
 * @module controller/sys/getVersion
 * @requires fs
 * @requires path
 * @requires child_process
 * @requires ../../package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
module.exports = {
  getVersion: () => {
    const packageVersion = require('../../package.json').version;
    const versionPath = path.join(__dirname, '../../.version.json');

    // Try to read version file first (created during deployment)
    try {
      if (fs.existsSync(versionPath)) {
        const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        return {
          packageVersion,
          commit: versionData.commit || 'unknown',
          branch: versionData.branch || 'unknown',
          deployedAt: versionData.deployedAt || 'unknown',
          source: 'version-file',
        };
      }
    } catch (err) {
      // Fall through to git commands
    }

    // Fallback to git commands if version file doesn't exist
    try {
      const repoRoot = path.join(__dirname, '../..');
      const commit = execSync('git rev-parse HEAD', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      const deployedAt = execSync('git log -1 --format=%ci', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      return {
        packageVersion,
        commit,
        branch,
        deployedAt,
        source: 'git',
      };
    } catch (err) {
      // Git not available or not a git repo
      return {
        packageVersion,
        commit: 'unknown',
        branch: 'unknown',
        deployedAt: 'unknown',
        source: 'fallback',
      };
    }
  },
};
