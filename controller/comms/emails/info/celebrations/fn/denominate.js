const logger = require('../../../../../../services/utils/logger')(__filename);

/**
 * @fileoverview Utility function for formatting bill information in email templates
 *
 * This module provides the `denominate` function which formats bill information
 * into an HTML link with descriptive text for display in email templates. It
 * creates clickable links to Congress.gov while handling missing data gracefully.
 *
 * @module controller/comms/emails/info/donations/utils/denominate
 * @requires ../../../../../../services/logger
 */

module.exports = {
  /**
   * Formats bill information into an HTML link for email display
   *
   * This function takes a bill object (typically from Congress.gov API)
   * and formats it into an HTML anchor tag with descriptive text suitable
   * for email templates. It creates clickable links to the official
   * bill page on Congress.gov.
   *
   * @async
   * @function denominate
   * @param {Object} bill - The bill object to format
   * @param {string} [bill.bill] - Bill identifier (e.g., "hr1234-118", "sjres54-119")
   * @param {string} [bill.short_title] - Short descriptive title of the bill
   * @param {string} [bill.congressdotgov_url] - URL to the bill on Congress.gov
   * @returns {string} HTML anchor tag with bill information
   *
   * @example
   * ```javascript
   * const bill = {
   *   bill: "hr1234-118",
   *   short_title: "Medicare for All Act of 2025",
   *   congressdotgov_url: "https://www.congress.gov/bill/118th-congress/house-bill/1234"
   * };
   *
   * const result = denominate(bill);
   * // Returns: '<a href='https://www.congress.gov/bill/118th-congress/house-bill/1234'>hr1234-118</a> - Medicare for All Act of 2025'
   * ```
   *
   * @example
   * ```javascript
   * // Handles missing data gracefully
   * const incomplete = {};
   * const result = denominate(incomplete);
   * // Returns: '<a href='#'>Unknown Bill</a> - No Title Available'
   * ```
   *
   * @throws {Error} Logs errors but returns fallback HTML instead of throwing
   */
  denominate: (bill) => {
    try {
      // Check if bill and required properties exist
      if (!bill) {
        return 'Unknown Bill';
      }

      const billId = bill.bill || 'Unknown Bill';
      const shortTitle = bill.short_title || 'No Title Available';
      const congressUrl = bill.congressdotgov_url || '#';

      return `<a href='${congressUrl}'>${billId}</a> - ${shortTitle}`;
    } catch (error) {
      logger.error('Error in denominate function:', error);
      return 'Unknown Bill';
    }
  },
};
