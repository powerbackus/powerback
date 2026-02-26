const accounting = require('accounting');

const { createEmailTemplate, emailUtils } = require('../template'),
  { FEC } = require('../../../../constants'),
  logger = require('../../../../services/utils/logger')(__filename);

const FEC_URL = process.env.FEC_INDIVIDUAL_CONTRIBUTIONS_URL,
  PROD_URL = process.env.PROD_URL;

const BRANDED_DOMAIN = process.env.BRANDED_DOMAIN || 'POWERBACK.us';

module.exports = {
  /**
   * Email template for user compliance promotion
   *
   * This template is sent when a user's compliance tier is upgraded.
   * The email content varies based on the user's new compliance level:
   * - Compliant: $3,500 per donation, $3,500 per candidate per election
   *
   * @param {string} firstName - User's first name
   * @param {string} complianceTier - User's new compliance tier ('compliant')
   * @returns {Array} Email template array [priority, subject, html]
   */
  Promoted: (firstName, complianceTier = 'compliant') => {
    const FEC_LINK = emailUtils.createLink(
      'Individual contributions page',
      FEC_URL
    );
    const PB_LINK = emailUtils.createLink(BRANDED_DOMAIN, PROD_URL);

    // Get compliance info from FEC constants
    // Add safety check for undefined complianceTier
    if (!complianceTier || !FEC.COMPLIANCE_TIERS[complianceTier]) {
      logger.error('Invalid compliance tier:', complianceTier);
      complianceTier = 'compliant'; // fallback to compliant
    }
    const tierInfo = FEC.COMPLIANCE_TIERS[complianceTier];
    const perDonationLimit = accounting.formatMoney(tierInfo.perDonationLimit);

    // Guest limit for comparison - use proper FEC constants
    const guestLimit = accounting.formatMoney(
      FEC.COMPLIANCE_TIERS.guest.perDonationLimit
    );

    let limitDescription, clarificationText;

    if (complianceTier === 'compliant') {
      limitDescription = `up to ${perDonationLimit} per Celebration, per election, per candidate`;
      clarificationText = `To be clear, the maximum ${perDonationLimit} amount is per Celebration - meaning you can deploy multiple contributions of up to ${perDonationLimit} each to any candidate, with limits resetting at election cycles.`;
    }

    const content = `
      ${emailUtils.createHeading(
        `Your ${BRANDED_DOMAIN} Clearance Level Has Been Elevated`,
        1
      )}
      
      ${emailUtils.createParagraph(
        `Dear ${firstName ?? 'Compliant Powerbacker'},`
      )}
      
      ${emailUtils.createParagraph(
        'Your have submitted your complete profile information in compliance with FEC regulations. You are now cleared for maximum contribution limits!'
      )}
      
      ${emailUtils.createInfoBox(
        `You can now deploy ${limitDescription}.`,
        'success'
      )}
      
      ${emailUtils.createParagraph(
        'Contributions will be visible on the public record. (This transparency is required by law regardless of which platform you use.)'
      )}
      
      ${emailUtils.createParagraph(
        `The Federal Election Commission maintains a public database of all contributions over ${guestLimit}. These records are available for anyone to see at the ${FEC_LINK} of the FEC's website.`
      )}
      
      ${emailUtils.createInfoBox(clarificationText, 'warning')}
      
      ${emailUtils.createParagraph('Your clearance is now active.')}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${PB_LINK} Team
      `,
        { textAlign: 'left' }
      )}
      
      ${emailUtils.createParagraph(
        'P.S. This clearance level is permanent and cannot be revoked.',
        { fontSize: '12px', margin: '20px 0 0 0' }
      )}
    `;

    return [
      0, // info-noreply@powerback.us
      `🟢 Your ${BRANDED_DOMAIN} Clearance Level Has Been Elevated`,
      createEmailTemplate(content, { priority: 2 }),
    ];
  },
};
