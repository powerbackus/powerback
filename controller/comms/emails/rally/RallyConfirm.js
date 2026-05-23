/**
 * @fileoverview Rally email list double opt-in confirmation template.
 * @module controller/comms/emails/rally/RallyConfirm
 */

const urlJoin = require('url-join').default;
const { createEmailTemplate, emailUtils } = require('../template');

const PB_URL = process.env.PROD_URL;

module.exports = {
  RallyConfirm: (confirmToken, URI_ROOT) => {
    const CONFIRM_LINK = urlJoin(URI_ROOT, 'rally-confirm', confirmToken);
    const PB_LINK = emailUtils.createLink('POWERBACK.us', PB_URL);

    const content = `
      ${emailUtils.createHeading('Confirm your POWERBACK updates', 1)}

      ${emailUtils.createParagraph(
        'You signed up on the POWERBACK Rally page for occasional movement updates — news about the project and how to help spread the word.'
      )}

      ${emailUtils.createInfoBox(
        `
        <strong>Confirm your subscription:</strong><br/>
        • Click the button below to confirm this address<br/>
        • If you did not request this, you can ignore this email
      `,
        'info'
      )}

      ${emailUtils.createButton('Confirm subscription', CONFIRM_LINK)}

      ${emailUtils.createParagraph(
        `If the button does not work, copy and paste this link into your browser:<br/>
        <a href="${CONFIRM_LINK}">${CONFIRM_LINK}</a>`
      )}

      ${emailUtils.createParagraph(
        'After you confirm, you may unsubscribe from future movement emails using the link in those messages.'
      )}

      ${emailUtils.createDivider()}

      ${emailUtils.createParagraph(`The ${PB_LINK} Team`, {
        textAlign: 'center',
      })}
    `;

    return [
      5,
      'Confirm your POWERBACK movement updates',
      createEmailTemplate(content),
    ];
  },
};
