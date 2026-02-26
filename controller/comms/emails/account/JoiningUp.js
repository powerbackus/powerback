const urlJoin = require('url-join').default;
const { createEmailTemplate, emailUtils } = require('../template');

const PB_URL = process.env.PROD_URL;

module.exports = {
  JoiningUp: (sash, firstName, URI_ROOT) => {
    const MAGIC_LINK = urlJoin(URI_ROOT, 'join', sash);
    const PB_LINK = emailUtils.createLink('POWERBACK.us', PB_URL);

    const content = `
      ${emailUtils.createHeading('Activate your POWERBACK.us account', 1)}
      
      ${emailUtils.createParagraph(
        `Hi ${firstName ?? 'Powerbacker'},`
      )}
      
      ${emailUtils.createParagraph(
        `You started creating an account on ${PB_LINK}. To finish setting it up, we need to confirm it's really you.`
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Account activation:</strong><br/>
        • Click the button below to confirm your new account<br/>
        • This link works for about five minutes<br/>
        • If it expires, you can simply start the signup process again to get a new link
      `,
        'info'
      )}
      
      ${emailUtils.createButton('Confirm your account', MAGIC_LINK)}
      
      ${emailUtils.createParagraph(
        `Once you confirm, you'll be able to sign in, set your own password, and start setting conditions on your political donations.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${PB_LINK} Team
      `,
        { textAlign: 'center' }
      )}
    `;

    return [
      1, // account-security-noreply@powerback.us
      'Activate your POWERBACK.us account',
      createEmailTemplate(content),
    ];
  },
};
