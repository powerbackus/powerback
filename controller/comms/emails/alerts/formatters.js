const accounting = require('accounting');
const logger = require('../../../../services/utils/logger')(__filename);
const { deliminate, denominate } = require('../info/celebrations/fn');
const { formatInCST } = require('../utils/timezone');

function formatCelebrationTable(celebration) {
  try {
    return `
      <table style="width: 33%">
        <tr><td><b>Recipient:</b></td><td>${deliminate(
          celebration.donee
        )}</td></tr>
        <tr><td><b>Bill:</b></td><td>${denominate(celebration.bill)}</td></tr>
        <tr><td><b>Donation:</b></td><td>${accounting.formatMoney(
          celebration.donation
        )}</td></tr>
        <tr><td><b>Tip:</b></td><td>${accounting.formatMoney(
          celebration.tip
        )}</td></tr>
        <tr><td><b>Total:</b></td><td>${accounting.formatMoney(
          celebration.donation + celebration.fee + celebration.tip
        )}</td></tr>
        <tr><td><b>Time of Celebration:</b></td><td>${formatInCST(
          celebration.createdAt
        )}</td></tr>
        <tr><td><b>ID:</b></td><td>${celebration.idempotencyKey}</td></tr>
      </table><br/>`;
  } catch (err) {
    logger.error('Failed to format celebration table:', err);
    return `<p style="color: red">Error: Could not format celebration details. Please contact support.</p>`;
  }
}

module.exports = {
  formatCelebrationTable,
};
