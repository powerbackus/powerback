const { createEmailTemplate, emailUtils } = require('../template');

const PROD_URL = process.env.PROD_URL,
  BRANDED_DOMAIN = process.env.BRANDED_DOMAIN || 'POWERBACK.us',
  POSITION_PAPER_PATH = process.env.REACT_APP_POSITION_PAPER_PATH || 'position-paper.pdf';

const POSITION_PAPER_LINK = emailUtils.createLink(
  'Read the position paper',
  `${PROD_URL}${POSITION_PAPER_PATH}`
);
const PB_LINK = emailUtils.createLink(BRANDED_DOMAIN, PROD_URL);

module.exports = {
  JoinedUp: (firstName) => {
    const content = `
      ${emailUtils.createHeading(`Your ${BRANDED_DOMAIN} Account is now Active!`, 1)}
      
      ${emailUtils.createParagraph(
        `Dear ${firstName ?? 'Newest Powerbacker'},`
      )}

      ${emailUtils.createParagraph(
        `Great news! Your ${BRANDED_DOMAIN} account is now active and ready to make a difference. Thank you for confirming your email address.`
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Welcome to the Community!</strong><br/>
        You are a special part of our community, and your actions have a meaningful impact on the causes we support. Your involvement brings the power back to the people every day.
      `,
        'success'
      )}    
      
      ${emailUtils.createParagraph(
        `Feel free to log in and explore the ${PB_LINK} platform, create Celebrations, and be part of something extraordinary`
      )}
      
      ${emailUtils.createParagraph(
        'Please forward this email to a friend or, better yet, a neighbor. Together we can ensure that those who are given the honor of representing the American people will never take one of your hard-earned dollars for granted ever again.'
      )}

      ${emailUtils.createInfoBox(
        `
        <strong>Want to learn more?</strong><br/>
        Our position paper explains the technical and legal framework behind ${BRANDED_DOMAIN}, including how conditional donations work, FEC compliance, and the mechanics of the escrow system. ${POSITION_PAPER_LINK} to dive deeper into how we're changing political donations.
      `,
        'info'
      )}
      
      ${emailUtils.createButton(`Visit ${BRANDED_DOMAIN}`, PROD_URL)}
      
      ${emailUtils.createParagraph(
        "I look forward to the positive change we'll create together.",
        { textAlign: 'left' }
      )}
      
      ${emailUtils.createSignature('jonathan')}
    `;

    return [
      2, // jonathan@powerback.us
      `Your ${BRANDED_DOMAIN} Account is now Active!`,
      createEmailTemplate(content),
    ];
  },
};
