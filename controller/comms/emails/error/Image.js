const { createEmailTemplate, emailUtils } = require('../template');

module.exports = {
  Image: (payload) => {
    const content = `
      ${emailUtils.createHeading('Image Loading Error', 1)}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Error Details:</strong> The following candidate image failed to load: ${payload}.
      `,
        'error'
      )}
      
      ${emailUtils.createParagraph(
        'This is an automated notification about an image loading issue. Scheduled jobs sync missing House headshots when eligible; excluded or non-stakes members may not have a local WebP.'
      )}
    `;

    return [
      4, // error-reporter@powerback.us
      'Image loading error',
      createEmailTemplate(content, { showFooter: false }),
    ];
  },
};
