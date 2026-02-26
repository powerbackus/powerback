/**
 * @fileoverview Image Error Notification Controller
 *
 * This controller handles reporting image loading errors from the frontend.
 * It sends error notifications to administrators when politician profile images
 * or other image assets fail to load, helping identify and fix image issues.
 *
 * BUSINESS LOGIC
 *
 * ERROR REPORTING
 * - Receives image error reports from frontend
 * - Sends notification email to administrator
 * - Includes politician information for context
 * - Helps identify broken image URLs or missing assets
 *
 * EMAIL NOTIFICATION
 * - Sends to FIRST_CITIZEN (primary admin email)
 * - Uses Image error email template
 * - Includes politician ID/name for reference
 *
 * DEPENDENCIES
 * - controller/comms: Email sending
 * - controller/comms/emails: Email templates
 * - process.env.EMAIL_JONATHAN_USER: Administrator email address
 *
 * @module controller/sys/notifyImageErr
 * @requires ../comms
 * @requires ../comms/emails
 */

const path = require('path');
const { emails } = require('../comms/emails');
const { sendEmail } = require('../comms');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env.local'),
  });
}

const FIRST_CITIZEN = process.env.EMAIL_JONATHAN_USER;

module.exports = {
  /**
   * Sends image error notification to administrator
   *
   * This function receives image loading error reports from the frontend and
   * sends a notification email to the administrator with the politician information
   * to help identify and fix the image issue.
   *
   * @param {Object} req - Express request object
   * @param {Object} req.body - Error report data
   * @param {string} req.body.pol - Politician ID or name that failed to load image
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Resolves when notification is sent
   *
   * @example
   * ```javascript
   * const { notifyImageErr } = require('./controller/sys/notifyImageErr');
   * await notifyImageErr(req, res);
   * ```
   */
  notifyImageErr: (req, res) => {
    const sent = sendEmail(FIRST_CITIZEN, emails.Image, req.body.pol);
    if (sent) res.json(true);
  },
};
