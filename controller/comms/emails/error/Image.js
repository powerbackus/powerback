const { createEmailTemplate, emailUtils } = require('../template');

/**
 * Admin image notification. Second arg `report` is optional for backward compatibility.
 *
 * @param {string} pol - Bioguide ID
 * @param {'missing_local_webp'|'no_usable_image'|undefined} [report] - Tier: add webp vs no image at all
 */
module.exports = {
  Image: (pol, report) => {
    const isNoUsable = report === 'no_usable_image';
    const isMissingWebp = report === 'missing_local_webp';

    const heading = isNoUsable
      ? 'Politician image unavailable'
      : isMissingWebp
        ? 'Missing local webp profile image'
        : 'Image loading error';

    const detailHtml = isNoUsable
      ? `<strong>Bioguide ID:</strong> ${pol}<br/><br/>
        Local <code>pfp/${pol}.webp</code> and the Congress Clerk JPG fallback both failed to load.
        Investigate wrong ID, network, or missing official portrait.`
      : isMissingWebp
        ? `<strong>Bioguide ID:</strong> ${pol}<br/><br/>
        Bundled <code>pfp/${pol}.webp</code> failed to load (404 or error). The app will try the official JPG next.
        <strong>Action:</strong> add <code>${pol}.webp</code> under persistent <code>pfp/</code> when convenient.`
        : `<strong>Error details:</strong> The following candidate image failed to load: ${pol}.`;

    const content = `
      ${emailUtils.createHeading(heading, 1)}
      
      ${emailUtils.createInfoBox(detailHtml, 'error')}
      
      ${emailUtils.createParagraph(
        'This is an automated notification from the POWERBACK client image pipeline.'
      )}
    `;

    const subject = isNoUsable
      ? 'Politician image: local and fallback failed'
      : isMissingWebp
        ? 'Politician image: missing local webp'
        : 'Image loading error';

    return [
      4, // error-reporter@powerback.us
      subject,
      createEmailTemplate(content, { showFooter: false }),
    ];
  },
};
