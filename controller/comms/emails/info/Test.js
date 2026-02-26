const { createEmailTemplate, emailUtils } = require('../template');

module.exports = {
  Test: (test, results) => {
    const content = `
      ${emailUtils.createHeading('Test Email', 1)}
      
      ${emailUtils.createParagraph(
        'This is a test email from the POWERBACK.us system.'
      )}
      
      ${emailUtils.createInfoBox(
        `
        <strong>Test Details:</strong><br/>
        Test: ${test}<br/>
        Results: ${results}
      `,
        'info'
      )}
      
      ${emailUtils.createParagraph(
        'If you received this email, the email system is working correctly.'
      )}
    `;

    return [0, test, createEmailTemplate(content, { showFooter: false })]; // info-noreply@powerback.us
  },
};
