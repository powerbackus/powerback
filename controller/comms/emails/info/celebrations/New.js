const accounting = require('accounting');

const {
  PROD_URL,
  SUPPORT_EMAIL,
  createSupportInfoBox,
} = require('../../utils/celebrations');

const { getBTCAddress } = require('../../../../../services/btc/addressService'),
  logger = require('../../../../../services/utils/logger')(__filename),
  { createEmailTemplate, emailUtils } = require('../../template'),
  { formatInCST } = require('../../utils/timezone'),
  { deliminate, denominate } = require('./fn');

const TWITTER_URI = process.env.TWITTER_INTENT_BASE_URL,
  TWITTER_HASHTAGS = process.env.TWITTER_HASHTAGS,
  TWITTER_TEXT =
    "I made my first campaign celebration that you can't cash until action is taken on ",
  TWITTER_CTA = '! Find out at @PowerbackApp',
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  TCO_URL = process.env.PROD_TCO_URL; // Use shortened URL for Twitter

const BRANDED_DOMAIN = process.env.BRANDED_DOMAIN || 'POWERBACK.us';

const PB_LINK = emailUtils.createLink(BRANDED_DOMAIN, PROD_URL);
const POSITION_PAPER_PATH =
  process.env.REACT_APP_POSITION_PAPER_PATH || 'position-paper.pdf';

const handleTweetThis = (bill, donee) => {
  try {
    if (!bill || !donee) {
      // Fallback to main site if data is missing
      return PROD_URL;
    }

    // Use shortened URL for Twitter if available, otherwise fall back to full URL
    const shareUrl = TCO_URL || PROD_URL;

    return (
      TWITTER_URI +
      '&hashtags=' +
      TWITTER_HASHTAGS +
      '&screen_name=' +
      (donee.twitter_account ?? '') +
      '&text=' +
      TWITTER_TEXT +
      (bill.bill ?? 'Unknown bill') +
      (bill.short_title ? `, ${bill.short_title}` : '') +
      TWITTER_CTA +
      '&url=' +
      shareUrl
    );
  } catch (error) {
    logger.error('Error creating tweet URL:', error);
    return PROD_URL;
  }
};

const contingency = 'is brought to the House floor for a vote';

