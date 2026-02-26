const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  ChallengerReappeared: (firstName, state, district, incumbentName) => {
    const content = `
      ${emailUtils.createHeading('Challenger Returns', 1)}
      
      ${emailUtils.createParagraph(`Dear ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Competitive Race Resumed:</strong> A serious challenger has entered the race against ${
          incumbentName || 'your Representative'
        } in ${state}-${district}. This makes your voice now more important than ever.
      `,
        'success'
      )}
      
      ${emailUtils.createParagraph(
        "Because you've previously supported initiatives in this district, we wanted to make sure you're aware of this development. A competitive race means increased attention on constituent concerns."
      )}
      
      ${emailUtils.createParagraph(
        'Any dormant Celebrations you have in this district will now automatically reactivate. You may visit your Account section to review your Celebrations or request a receipt.'
      )}
      
      ${emailUtils.createButton('Review Your Celebrations', PB_URL)}
      
      ${emailUtils.createParagraph(
        'Thank you for your continued engagement in this fight. Your voice matters most when representatives feel the pressure of competition. Please check your Account for information about increasing your donation limits.'
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
      `POWERBACK.us: Challenger Returns to ${state}-${district}`,
      createEmailTemplate(content),
      EMAIL_TOPICS.districtUpdates,
    ];
  },
};
