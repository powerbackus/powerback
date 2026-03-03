/**
 * @fileoverview Email Address Configuration Module
 *
 * This module provides email address configuration and retrieval functions.
 * It manages the mapping of address indices to email addresses and provides
 * a function to construct full email addresses from indices. Address indices
 * correspond to specific email addresses used for different purposes (info,
 * security, alerts, etc.).
 *
 * EMAIL ADDRESSES
 *
 * Address indices and their purposes:
 * - 0: info-noreply - Most frequently used, general information emails
 * - 1: account-security-noreply - Account security and authentication emails
 * - 2: jonathan - Personal emails from founder
 * - 3: alerts-noreply - Alert and notification emails
 * - 4: error-reporter - Error reporting and system notifications
 * - 5: outreach - Outreach and marketing emails
 * - 6: support - Customer support emails
 *
 * BUSINESS LOGIC
 *
 * ADDRESS CONSTRUCTION
 * - Format: "{BRANDED_DOMAIN} <{address}@{EMAIL_DOMAIN}>"
 * - Example: "POWERBACK.us <info-noreply@powerback.us>"
 * - Uses environment variables for domain configuration
 *
 * DEPENDENCIES
 * - process.env.BRANDED_DOMAIN: Branded domain name
 * - process.env.EMAIL_DOMAIN: Email domain name
 *
 * @module controller/comms/addresses
 */

const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env.local'),
  });
}

const BRANDED_DOMAIN = process.env.BRANDED_DOMAIN;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;
const L = `${BRANDED_DOMAIN} <`;
const R = `@${EMAIL_DOMAIN}>`;

const addresses = [
  'info-noreply', // 0 - most frequently used
  'account-security-noreply', // 1 - frequently used
  'jonathan', // 2 - founder; display name includes name + brand
  'alerts-noreply', // 3 - frequently used
  'error-reporter', // 4 - occasionally used
  'outreach', // 5 - occasionally used
  'support', // 6 - occasionally used
];

/** Index of founder address (special display name). */
const FOUNDER_ADDRESS_INDEX = 2;

module.exports = {
  /**
   * Gets full email address from address index
   *
   * This function constructs a full email address string from an address index.
   * The address includes the branded domain name and email domain configured
   * in environment variables. The founder address (index 2) uses the display
   * name "Jonathan Alpart".
   *
   * @param {number} idx - Address index (0-6)
   * @returns {string} Full email address string
   *
   * @example
   * ```javascript
   * const { getEmailAddress } = require('./controller/comms/addresses');
   * const address = getEmailAddress(0);
   * // Returns: "POWERBACK.us <info-noreply@powerback.us>"
   * const founderAddress = getEmailAddress(2);
   * // Returns: "Jonathan Alpart (jonathan@powerback.us) <jonathan@powerback.us>"
   * ```
   */
  getEmailAddress: (idx) => {
    const localPart = addresses[idx];
    if (idx === FOUNDER_ADDRESS_INDEX) {
      const addr = `${localPart}@${EMAIL_DOMAIN}`;
      return `Jonathan Alpart (${addr}) <${addr}>`;
    }
    return L + localPart + R;
  },
};