module.exports = {
  New: async (celebration, firstName) => {
    // Validate celebration object before processing
    if (!celebration) {
      logger.error('Celebration object is null or undefined');
      return [
        0, // info-noreply@powerback.us
        `Welcome to ${BRANDED_DOMAIN}`,
        createEmailTemplate(`
          ${emailUtils.createHeading(`Welcome to ${BRANDED_DOMAIN}`, 1)}
          ${emailUtils.createParagraph('Thanks for signing up. Your first Celebration is now stockpiled.')}
          ${emailUtils.createInfoBox(
            "You'll get an email whenever the status of your Celebration changes.",
            'info'
          )}
        `),
      ];
    }

    const BTC_ADDRESS = await getBTCAddress();

    // Extract values with null coalescing for missing fields
    const donation = celebration.donation ?? celebration.amount ?? 0;
    const tip = celebration.tip ?? 0;
    const fee = celebration.fee ?? 0;
    const createdAt =
      celebration.createdAt ?? celebration.created_at ?? new Date();
    const idempotencyKey =
      celebration.idempotencyKey ?? celebration.id ?? 'Unknown';

    const complianceTier =
      celebration.donorInfo?.compliance?.toUpperCase() ?? 'GUEST';

    const { FEC } = require('../../../../../constants/fec');

    const FEC_PER_ANNUM = FEC.COMPLIANCE_TIERS.guest.annualCap;
    const FEC_PER_DONATION = FEC.COMPLIANCE_TIERS.guest.perDonationLimit;
    const FEC_PER_CAMPAIGN = FEC.COMPLIANCE_TIERS.compliant.perElectionLimit;
    const FEC_PAC_LIMIT = FEC.PAC_ANNUAL_LIMIT;

    const isGuest =
      !celebration.donorInfo?.compliance ||
      celebration.donorInfo?.compliance === 'guest';
    const limitsText = isGuest
      ? `$${FEC_PER_DONATION} per donation, $${FEC_PER_ANNUM} per calendar year`
      : `$${FEC_PER_CAMPAIGN} per candidate, per election`;

    const content = `
      ${emailUtils.createHeading('Your Celebration is now stockpiled', 1)}
      
      ${emailUtils.createParagraph(`Hi ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createParagraph(
        `...and now let's get it to Washington, D.C.!`
      )}
        
      ${emailUtils.createParagraph(
        `You've just created a Celebration on ${PB_LINK}: a powerful signal that ties real money to real action in Congress. That means your money is stockpiled with ${BRANDED_DOMAIN} and only moves to a campaign if a specific condition in Congress is met. Until then, it stays put.`
      )}
      
      ${emailUtils.createParagraph(
        `Share what you just did. Tell others about this bill, this candidate, and this condition. When more people stack their Celebrations on the same action, campaigns pay attention. One Celebration is a statement. Many Celebrations on the same bill become leverage. That's how change happens.`
      )}
      
      ${emailUtils.createHeading('How this Celebration works', 3)}

      
      ${emailUtils.createInfoBox(
        `
        <ul>
          <li>You chose a candidate and a bill</li>
          <li>Your money is stockpiled instead of going straight to the campaign</li>
          <li>It only gets released if that bill ${contingency}</li>
          <li>If that never happens, the campaign gets zero and the full amount stays on your side instead of going to them</li>        
        </ul>
        `,
        'info'
      )}

      ${emailUtils.createInfoBox(
        `
        <strong>Your account status and limits:</strong><br/>
        <strong>Compliance tier:</strong> ${complianceTier}<br/>
        <strong>Donation limits under this tier:</strong> ${limitsText}<br/>
        <strong>PAC tip limit:</strong> $${FEC_PAC_LIMIT} per calendar year<br/>
        <strong>Current Celebration status:</strong> Active, stockpiled<br/>
        ${
          celebration.donorInfo?.state
            ? `<br/><strong>State:</strong> ${celebration.donorInfo.state}<br/>
          <em>You can see specific primary and general dates for your state in your account dashboard.</em><br/>`
            : ''
        }
        `,
        'warning'
      )}
      
      ${emailUtils.createHeading('What can happen from here', 3)}
        
        ${emailUtils.createInfoBox(
          `
          <strong>DELIVERED:</strong> The condition is met (for example, the bill is brought to the House floor for a vote) → your money is delivered to the campaign.<br/>
          `,
          'success'
        )}
                                                        
      ${emailUtils.createInfoBox(
        `
  <strong>PAUSED:</strong> Your chosen candidate drops out or no longer has a real race → your money stays stockpiled while the condition is still technically possible.<br/>        
  `,
        'warning'
      )}

      ${emailUtils.createInfoBox(
        `
  <strong>EXPIRED:</strong> The bill dies or the session ends without action → your money never moves to the campaign under this condition.<br/>        
  `,
        'error'
      )}  

      ${emailUtils.createParagraph(`<em>You'll get an email if and when this Celebration changes status.</em>`)}
  
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createHeading('Your Celebration details', 3)}
    
    ${emailUtils.createTable([
      {
        isHeader: true,
        cells: ['Detail', 'Value'],
      },
      {
        cells: ['Recipient', deliminate(celebration.donee)],
      },
      {
        cells: ['Bill', denominate(celebration.bill)],
      },
      {
        cells: ['Donation', accounting.formatMoney(donation)],
      },
      {
        cells: ['Tip', accounting.formatMoney(tip)],
      },
      {
        cells: [
          'Total charged',
          accounting.formatMoney(donation + fee + tip) +
            ' (includes payment processing fee)',
        ],
      },
      {
        cells: ['Time of Celebration', formatInCST(createdAt)],
      },
      {
        cells: ['Reference ID', idempotencyKey],
      },
    ])}
    
    ${emailUtils.createParagraph(
      `If you want to share what you just did: ${emailUtils.createLink(
        'Share this on X',
        handleTweetThis(celebration.bill, celebration.donee)
      )}`
    )}
    
    ${emailUtils.createHeading(`What you've actually done here`, 3)}
    
    ${emailUtils.createParagraph(
      `This isn't a standard "money up front, maybe accountability later" donation. You've tied real money to a clear condition and forced a choice on the campaign: earn it by acting, or watch it sit stockpiled.`
    )}
    
    ${emailUtils.createParagraph(
      `One Celebration on its own is a small data point. Many people doing the same thing around the same bill becomes leverage. The idea: visible, conditional money instead of blind trust.`
    )}
    
    ${emailUtils.createInfoBox(
      `
      <strong>Understanding the system:</strong><br/>
      For a detailed explanation of how conditional donations work, FEC compliance requirements, and the technical architecture behind ${BRANDED_DOMAIN}, check out our ${emailUtils.createLink('position paper', `${PROD_URL}${POSITION_PAPER_PATH}`)}. It covers the legal framework, escrow mechanics, and the principles that make this system possible.
    `,
      'info'
    )}
    
    ${emailUtils.createInfoBox(
      `
      <strong>A few useful moves from here:</strong><br/>
      • Keep an eye on this bill and the politician you just celebrated<br/>
      • Turn on notifications so you see when the status changes<br/>
      • Share your Celebration if you want others to stack on the same condition<br/>
      • Consider setting up similar conditions with other candidates on the same bill
      `,
      'warning'
    )}
    
    ${
      !tip
        ? emailUtils.createInfoBox(
            createSupportInfoBox(BTC_ADDRESS, 'new'),
            'info'
          )
        : emailUtils.createParagraph(
            `You also added a tip to help keep the platform running. That supports the PAC and doesn't change how your Celebration or its conditions work.`
          )
    }
    
      ${emailUtils.createParagraph(
        `From this point on, we'll only move this money if the condition you agreed to is met. If that never happens, it stays on your side instead of going to the campaign.`
      )}
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createParagraph(
      `
      The ${PB_LINK} Team
    `,
      { textAlign: 'center' }
    )}
    
    ${emailUtils.createParagraph(
      `Questions about this Celebration or your limits? Call us at ${
        PHONE_NUMBER || 'the number on our site'
      } or email ${emailUtils.createLink(
        SUPPORT_EMAIL,
        `mailto:${SUPPORT_EMAIL}`
      )}`,
      { textAlign: 'center', fontSize: '12px' }
    )}
  `;

    return [
      2, // info-noreply@powerback.us
      `Your first ${BRANDED_DOMAIN} Celebration is here!`,
      createEmailTemplate(content),
    ];
  },
};
