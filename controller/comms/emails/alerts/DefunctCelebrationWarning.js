const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  /**
   * Early warning email for users with active Celebrations before Congress ends
   *
   * This email is sent approximately one month before the end of a Congressional session
   * to set expectations about what will happen to unresolved Celebrations.
   *
   * @param {Object} payload - Email payload object
   * @param {string} payload.firstName - User's first name
   * @param {number} payload.activeCelebrationsCount - Number of active Celebrations
   * @param {string} payload.sessionEndDate - Congressional session end date
   * @param {string} payload.nextElectionDate - Next general election date
   * @param {string} firstName - User's first name (for compatibility)
   * @returns {Array} Email template array [priority, subject, html, topic]
   */
  DefunctCelebrationWarning: (payload, firstName) => {
    const {
      firstName: userFirstName,
      activeCelebrationsCount,
      sessionEndDate,
      nextElectionDate,
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

    const content = `
      ${emailUtils.createHeading(
        `Congress is about to wrap up. What this means for your Celebrations.`,
        1
      )}
      
      ${emailUtils.createParagraph(
        `Hi ${userFirstName || firstName || 'Powerbacker'},`
      )}
      
      ${emailUtils.createInfoBox(
        `
        The current Congress is scheduled to end on <strong>${formatDate(
          sessionEndDate
        )}</strong>.<br/>
        You currently have <strong>${activeCelebrationsCount}</strong> active Celebration${
          activeCelebrationsCount !== 1 ? 's' : ''
        } that are tied to this session.
      `,
        'warning'
      )}
      
      ${emailUtils.createParagraph(
        `When a Congressional session ends, anything that still hasn't gotten a vote in that chamber just dies on the calendar. At that point, the condition you attached to your Celebration can't be met in this Congress.`
      )}
      
      ${emailUtils.createParagraph(
        `If a Celebration hasn't been delivered by the end of the session, it becomes “defunct”: the campaign gets $0, and the full amount is treated as unused money on your side.`
      )}
      
      ${emailUtils.createHeading('What happens to the money', 3)}
      
      ${emailUtils.createParagraph(
        `If a Celebration becomes defunct, the money doesn't disappear and it doesn't go to the campaign. It stays on your side as unused money that was never released to them.`
      )}
      
      ${emailUtils.createHeading(`What we'll do on session end`, 3)}
      
      ${emailUtils.createParagraph(
        `On ${formatDate(
          sessionEndDate
        )}, we'll automatically handle any Celebrations that haven't been delivered yet:`
      )}
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Mark any unresolved Celebrations as defunct</li>
        <li style="margin: 8px 0;">Send you a summary email of what changed</li>
      </ul>
      
      ${
        nextElectionDate
          ? emailUtils.createParagraph(
              `The next general election is scheduled for ${formatDate(
                nextElectionDate
              )}. That's your next clean chance to decide what to do with your unused leverage - and any new money - under fresh conditions.`
            )
          : ''
      }
      
      ${emailUtils.createParagraph(
        `Nothing here requires you to rush. This is just a heads up so you know what will happen to your active Celebrations when this Congress ends.`
      )}
      
      ${emailUtils.createButton('Review your active Celebrations', PB_URL)}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `<em>This notification is sent because you have active Celebrations that will be affected by the upcoming end of this Congressional session. This is simply a clear outline of what will happen to them.</em>`,
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
      `Congress is wrapping up. What that means for your ${
        activeCelebrationsCount ?? ''
      } Celebration${activeCelebrationsCount > 1 ? 's' : ''}.`,
      createEmailTemplate(content),
      EMAIL_TOPICS.celebrationUpdates,
    ];
  },
};
