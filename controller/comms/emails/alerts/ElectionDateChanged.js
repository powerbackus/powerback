const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  PHONE_NUMBER = process.env.PHONE_NUMBER,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

module.exports = {
  /**
   * Email template for users with active Celebrations affected by election date changes
   *
   * @param {Object} payload - Email payload object
   * @param {string} payload.firstName - User's first name
   * @param {string} payload.state - State code (e.g., 'CA')
   * @param {string} payload.oldPrimaryDate - Previous primary election date
   * @param {string} payload.newPrimaryDate - New primary election date
   * @param {string} payload.oldGeneralDate - Previous general election date
   * @param {string} payload.newGeneralDate - New general election date
   * @param {string} payload.impactDescription - Description of how the change affects their donations
   * @param {number} payload.oldLimit - Previous donation limit
   * @param {number} payload.newLimit - New donation limit
   * @param {string} firstName - User's first name (for compatibility)
   * @param {boolean} isProduction - Whether this is production environment
   * @returns {Array} Email template array [priority, subject, html, topic]
   */
  ElectionDateChanged: (payload, firstName, isProduction) => {
    const {
      firstName: userFirstName,
      impactDescription,
      newGeneralDate,
      oldGeneralDate,
      newPrimaryDate,
      oldPrimaryDate,
      newLimit,
      oldLimit,
      state,
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

    const content = `
      ${emailUtils.createHeading(
        `Election dates changed in ${state}. How this affects your Celebrations.`,
        1
      )}
      
      ${emailUtils.createParagraph(
        `Hi ${userFirstName || firstName || 'Powerbacker'},`
      )}
      
      ${emailUtils.createInfoBox(
        `
        Election dates in <strong>${state}</strong> have changed. Because you have active Celebrations tied to races there, the timeline for when those can be delivered has shifted too.
      `,
        'info'
      )}
      
      ${emailUtils.createHeading('What changed', 4)}
      
      ${emailUtils.createTable([
        {
          isHeader: true,
          cells: ['Election type', 'Previous date', 'New date'],
        },
        {
          cells: [
            'Primary election',
            formatDate(oldPrimaryDate),
            formatDate(newPrimaryDate),
          ],
        },
        {
          cells: [
            'General election',
            formatDate(oldGeneralDate),
            formatDate(newGeneralDate),
          ],
        },
      ])}
      
      ${emailUtils.createHeading('How this affects your Celebrations', 4)}
      
      ${emailUtils.createParagraph(
        impactDescription ||
          'These changes may shift when your conditions can be met and when your Celebrations can be delivered.'
      )}
      
      ${
        oldLimit !== newLimit
          ? emailUtils.createInfoBox(
              `
          <strong>Donation limit change:</strong><br/>
          The maximum single donation limit in ${state} has changed from ${formatMoney(
            oldLimit
          )} to ${formatMoney(newLimit)}.
        `,
              'info'
            )
          : ''
      }
      
      ${emailUtils.createHeading('What you can do now', 4)}
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Look over your active Celebrations in your account.</li>
        <li style="margin: 8px 0;">Decide if the new primary and general dates change how you want your money conditioned.</li>
        <li style="margin: 8px 0;">Update or create new Celebrations if you want them aligned with the new election calendar.</li>
      </ul>
      
      ${emailUtils.createParagraph(
        `You can review everything from your account dashboard:`
      )}
      
      ${emailUtils.createButton('Review your Celebrations', PB_URL)}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `<em>This notification was sent because you have active Celebrations in ${state} that are tied to these election dates. The goal is simply to keep your conditions in sync with the actual calendar.</em>`,
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
      `Election dates changed in ${state}. How this affects your Celebrations.`,
      createEmailTemplate(content),
      EMAIL_TOPICS.electionUpdates,
    ];
  },

  /**
   * Email template for users with ocd_id (residential address) but no active Celebrations
   *
   * @param {Object} payload - Email payload object
   * @param {string} payload.firstName - User's first name
   * @param {string} payload.state - State code (e.g., 'CA')
   * @param {string} payload.oldPrimaryDate - Previous primary election date
   * @param {string} payload.newPrimaryDate - New primary election date
   * @param {string} payload.oldGeneralDate - Previous general election date
   * @param {string} payload.newGeneralDate - New general election date
   * @param {string} firstName - User's first name (for compatibility)
   * @param {boolean} isProduction - Whether this is production environment
   * @returns {Array} Email template array [priority, subject, html, topic]
   */
  ElectionDateNotification: (payload, firstName, isProduction) => {
    const {
      firstName: userFirstName,
      newGeneralDate,
      oldGeneralDate,
      newPrimaryDate,
      oldPrimaryDate,
      state,
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
      ${emailUtils.createHeading(`Election dates changed in ${state}.`, 1)}
      
      ${emailUtils.createParagraph(
        `Hi ${userFirstName || firstName || 'Powerbacker'},`
      )}
      
      ${emailUtils.createInfoBox(
        `
        Election dates have been updated in <strong>${state}</strong>, where you have a registered address on POWERBACK.us.
      `,
        'warning'
      )}
      
      ${emailUtils.createHeading('Updated election schedule', 4)}
      
      ${emailUtils.createTable([
        {
          isHeader: true,
          cells: ['Election type', 'Previous date', 'New date'],
        },
        {
          cells: [
            'Primary election',
            formatDate(oldPrimaryDate),
            formatDate(newPrimaryDate),
          ],
        },
        {
          cells: [
            'General election',
            formatDate(oldGeneralDate),
            formatDate(newGeneralDate),
          ],
        },
      ])}
      
      ${emailUtils.createHeading('Why this matters', 4)}
      
      ${emailUtils.createParagraph(
        `Election dates define when donation limits reset and when candidates are actually paying attention. POWERBACK.us lets you set conditions on your money around those timelines - for example, only sending funds if a specific bill is brought to the floor for a vote.`
      )}
      
      ${emailUtils.createHeading('If you want to act on this', 4)}
      
      ${emailUtils.createParagraph(
        `From your POWERBACK.us account, you can see who represents your district and decide if you want to set any conditions tied to these updated dates.`
      )}
      
      ${emailUtils.createButton('Go to POWERBACK.us', PB_URL)}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `<em>This notification was sent because you have a registered address in ${state}, and election dates there have changed. It's simply an update so your plans - if you make any - match the new calendar.</em>`,
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
      `Election dates changed in ${state}.`,
      createEmailTemplate(content),
      EMAIL_TOPICS.electionUpdates,
    ];
  },
};
