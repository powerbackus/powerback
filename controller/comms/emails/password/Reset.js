const { createEmailTemplate, emailUtils } = require('../template');
const { SUPPORT_EMAIL, PROD_URL } = require('../utils/celebrations');

module.exports = {
  Reset: async (firstName) => {
    const content = `
      ${emailUtils.createHeading('Your POWERBACK.us password was reset', 1)}
      
      ${emailUtils.createParagraph(
        `Hi ${firstName ? firstName : 'Powerbacker'},`
      )}
      
      ${emailUtils.createParagraph(
        'This email confirms that the password for your POWERBACK.us account was just reset using the link we sent.'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>If this was you:</strong><br/>
        • Your new password is now active<br/>
        • You can sign in with it going forward<br/>
        • No further action is needed
      `,
        'info'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>If this was not you:</strong><br/>
        • Go to the POWERBACK.us login page and reset your password again<br/>
        • Avoid reusing passwords from other sites<br/>
        • Then contact us so we can review recent activity on your account
      `,
        'warning'
      )}
      
      ${emailUtils.createParagraph(
        `If you think someone else may have used your reset link, email us at ${emailUtils.createLink(
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
      'Your POWERBACK.us password was reset',
      createEmailTemplate(content),
    ];
  },
};
