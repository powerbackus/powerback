/**
 * @fileoverview Submit contributing inquiry
 *
 * Sends an email to the contributors address when someone submits the
 * contributing form from the Support page. No authentication required.
 *
 * @module controller/comms/submitContributing
 */

const logger = require('../../services/utils/logger')(__filename);
const { APP } = require('../../constants');
const { sendEmail } = require('./sendEmail');
const { emails } = require('./emails');

/**
 * Submits a contributing inquiry by sending an email to contributors
 *
 * @param {Object} body - Validated request body
 * @param {string} body.name - Submitter name
 * @param {string} body.email - Submitter email
 * @param {string} [body.githubUrl] - Optional GitHub profile or repo URL
 * @param {string} [body.message] - Optional message
 * @returns {Promise<{ success: boolean }>}
 */
async function submitContributing(body) {
  const { name, email, githubUrl, message } = body;
  const to = APP.EMAIL.CONTRIBUTE;

  try {
    await sendEmail(
      to,
      emails.ContributingInquiry,
      name,
      email,
      githubUrl || '',
      message || ''
    );
    logger.info('Contributing inquiry sent');
    return { success: true };
  } catch (err) {
    logger.error('Contributing inquiry send failed', {
      error: err.message,
    });
    throw err;
  }
}

module.exports = { submitContributing };
