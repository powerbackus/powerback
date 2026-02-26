const { createEmailTemplate, emailUtils } = require('../template');
const { sessionOrdinal } = require('../../../congress/config/session');
const { NON_REFUNDABLE_POLICY } = require('../utils/celebrations');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  /**
   * Notification email sent when Celebrations become defunct due to Congressional session ending
   *
   * This email is sent immediately when Celebrations are converted to defunct status.
   * It explains, in plain terms, that Congress adjourned, conditions weren't met,
   * campaigns got nothing, and the funds stayed on the user's side instead of going to campaigns.
   *
   * @param {Object} payload - Email payload object
   * @param {string} payload.firstName - User's first name
   * @param {Array} payload.defunctCelebrations - Array of defunct celebration details
   * @param {string} payload.sessionEndDate - Congressional session end date
   * @param {string} firstName - User's first name (for compatibility)
   * @returns {Array} Email template array [priority, subject, html, topic]
   */
  DefunctCelebrationNotification: (payload, firstName) => {
    const {
      firstName: userFirstName,
      defunctCelebrations,
      sessionEndDate,
    } = payload;

    const formatDate = (dateStr) => {
      if (!dateStr) return 'Not set';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatMoney = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const sessionOrdinalFormatted = sessionOrdinal();

    // Create celebration details table (aligned to header order)
    const celebrationRows = defunctCelebrations.map((celebration) => ({
      cells: [
        celebration.pol_name,
        celebration.bill_id,
        formatMoney(celebration.donation),
        formatDate(celebration.createdAt),
      ],
    }));

    const content = `
      ${emailUtils.createHeading(
        `${sessionOrdinalFormatted} Congress adjourned. What happened to your POWERBACK.us Celebrations.`,
        1
      )}
      
      ${emailUtils.createParagraph(
        `Hi ${userFirstName || firstName || 'Powerbacker'},`
      )}
      
      ${emailUtils.createInfoBox(
        `
        The ${sessionOrdinalFormatted} Congress ended on <strong>${formatDate(
          sessionEndDate
        )}</strong>.<br/><br/>
        That also closes the window on your POWERBACK.us Celebrations tied to this session.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(`What this means:`)}
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin: 8px 0;">You put real money on the table through Celebrations.</li>
        <li style="margin: 8px 0;">Each one was tied to a clear condition in Congress.</li>
        <li style="margin: 8px 0;">Congress adjourned without those conditions being met.</li>
        <li style="margin: 8px 0;">So campaigns got <strong>$0</strong>, and the funds did not go to them.</li>
      </ul>
      
      ${emailUtils.createParagraph(
        `That isn't a glitch. It's the basic rule: if Congress acts before adjournment, the funds move. If they don't, the money doesn't go to them.`
      )}
      
      ${emailUtils.createHeading('Your defunct Celebrations this Congress', 3)}
      
      ${emailUtils.createTable([
        {
          isHeader: true,
          cells: [
            'Representative',
            'Bill',
            'Original Donation',
            'Created Date',
          ],
        },
        ...celebrationRows,
      ])}
      
      ${emailUtils.createHeading('What your representatives just chose', 3)}
      
      ${emailUtils.createParagraph(
        `Because these Celebrations were conditional and real, their inaction has a clear meaning:`
      )}
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin: 8px 0;">They knew there was money on the table.</li>
        <li style="margin: 8px 0;">They knew what it was tied to.</li>
        <li style="margin: 8px 0;">They let the session end without meeting those conditions.</li>
      </ul>
      
      ${emailUtils.createParagraph(
        `In practice, they turned down donation money rather than follow through on what they campaigned on. You didn't “fail to donate.” They refused to earn it.`
      )}
      
      ${emailUtils.createParagraph(
        `That's the protest built into POWERBACK.us. The money stayed out of their hands, and there's now a record that voters were willing to pay if they acted - and they chose not to.`
      )}
      
      ${emailUtils.createHeading('What happens next', 3)}
      
      ${emailUtils.createInfoBox(NON_REFUNDABLE_POLICY, 'warning')}
      
      ${emailUtils.createParagraph(
        `You weren't supposed to feel good about their choice. You were supposed to see it clearly. This session, your Celebrations did exactly that: the campaigns walked away with nothing, and you kept all of your leverage.`
      )}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `<em>This notification was sent because your Celebrations became defunct when the Congressional session ended.</em>`,
        { fontSize: '12px' }
      )}
      
      ${emailUtils.createParagraph(
        `
        The ${emailUtils.createLink('POWERBACK.us', PB_URL)} Team
      `,
        { textAlign: 'center' }
      )}
      
      ${emailUtils.createParagraph(
        `Questions? Call us at ${PHONE_NUMBER} or email ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}`,
        { textAlign: 'center', fontSize: '12px' }
      )}
    `;

    return [
      3, // alerts-noreply@powerback.us
      `Congress adjourned. Your ${defunctCelebrations.length} Celebration${
        defunctCelebrations.length > 1 ? 's' : ''
      } became defunct`,
      createEmailTemplate(content),
      EMAIL_TOPICS.celebrationUpdates,
    ];
  },
};
