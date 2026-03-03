/**
 * Email template for contributing inquiry form submissions
 * Sent to contributors@powerback.us when someone submits the contributing form
 *
 * @module controller/comms/emails/info/ContributingInquiry
 */

const { createEmailTemplate, emailUtils } = require('../template');

/**
 * ContributingInquiry template
 * @param {string} name - Submitter name
 * @param {string} email - Submitter email
 * @param {string} [githubUrl] - Optional GitHub profile or repo URL
 * @param {string} [message] - Optional message from submitter
 * @returns {[number, string, string]} [fromIndex, subject, html]
 */
function ContributingInquiry(name, email, githubUrl, message) {
  const content = `
    ${emailUtils.createHeading('Contributing inquiry', 1)}
    ${emailUtils.createParagraph(
      'Someone submitted the contributing form from the Support page.'
    )}
    ${emailUtils.createInfoBox(
      `
      <strong>Name:</strong> ${name}<br/>
      <strong>Email:</strong> ${email}<br/>
      ${githubUrl ? `<strong>GitHub:</strong> ${emailUtils.createLink(githubUrl, githubUrl)}<br/>` : ''}
      ${message ? `<strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}` : ''}
    `,
      'info'
    )}
  `;

  return [0, 'Contributing inquiry', createEmailTemplate(content, { showFooter: false })];
}

module.exports = { ContributingInquiry };
