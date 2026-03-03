const logger = require('../../../../../../services/utils/logger')(__filename);

/**
 * @fileoverview Utility function for formatting politician names in email templates
 *
 * This module provides the `deliminate` function which formats politician information
 * into a human-readable string for display in email templates. It handles missing
 * or incomplete data gracefully by providing fallback values.
 *
 * @module controller/comms/emails/info/donations/utils/deliminate
 * @requires ../../../../../../services/logger
 */

module.exports = {
  /**
   * Formats politician information into a readable string for email display
   *
   * This function takes a politician object (typically from Congress.gov API)
   * and formats it into a standardized string representation suitable for
   * email templates. It handles various edge cases where data might be
   * missing or incomplete.
   *
   * @async
   * @function deliminate
   * @param {Object} donee - The politician object to format
   * @param {Object} [donee.roles] - Array of political roles/positions
   * @param {Object} [donee.roles[0]] - Primary role object
   * @param {string} [donee.roles[0].short_title] - Abbreviated title (e.g., "Rep.", "Sen.")
   * @param {string} [donee.roles[0].state] - State abbreviation (e.g., "NY", "CA")
   * @param {string} [donee.first_name] - Politician's first name
   * @param {string} [donee.last_name] - Politician's last name
   * @returns {string} Formatted politician name string
   *
   * @example
   * ```javascript
   * const politician = {
   *   first_name: "Alexandria",
   *   last_name: "Ocasio-Cortez",
   *   roles: [{
   *     short_title: "Rep.",
   *     state: "NY"
   *   }]
   * };
   *
   * const result = deliminate(politician);
   * // Returns: "Rep. Alexandria Ocasio-Cortez from NY"
   * ```
   *
   * @example
   * ```javascript
   * // Handles missing data gracefully
   * const incomplete = { roles: [] };
   * const result = deliminate(incomplete);
   * // Returns: "Unknown Representative"
   * ```
   *
   * @throws {Error} Logs errors but returns fallback string instead of throwing
   */
  deliminate: (donee) => {
    try {
      // Check if donee and required properties exist
      if (!donee || !donee.roles || !donee.roles[0]) {
        return 'Unknown Representative';
      }

      const role = donee.roles[0];
      const shortTitle = role.short_title || 'Rep.';
      const firstName = donee.first_name || '';
      const lastName = donee.last_name || 'Unknown';
      const state = role.state || 'Unknown State';

      return `${shortTitle} ${firstName} ${lastName} from ${state}`;
    } catch (error) {
      logger.error('Error in deliminate function:', error);
      return 'Unknown Representative';
    }
  },
};
