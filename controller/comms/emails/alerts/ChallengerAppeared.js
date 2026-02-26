const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');
const {
  createSeriousChallengerExplanationSection,
} = require('../utils/celebrations');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  ChallengerAppeared: (firstName, state, district, incumbentName) => {
    const content = `
      ${emailUtils.createHeading('Challenger Alert', 1)}
      
      ${emailUtils.createParagraph(
        `Dear ${firstName || 'Fellow Powerbacker'},`
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Competitive Race Alert:</strong> A serious challenger has entered the race against ${
          incumbentName || 'your Representative'
        } in ${state}-${district}.
      `,
        'warning'
      )}
      
      ${createSeriousChallengerExplanationSection()}
      
      ${emailUtils.createParagraph(
        "This development could affect any Celebrations you've created on POWERBACK.us. We encourage you to sign in and review your Celebrations in your Account section."
      )}
      
      ${emailUtils.createButton('Review Your Celebrations', PB_URL)}
      
      ${emailUtils.createParagraph(
        'As the balance of power shifts, your voice matters now more than ever.'
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        Thank you for standing with us.<br/><br/>
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
      `POWERBACK.us: Challenger Alert for ${state}-${district}`,
      createEmailTemplate(content),
      EMAIL_TOPICS.districtUpdates,
    ];
  },
};
