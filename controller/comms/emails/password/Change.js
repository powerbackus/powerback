const { createEmailTemplate, emailUtils } = require('../template');
const { SUPPORT_EMAIL, PROD_URL } = require('../utils/celebrations');

module.exports = {
  Change: async (firstName) => {
    const content = `
      ${emailUtils.createHeading('Your POWERBACK.us password was changed', 1)}
      
      ${emailUtils.createParagraph(`Hi ${firstName ?? 'Powerbacker'},`)}
      
      ${emailUtils.createParagraph(
        'This email confirms that the password for your POWERBACK.us account was recently changed.'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>If this was you:</strong><br/>
        • No further action is needed.<br/>
        • You can sign in with your new password as usual.
      `,
        'warning'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>If this was not you:</strong><br/>
        • Go to the POWERBACK.us login page and reset your password immediately.<br/>
        • Then contact us so we can review any recent activity on your account.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        `If you suspect your account has been accessed without your permission, email us at ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )} and we'll help you lock things down.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The POWERBACK.us Team<br/>
        ${emailUtils.createLink('POWERBACK.us', PROD_URL)}
      `,
        { textAlign: 'center' }
      )}
    `;

    return [
      1, // account-security-noreply@powerback.us
      'Your POWERBACK.us password was changed',
      createEmailTemplate(content),
    ];
  },
};
