const { createEmailTemplate, emailUtils } = require('../../template');
const { getBTCAddress } = require('../../../../../services/btc/addressService');
const {
  createSupportInfoBox,
  SUPPORT_EMAIL,
  PROD_URL,
  PB_LINK,
} = require('../../utils/celebrations');

const PHONE_NUMBER = process.env.PHONE_NUMBER;

module.exports = {
  Update: async (update, firstName) => {
    const BTC_ADDRESS = await getBTCAddress();

    const summary =
      update?.summary || update?.message || update?.description || '';

    const content = `
      ${emailUtils.createHeading('Update on your POWERBACK.us Celebration', 1)}
      
      ${emailUtils.createParagraph(`Hi ${firstName ?? 'Powerbacker'},`)}
      
      ${emailUtils.createParagraph(
        `We're sending this to let you know that something about one of your POWERBACK.us Celebrations has changed. This could be related to status, amounts, or other details connected to that Celebration.`
      )}
      
      ${
        summary
          ? emailUtils.createInfoBox(
              `
              <strong>Quick summary:</strong><br/>
              ${summary}
            `,
              'info'
            )
          : ''
      }
      
      ${emailUtils.createHeading('Where to see the full details', 3)}
      
      ${emailUtils.createParagraph(
        `The complete record of this Celebration - including amounts, conditions, and current status - is available in your account on ${PB_LINK}.`
      )}
      
      ${emailUtils.createButton('View your Celebrations', PROD_URL)}
      
      ${emailUtils.createInfoBox(
        createSupportInfoBox(BTC_ADDRESS, 'update'),
        'info'
      )}
      
      ${emailUtils.createParagraph(
        `Nothing about how POWERBACK.us works has changed: your money stays in escrow and only moves if the condition you agreed to is met. If that never happens, the campaign gets $0 and the funds stay on your side instead of going to them.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${PB_LINK} Team
      `,
        { textAlign: 'center' }
      )}
      
      ${emailUtils.createParagraph(
        `Problems or questions about this update? Call us at ${
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
      'Update on your POWERBACK.us Celebration',
      createEmailTemplate(content),
    ];
  },
};
