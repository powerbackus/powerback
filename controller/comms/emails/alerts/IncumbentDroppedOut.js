const { createEmailTemplate, emailUtils } = require('../template');
const { NON_REFUNDABLE_POLICY } = require('../utils/celebrations');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  IncumbentDroppedOut: (firstName, state, district, incumbentName) => {
    const content = `
      ${emailUtils.createHeading('Incumbent Status Update', 1)}
      
      ${emailUtils.createParagraph(`Dear ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Race Status Change:</strong> ${
          incumbentName || 'Your Representative'
        } in ${state}-${district} is no longer seeking re-election.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        'Because this Representative is no longer running for office, any Celebrations targeting them can no longer be fulfilled. These Celebrations have been converted to defunct status.'
      )}
      
      ${emailUtils.createInfoBox(NON_REFUNDABLE_POLICY, 'warning')}
      
      ${emailUtils.createParagraph(
        'Thank you for your support of POWERBACK.us and our mission to hold Representatives accountable.'
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${emailUtils.createLink('POWERBACK.us', PB_URL)} Team
      `,
        { textAlign: 'center' }
      )}
      
      ${emailUtils.createParagraph(
        `Questions? Call us at ${PHONE_NUMBER} or email ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}`,
        { textAlign: 'center', fontSize: '12px' }
      )}
    `;

    return [
      3, // alerts-noreply@powerback.us
      `POWERBACK.us: Incumbent Status Update for ${state}-${district}`,
      createEmailTemplate(content),
      EMAIL_TOPICS.districtUpdates,
    ];
  },
};
