const { emailUtils } = require('../template');
const { APP } = require('../../../../constants');

const SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER,
  DISCORD_INVITE = APP.DISCORD_INVITE,
  PATREON_URL = APP.PATREON_URL,
  PROD_URL = process.env.PROD_URL;

const PB_LINK = emailUtils.createLink('POWERBACK.us', PROD_URL);

/** Inner HTML for the non-refundable policy infobox (type: warning). Used in incumbent/defunct alert emails. */
const NON_REFUNDABLE_POLICY = `
  <strong>Non-Refundable Policy:</strong> Celebration transactions are non-refundable, however, we're working to expand our service beyond the single yet extremely important issue of <strong>Citizens United</strong>.
  <br/><br/>
  Once we roll out our full service, you'll be able to freely reroute any of your unrealized Celebration expenditures to any new Bills and Representatives that you choose. Until then, we thank you for helping to finance our protest experiment.
`;

/**
 * Heading + paragraph section defining "serious" challenger. Used in ChallengerAppeared and ChallengerDisappeared emails.
 * @returns {string} HTML for the section
 */
const createSeriousChallengerExplanationSection = () =>
  `
  ${emailUtils.createHeading('What do we mean by <em>serious</em>?', 3)}
  
  ${emailUtils.createParagraph(
    'We only flag challengers who are officially registered, fundraising, and actively campaigning. The kind that forces an incumbent to fight for their seat, giving you leverage.'
  )}
  `;

/**
 * Format Bitcoin address with monospaced font styling
 * Removes trailing periods if present
 * @param {string} btcAddress - Bitcoin address to format
 * @returns {string} - Formatted Bitcoin address with code styling
 */
const formatBTCAddress = (btcAddress) => {
  // Remove trailing periods if present
  const cleanedAddress = btcAddress
    ? btcAddress.replace(/\.+$/, '')
    : btcAddress;
  return `<code style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">${cleanedAddress}</code>`;
};

/**
 * Create support info box content for donation-related emails
 * @param {string} btcAddress - Bitcoin address for donations
 * @param {string} variant - Variant type: 'new' (for new celebrations), 'receipt' (for receipts), or 'update' (for updates)
 * @returns {string} - HTML content for support info box
 */
const createSupportInfoBox = (btcAddress, variant = 'update') => {
  const formattedAddress = formatBTCAddress(btcAddress);

  if (variant === 'new') {
    return `
  <strong>Support POWERBACK.us:</strong> We're a 100% user-funded platform. Your tips help us keep the lights on and continue fighting for democracy.
  <br/><br/>      
  Consider adding a tip to your next celebration to help us grow this movement!
  <br/><br/>
  We also accept support through our Patreon: ${emailUtils.createLink(
    PATREON_URL,
    PATREON_URL
  )}, or join our Discord community: ${emailUtils.createLink(
    DISCORD_INVITE,
    DISCORD_INVITE
  )}
  <br/><br/>
  Bitcoin donations: ${formattedAddress}
`;
  }

  if (variant === 'receipt') {
    return `
  <strong>Support ${PB_LINK}:</strong> We truly appreciate you being a member of ${PB_LINK}. As you likely already know, we depend 100% on donations from our users to run this service.
  <br/><br/>
  Please keep this in mind for your next contribution by giving us a tip.
  <br/><br/>
  We also invite you to support us through our Patreon: ${emailUtils.createLink(
    PATREON_URL,
    PATREON_URL
  )}, or join our Discord community: ${emailUtils.createLink(
    DISCORD_INVITE,
    DISCORD_INVITE
  )}
  <br/><br/>
  If you are so inclined, we can accept Bitcoin donations through the following address: ${formattedAddress}
`;
  }

  // Default variant: 'update'
  return `
<strong>Support POWERBACK.us:</strong> We truly appreciate you being a member of ${PB_LINK}. As you likely already know, we depend 100% on donations from our users to run this service.
  <br/><br/>
  Please keep this in mind the next time you make a contribution to a political candidate by giving us a tip.
  <br/><br/>
  We also invite you to support us through our Patreon: ${emailUtils.createLink(
    PATREON_URL,
    PATREON_URL
  )}, or join our Discord community: ${emailUtils.createLink(
    DISCORD_INVITE,
    DISCORD_INVITE
  )}  
  <br/><br/>
  If you are so inclined, we can accept Bitcoin donations through the following address: ${formattedAddress}
`;
};

/**
 * Create donation ask content for password-related emails
 * @param {string} btcAddress - Bitcoin address for donations
 * @returns {string} - HTML content for donation ask section
 */
const createDonationAsk = (btcAddress) => {
  return `
  ${emailUtils.createParagraph(
    `Since we're here talking, we truly appreciate you being a member of ${PB_LINK}. As you likely already know, we depend 100% on donations from our users to run this service.`
  )}
  
  ${emailUtils.createParagraph(
    'Please keep this in mind the next time you make a contribution to a political candidate by giving us a tip.'
  )}
  
  ${emailUtils.createParagraph(
    `We also invite you to support us through our Patreon: ${emailUtils.createLink(
      PATREON_URL,
      PATREON_URL
    )}, or join our Discord community: ${emailUtils.createLink(
      DISCORD_INVITE,
      DISCORD_INVITE
    )}`
  )}
  
  ${emailUtils.createParagraph(
    `If you are so inclined, we can accept Bitcoin donations through the following address: ${formatBTCAddress(btcAddress)}`
  )}
  
  ${emailUtils.createParagraph('POWERBACK.us thanks you!')}
`;
};

module.exports = {
  createSupportInfoBox,
  createDonationAsk,
  createSeriousChallengerExplanationSection,
  formatBTCAddress,
  NON_REFUNDABLE_POLICY,
  DISCORD_INVITE,
  SUPPORT_EMAIL,
  PATREON_URL,
  PROD_URL,
  PB_LINK,
};
