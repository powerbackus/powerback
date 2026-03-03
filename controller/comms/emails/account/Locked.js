const { formatInCST } = require('../utils/timezone');
const { createEmailTemplate, emailUtils } = require('../template');

const PB_URL = process.env.PROD_URL,
  PB_LINK = emailUtils.createLink('POWERBACK.us', PB_URL),
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  Locked: (firstName) => {
    const content = `
      ${emailUtils.createHeading('Account Security Alert', 1)}
      
      ${emailUtils.createParagraph(`Dear ${firstName ?? 'Powerbacker'},`)}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Security Notice:</strong> This is an automated response to a suspicious attempt to change the password of your account.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        `A failed request for a password change associated with your account occurred on ${formatInCST(
          Date.now()
        )}. For your security, your account has been temporarily locked for 24 hours.`
      )}
      
      ${emailUtils.createParagraph(
        `If this was you and done in error, simply return to ${PB_LINK} and click "Forgot Password?" at the Sign-in prompt. We will send you another email from this same address with a unique link to securely set a new password, which you'll be able to use after the lock is lifted.`
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Important:</strong> If you either a) never requested a password change or b) did make the request but had not yet followed the link to proceed with the change, your email and/or ${PB_LINK} account may have been compromised.
      `,
        'warning'
      )}
      
      ${emailUtils.createParagraph(
        `If you suspect your account has been compromised, please contact us at ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )} immediately, and perhaps from a different email address.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${PB_LINK} Team<br/>
      `,
        { textAlign: 'center' }
      )}
    `;

    return [
      1, // account-security-noreply@powerback.us
      'Your POWERBACK.us account has been locked',
      createEmailTemplate(content),
    ];
  },
};
