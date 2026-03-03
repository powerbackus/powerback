/**
 * @fileoverview Alert email when H.J.Res.54 (We The People Amendment) has new activity.
 * @module controller/comms/emails/alerts/Hjres54BillUpdated
 */

const { createEmailTemplate, emailUtils } = require('../template');
const { EMAIL_TOPICS } = require('../../../../constants');

const PB_URL = process.env.PROD_URL,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

/**
 * Formats a donation total as USD for display.
 * @param {number} amount - Amount in dollars
 * @returns {string} Formatted currency string
 */
function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount ?? 0);
}

/**
 * Builds email content for bill update summary (status, action, committees).
 * @param {Object} summary - Change summary from checkHJRes54
 * @param {string} [summary.statusOld] - Previous status
 * @param {string} [summary.statusNew] - New status
 * @returns {string} HTML fragment
 */
function formatChangeSummary(summary) {
  const parts = [];
  if (summary.statusOld != null && summary.statusNew != null) {
    parts.push(
      `<strong>Status:</strong> ${summary.statusOld} → ${summary.statusNew}`
    );
  }
  if (summary.lastAction && typeof summary.lastAction === 'object') {
    const text = summary.lastAction.text || JSON.stringify(summary.lastAction);
    parts.push(`<strong>Latest action:</strong> ${text}`);
  }
  if (Array.isArray(summary.committeesNew) && summary.committeesNew.length) {
    parts.push(
      `<strong>Committees:</strong> ${summary.committeesNew.join(', ')}`
    );
  }
  return parts.length ? parts.join('<br/>') : 'Bill activity was updated.';
}

module.exports = {
  /**
   * Email template for H.J.Res.54 bill update notifications.
   * @param {string} [firstName] - User first name
   * @param {Object} changeSummary - Summary of what changed (status, action, committees, totalDonations)
   * @returns {[number, string, string, string]} [fromIndex, subject, html, topic]
   */
  Hjres54BillUpdated: (firstName, changeSummary) => {
    const summary = changeSummary || {};
    const summaryHtml = formatChangeSummary(summary);
    const totalDonations = summary.totalDonations ?? 0;
    const totalRaisedCopy =
      totalDonations > 0
        ? ` So far we have raised <strong>${formatMoney(totalDonations)}</strong> in escrowed donations for this bill.`
        : '';

    const content = `
      ${emailUtils.createHeading('H.J.Res.54 (We The People Amendment) update', 1)}
      
      ${emailUtils.createParagraph(`Hi ${firstName || 'Powerbacker'},`)}
      
      ${emailUtils.createInfoBox(
        `
        There is new activity on <strong>H.J.Res.54</strong>, the We The People Amendment that POWERBACK.us is built around.${totalRaisedCopy}
      `,
        'info'
      )}
      
      ${emailUtils.createHeading('What changed', 4)}
      
      ${emailUtils.createParagraph(summaryHtml)}
      
      ${emailUtils.createButton('View on POWERBACK.us', PB_URL)}
      
      ${emailUtils.createDivider()}
      
      ${emailUtils.createParagraph(
        `
        The ${emailUtils.createLink('POWERBACK.us', PB_URL)} Team
      `,
        { textAlign: 'center' }
      )}
      
      ${emailUtils.createParagraph(
        `Questions? Email ${emailUtils.createLink(
          SUPPORT_EMAIL,
          `mailto:${SUPPORT_EMAIL}`
        )}`,
        { textAlign: 'center', fontSize: '12px' }
      )}
    `;

    return [
      3, // alerts-noreply@powerback.us
      'POWERBACK.us: H.J.Res.54 (We The People Amendment) has new activity',
      createEmailTemplate(content),
      EMAIL_TOPICS.billUpdates,
    ];
  },
};
