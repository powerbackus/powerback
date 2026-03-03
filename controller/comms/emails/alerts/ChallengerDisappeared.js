const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');
const {
  createSeriousChallengerExplanationSection,
} = require('../utils/celebrations');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  ChallengerDisappeared: (firstName, state, district, incumbentName) => {
    const content = `
      ${emailUtils.createHeading('Challenger Status Update', 1)}
      
      ${emailUtils.createParagraph(`Dear ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Race Status Change:</strong> ${
          incumbentName || 'Your Representative'
        } in ${state}-${district} no longer has a serious challenger on record.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        'Without a serious challenger, this race is no longer considered competitive. Any Celebrations targeting this Representative have now entered a dormant state.'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Dormant Celebrations:</strong> Dormant Celebrations do not disappear. They are safely stored and will automatically reactivate if a serious challenger enters, or re-enters, to the race.
      `,
        'info'
      )}

      ${createSeriousChallengerExplanationSection()}
      
      ${emailUtils.createParagraph(
        'You may visit your Account section to review your Celebrations or request a receipt.'
      )}
      
      ${emailUtils.createButton('View Your Celebrations', PB_URL)}
      
      ${emailUtils.createParagraph(
        'Thank you for your patience. Our collective leverage depends on holding out, and your presence is what gives it power.'
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
      `POWERBACK.us: Challenger Status Update for ${state}-${district}`,
      createEmailTemplate(content),
      EMAIL_TOPICS.districtUpdates,
    ];
  },
};
