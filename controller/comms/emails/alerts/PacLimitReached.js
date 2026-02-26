const { createEmailTemplate, emailUtils } = require('../template');

const PB_URL = process.env.PROD_URL,
  PB_LINK = emailUtils.createLink('POWERBACK.us', PB_URL);

/**
 * PAC Limit Reached Email Template
 *
 * Sent when a user reaches their $5,000 annual PAC limit for tips.
 * This is a one-time notification that explains the limit and what it means.
 *
 * @param {string} firstName - User's first name
 * @param {number} totalTips - Total amount of tips given this year
 * @param {number} pacLimit - PAC limit amount (should be 5000)
 * @returns {Object} Email template object
 */
const PacLimitReached = (firstName, totalTips = 0, pacLimit = 5000) => {
  const totalTipsDisplay = `$${totalTips.toLocaleString()}`;
  const pacLimitDisplay = `$${pacLimit.toLocaleString()}`;

  const content = `
    ${emailUtils.createHeading(`You've reached your annual PAC tip limit.`, 1)}
    
    ${emailUtils.createParagraph(`Hi ${firstName || 'Powerbacker'},`)}
    
    ${emailUtils.createParagraph(
      `You've reached your annual PAC (Political Action Committee) limit of ${pacLimitDisplay} in tips to ${PB_LINK}.`
    )}
    
    ${emailUtils.createInfoBox(
      `
      <strong>What this means in practice:</strong><br/>
      • You've given ${totalTipsDisplay} in tips to ${PB_LINK} this year<br/>
      • That's the maximum allowed under current FEC rules for PAC contributions<br/>
      • You can still create Celebrations and send money to politicians as usual<br/>
      • Only tips to ${PB_LINK} are affected by this limit<br/>
      • The PAC tip limit resets on January 1st
    `,
      'success'
    )}
    
    ${emailUtils.createParagraph(
      `Hitting the legal max for PAC tips in a year is not small. That's ${pacLimitDisplay} from you, directly to ${PB_LINK}—not to a politician, to us. You're backing the protest we're building with real money, and that's an enormous vote of confidence. We don't take it for granted. Thank you for being such a strong supporter; it means more than we can say.`
    )}

    ${emailUtils.createInfoBox(
      `We want to be clear about the constraint: from now until January 1st, we won't be able to accept additional tips to the PAC from you.`,
      'warning'
    )}
    
    ${emailUtils.createParagraph(
      `Nothing else changes. You can still set conditions on donations, create new Celebrations, and move money to campaigns according to your rules.`
    )}
    
    ${emailUtils.createParagraph(
      `If you ever want a breakdown of how your tips and Celebrations have been handled, reply to this email and I'll personally walk through it with you.`
    )}
    
    ${emailUtils.createSignature('jonathan')}
  `;

  return [
    2, // jonathan@powerback.us (founder)
    `🙏 You've Reached Your Annual PAC Tip Limit`,
    createEmailTemplate(content),
  ];
};

module.exports = { PacLimitReached };
