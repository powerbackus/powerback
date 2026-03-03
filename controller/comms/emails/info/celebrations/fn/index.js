/**
 * @fileoverview Utility functions for formatting donation email content
 *
 * This module exports utility functions used by donation email templates
 * to format politician and bill information into human-readable strings
 * suitable for email display. These utilities handle missing or incomplete
 * data gracefully by providing appropriate fallback values.
 *
 * @module controller/comms/emails/info/donations/utils
 * @requires ./deliminate
 * @requires ./denominate
 */

const { deliminate } = require('./deliminate'),
  { denominate } = require('./denominate');

/**
 * Utility functions for donation email formatting
 *
 * @exports utils
 * @property {Function} deliminate - Formats politician information into readable strings
 * @property {Function} denominate - Formats bill information into HTML links
 *
 * @example
 * ```javascript
 * const { deliminate, denominate } = require('./utils');
 *
 * // Format politician name
 * const politicianName = deliminate(politicianObject);
 *
 * // Format bill information
 * const billLink = denominate(billObject);
 * ```
 */
module.exports = { deliminate, denominate };
