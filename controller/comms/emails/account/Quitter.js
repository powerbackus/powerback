const { createEmailTemplate, emailUtils, COLORS } = require('../template');

const SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  Quitter: (firstName) => {
    const content = `
      ${emailUtils.createHeading('Account Deletion Confirmation', 1)}
      
      ${emailUtils.createParagraph(
        `Dear ${firstName ? firstName : 'Former Powerbacker'},`
      )}
      
      ${emailUtils.createParagraph(
        "Hi, this is Jonathan with POWERBACK.us letting you know that your account has been removed. If you have any questions or matters you would like to discuss about this service, please don't hesitate to reach out to me personally at this email address."
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Important Notice:</strong> Any pending Celebrations of yours that were being withheld at the time of your account deletion must remain there and cannot be refunded. Upon contingency, they will be released and delivered according to your previous choices.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        `If you would like to reinstate your account or otherwise access, or forever-delete, any of your old data, please email the team at ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}.`
      )}
      
      ${emailUtils.createParagraph(
        'I appreciate everything you have contributed, and wish you the best!'
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createSignature('secure', {
        textColor: COLORS.hardAccent,
      })}
    `;

    return [
      2, // jonathan@powerback.us
      'Your POWERBACK.us account has been deleted',
      createEmailTemplate(content),
    ];
  },
};
