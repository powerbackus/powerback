/**
 * Minimal constants for Node (craco.config.js, scripts that require faq.js).
 * Full constants live in constants.ts. Do not add constants.js in this directory
 * or it will shadow constants.ts for Webpack.
 *
 * @module constants/constants.node
 */
const rootApp = require('../../../constants/app').APP;

module.exports = {
  TRACKING: {
    GTAG_ID: process.env.REACT_APP_GTAG_ID || 'G-3YYTWLY9HD',
  },
  GIT_REPO:
    process.env.REACT_APP_GIT_REPO ||
    'https://github.com/powerbackus/powerback',
  PATREON_URL: rootApp.PATREON_URL,
  TWITTER_URL:
    process.env.REACT_APP_TWITTER_URL || 'https://x.com/PowerbackApp',
  DISCORD_INVITE: rootApp.DISCORD_INVITE,
  POSITION_PAPER_PATH: rootApp.POSITION_PAPER_PATH,
  WE_THE_PEOPLE_BILL_URL:
    process.env.REACT_APP_WE_THE_PEOPLE_BILL_URL ||
    'https://www.congress.gov/bill/119th-congress/house-joint-resolution/54',
};
