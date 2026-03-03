/**
 * @fileoverview System Utilities Controller Module
 *
 * This module provides system-level utility functions including version information
 * retrieval, application constants access, and error reporting. It serves as the
 * interface for system operations and administrative functions.
 *
 * KEY FUNCTIONS
 *
 * getVersion()
 * - Retrieves application version information
 * - Includes commit hash, branch, deployment timestamp
 * - Multiple fallback mechanisms for reliability
 *
 * pullConstants()
 * - Retrieves safe application constants for frontend
 * - Filters out sensitive constants (API keys, secrets)
 * - Returns FEC limits, app settings, etc.
 *
 * notifyImageErr(req, res)
 * - Reports image loading errors from frontend
 * - Sends notification email to administrators
 * - Helps identify broken image URLs
 *
 * DEPENDENCIES
 * - ./pullConstants: Constants retrieval
 * - ./notifyImageErr: Image error reporting
 * - ./getVersion: Version information
 *
 * @module controller/sys
 * @requires ./pullConstants
 * @requires ./notifyImageErr
 * @requires ./getVersion
 */

const { pullConstants } = require('./pullConstants'),
  { notifyImageErr } = require('./notifyImageErr'),
  { notifyFrontendError } = require('./notifyFrontendError'),
  { getVersion } = require('./getVersion');

module.exports = { pullConstants, notifyImageErr, notifyFrontendError, getVersion };
