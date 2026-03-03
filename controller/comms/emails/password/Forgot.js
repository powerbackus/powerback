const { createEmailTemplate, emailUtils } = require('../template');

const SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  PROD_URL = process.env.PROD_URL;

const PB_LINK = emailUtils.createLink('POWERBACK.us', PROD_URL);

module.exports = {
  Forgot: (hash, firstName, URI_ROOT) => {
    const URI = URI_ROOT + 'reset/' + hash;

    const content = `
      ${emailUtils.createHeading('Reset your POWERBACK.us password', 1)}
      
      ${emailUtils.createParagraph(
        `Hi ${firstName ?? 'Powerbacker'},`
      )}
      
      ${emailUtils.createParagraph(
        'We received a request to reset the password for your POWERBACK.us account.'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>How this works:</strong><br/>
        • Click the button below to choose a new password<br/>
        • The link is valid for the next 24 hours<br/>
        • If you didn't request this, you can safely ignore this email
      `,
        'info'
      )}
      
      ${emailUtils.createButton('Reset password', URI, {
        backgroundColor: '#ff4444',
        textColor: '#ffffff',
      })}
      
      ${emailUtils.createParagraph(
        `If the link expires, just go back to ${PB_LINK} and click “Forgot password?” on the login screen. We'll send you a fresh reset link.`
      )}
      
      ${emailUtils.createParagraph(
        `If you suspect someone else requested this, it's a good idea to reset your password anyway and avoid reusing passwords from other sites.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createSignature('official')}
      
      ${emailUtils.createParagraph(
        `Problems or questions? Call us at ${PHONE_NUMBER} or email ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}`,
        { textAlign: 'center', fontSize: '12px' }
      )}
    `;

    return [
      1, // account-security-noreply@powerback.us
      'Reset your POWERBACK.us password',
      createEmailTemplate(content),
    ];
  },
};
