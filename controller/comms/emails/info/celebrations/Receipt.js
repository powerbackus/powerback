const accounting = require('accounting');

const logger = require('../../../../../services/utils/logger')(__filename);

const {
  PROD_URL,
  SUPPORT_EMAIL,
  createSupportInfoBox,
} = require('../../utils/celebrations');

const { getBTCAddress } = require('../../../../../services/btc/addressService'),
  { createEmailTemplate, emailUtils } = require('../../template'),
  { formatInCST } = require('../../utils/timezone'),
  { deliminate, denominate } = require('./fn');

const TWITTER_URI = process.env.TWITTER_INTENT_BASE_URL,
  TWITTER_HASHTAGS = process.env.TWITTER_HASHTAGS,
  TWITTER_TEXT =
    "I made a campaign celebration that you can't cash until action is taken on ",
  TWITTER_CTA = '! Find out at @PowerbackApp',
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  TCO_URL = process.env.PROD_TCO_URL;

const PB_LINK = emailUtils.createLink('POWERBACK.us', PROD_URL);

const handleTweetThis = (bill, donee) => {
  try {
    if (!bill || !donee) {
      // Fallback to main site if data is missing
      return PROD_URL;
    }

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
  Receipt: async (celebration, firstName) => {
    // Validate celebration object before processing
    if (!celebration) {
      logger.error('Celebration object is null or undefined');
      return [
        0, // info-noreply@powerback.us
        'Celebration receipt',
        createEmailTemplate(`
          ${emailUtils.createHeading('Celebration receipt', 1)}
          ${emailUtils.createParagraph('We received a request for a Celebration receipt. If you think this is an error, contact support and we can look it up with you.')}
          ${emailUtils.createInfoBox(
            'No specific Celebration was found for this request. Please reach out if you need help matching a charge to a receipt.',
            'info'
          )}
        `),
      ];
    }

    const BTC_ADDRESS = await getBTCAddress();

    // Extract values with null coalescing for missing fields
    const ordinal =
      celebration.ordinal ?? celebration.id ?? celebration._id ?? 'Unknown';
    const donation = celebration.donation ?? celebration.amount ?? 0;
    const tip = celebration.tip ?? 0;
    const fee = celebration.fee ?? 0;
    const createdAt =
      celebration.createdAt ?? celebration.created_at ?? new Date();
    const idempotencyKey =
      celebration.idempotencyKey ?? celebration.id ?? 'Unknown';

    const chamber = celebration.donee?.roles?.[0]?.chamber;
    const lastName = celebration.donee?.last_name || '';
    const title =
      chamber === 'House' ? 'Rep.' : chamber === 'Senate' ? 'Sen.' : '';

    const subjectBase = `Your POWERBACK.us Celebration receipt #${ordinal}`;
    const subject = lastName
      ? `${subjectBase} - to ${title ? `${title} ` : ''}${lastName}`
      : subjectBase;

    const content = `
      ${emailUtils.createHeading(`Celebration receipt #${ordinal}`, 1)}
      
      ${emailUtils.createParagraph(`Hi ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createParagraph(
        `Your receipt for a Celebration you made on ${PB_LINK}. This email shows what you were charged and how this Celebration is set up.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createHeading('Celebration details', 3)}
      
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
          cells: ['Date of Celebration', formatInCST(createdAt)],
        },
        {
          cells: ['Reference ID', idempotencyKey],
        },
      ])}
      
      ${emailUtils.createParagraph(
        `If you want to share it: ${emailUtils.createLink(
          'Share this on X',
          handleTweetThis(celebration.bill, celebration.donee)
        )}`
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>How this Celebration works:</strong><br/>
        • Your money is in escrow, not in the campaign's account<br/>
        • It will only be delivered if/when the bill ${contingency}<br/>
        • If that never happens, the campaign receives $0 and the amount stays on your side instead of going to them
        `,
        'info'
      )}
      
      ${emailUtils.createParagraph(
        `For more information about how POWERBACK.us's conditional donation system works, including FEC compliance details and technical documentation, see our ${emailUtils.createLink('position paper', `${PROD_URL}position-paper.pdf`)}.`
      )}
      
      ${
        !tip
          ? emailUtils.createInfoBox(
              createSupportInfoBox(BTC_ADDRESS, 'receipt'),
              'info'
            )
          : emailUtils.createParagraph(
              `You also added a tip to support the platform. That helps keep POWERBACK.us running and doesn't change how this Celebration or its conditions work.`
            )
      }
      
      ${emailUtils.createParagraph(
        `If you ever need to match a bank charge to a specific Celebration, this receipt ID and timestamp are the key details we'll use.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${PB_LINK} Team
      `,
        { textAlign: 'center' }
      )}
      
      ${emailUtils.createParagraph(
        `Problems or questions about this receipt? Call us at ${
          PHONE_NUMBER || 'the number listed on our site'
        } or email ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}`,
        { textAlign: 'center', fontSize: '12px' }
      )}
    `;

    return [
      0, // info-noreply@powerback.us
      subject,
      createEmailTemplate(content),
    ];
  },
};
