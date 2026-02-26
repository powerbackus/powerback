const path = require('path');
const { createEmailTemplate, emailUtils, COLORS } = require('./template');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env.local'),
  });
}

const PB_URL =
  process.env.ORIGIN ??
  (process.env.NODE_ENV === 'production'
    ? process.env.PROD_URL
    : process.env.DEV_URL);

// Example 1: Welcome email with button
const createWelcomeEmail = (firstName) => {
  const content = `
    ${emailUtils.createHeading('Welcome to POWERBACK.us!', 1)}
    
    ${emailUtils.createParagraph(`Dear ${firstName || 'Newest Powerbacker'},`)}
    
    ${emailUtils.createParagraph(
      'Great news! Your POWERBACK.us account is now active and ready to make a difference. Thank you for confirming your email address.'
    )}
    
    ${emailUtils.createInfoBox(
      `
      <strong>What's Next?</strong><br/>
      You can now create Celebrations, track your political impact, and be part of something extraordinary. Your involvement brings the power back to the people every day.
    `,
      'success'
    )}
    
    ${emailUtils.createParagraph(
      'Please forward this email to a friend or, better yet, a neighbor. Together we can ensure that those who are given the honor of representing the American people will never take one of your hard-earned dollars for granted ever again.'
    )}
    
    ${emailUtils.createButton('Visit POWERBACK.us', PB_URL)}
    
    ${emailUtils.createParagraph(
      "I look forward to the positive change we'll create together.",
      { textAlign: 'left' }
    )}
    
    ${emailUtils.createSignature('jonathan')}
  `;

  return createEmailTemplate(content, { priority: 3 });
};

// Example 2: Donation confirmation with table
const createDonationEmail = (celebration, firstName) => {
  const content = `
    ${emailUtils.createHeading(`Celebration #${celebration.ordinal}`, 1)}
    
    ${emailUtils.createParagraph(`Dear ${firstName || 'Powered Citizen'},`)}
    
    ${emailUtils.createParagraph(
      "You've just made a Celebration on POWERBACK.us, the only online conduit that serves the People, <em>not</em> the politicians. Your action is a significant step in our journey to create meaningful change."
    )}
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createHeading('Celebration Details', 3)}
    
    ${emailUtils.createTable([
      {
        isHeader: true,
        cells: ['Detail', 'Value'],
      },
      {
        cells: [
          'Recipient',
          celebration.donee.roles[0].short_title +
            ' ' +
            celebration.donee.first_name +
            ' ' +
            celebration.donee.last_name,
        ],
      },
      {
        cells: [
          'Bill',
          celebration.bill.bill + ' - ' + celebration.bill.short_title,
        ],
      },
      {
        cells: ['Donation Amount', '$' + celebration.donation.toFixed(2)],
      },
      {
        cells: ['Tip Amount', '$' + celebration.tip.toFixed(2)],
      },
      {
        cells: [
          'Total',
          '$' +
            (celebration.donation + celebration.fee + celebration.tip).toFixed(
              2
            ),
        ],
      },
      {
        cells: ['ID', celebration.idempotencyKey],
      },
    ])}
    
    ${emailUtils.createInfoBox(
      `
      <strong>Important:</strong> Pending delivery of your celebration occurs if/when the bill is brought to the House floor for a vote.
    `,
      'warning'
    )}
    
    ${emailUtils.createParagraph(
      'Thank you for your Celebration and for being part of our extraordinary community.'
    )}
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createSignature('casual')}
  `;

  return createEmailTemplate(content, { priority: 2 });
};

// Example 3: Alert email with custom styling
const createAlertEmail = (firstName, alertType, details) => {
  const alertConfig = {
    challenger: {
      title: 'Challenger Alert',
      type: 'warning',
      icon: '⚔️',
    },
    election: {
      title: 'Election Date Change',
      type: 'info',
      icon: '🗳️',
    },
    system: {
      title: 'System Update',
      type: 'info',
      icon: '🔧',
    },
  };

  const config = alertConfig[alertType] || alertConfig.system;

  const content = `
    ${emailUtils.createHeading(`${config.icon} ${config.title}`, 1)}
    
    ${emailUtils.createParagraph(`Dear ${firstName || 'Powerbacker'},`)}
    
    ${emailUtils.createInfoBox(
      `
      <strong>${config.title}:</strong> ${details.summary}
    `,
      config.type
    )}
    
    ${emailUtils.createParagraph(details.description)}
    
    ${
      details.actionItems
        ? `
      ${emailUtils.createHeading('What You Should Do', 3)}
      <ul style="margin: 15px 0; padding-left: 20px;">
        ${details.actionItems
          .map((item) => `<li style="margin: 8px 0;">${item}</li>`)
          .join('')}
      </ul>
    `
        : ''
    }
    
    ${emailUtils.createButton('Review Your Account', PB_URL)}
    
    ${emailUtils.createParagraph(
      `
      Questions? Call us or email support@powerback.us
    `,
      { textAlign: 'center', fontSize: '12px' }
    )}
  `;

  return createEmailTemplate(content, { priority: 5 });
};

// Example 4: Password reset with custom header
const createPasswordResetEmail = (firstName, resetLink) => {
  const customHeader = `
    <div style="
      background: linear-gradient(135deg, ${COLORS.error}20 0%, ${COLORS.primary}20 100%);
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid ${COLORS.error};
    ">
      <div style="
        font-family: 'Oswald', Arial, sans-serif;
        font-size: 18px;
        color: ${COLORS.text};
        margin-bottom: 10px;
      ">
        🔐 PASSWORD RESET REQUEST
      </div>
      <div style="
        font-family: 'Inconsolata', monospace;
        font-size: 12px;
        color: #888;
      ">
        Secure link valid for 24 hours
      </div>
    </div>
  `;

  const content = `
    ${emailUtils.createHeading('Password Reset Request', 1)}
    
    ${emailUtils.createParagraph(`Dear ${firstName || 'Concerned Citizen'},`)}
    
    ${emailUtils.createParagraph(
      'This is an automated response to your forgotten password request.'
    )}
    
    ${emailUtils.createInfoBox(
      `
      <strong>Security Notice:</strong> Click the button below within 24 hours to reset your password. If you didn't request this, you may ignore this message.
    `,
      'warning'
    )}
    
    ${emailUtils.createButton('Reset Password', resetLink, {
      backgroundColor: COLORS.error,
      textColor: '#ffffff',
    })}
    
    ${emailUtils.createParagraph(
      'If you run out of time, it will expire. If so, just return to POWERBACK.us and click "Forgot Password?" at the Login prompt as before.'
    )}
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createSignature('casual')}
  `;

  return createEmailTemplate(content, {
    priority: 0,
    customHeader: customHeader,
  });
};

// Example 5: Receipt request email
const createReceiptEmail = (celebration, firstName) => {
  const content = `
    ${emailUtils.createHeading(
      `Celebration Receipt #${celebration.ordinal}`,
      1
    )}
    
    ${emailUtils.createParagraph(`Dear ${firstName || 'Powered Citizen'},`)}
    
    ${emailUtils.createParagraph(
      "Here's your receipt for the Celebration you made on POWERBACK.us, the only online conduit that serves the People, <em>not</em> the politicians. Thank you for being part of our community working to create meaningful change."
    )}
    
    ${emailUtils.createDivider()}
    
    ${emailUtils.createHeading('Celebration Details', 3)}
    
    ${emailUtils.createTable([
      {
        isHeader: true,
        cells: ['Detail', 'Value'],
      },
      {
        cells: [
          'Recipient',
          celebration.donee.roles[0].short_title +
            ' ' +
            celebration.donee.first_name +
            ' ' +
            celebration.donee.last_name,
        ],
      },
      {
        cells: [
          'Bill',
          celebration.bill.bill + ' - ' + celebration.bill.short_title,
        ],
      },
      {
        cells: ['Donation Amount', '$' + celebration.donation.toFixed(2)],
      },
      {
        cells: ['Tip Amount', '$' + celebration.tip.toFixed(2)],
      },
      {
        cells: [
          'Total',
          '$' +
            (celebration.donation + celebration.fee + celebration.tip).toFixed(
              2
            ) +
            ' (includes processing fee)',
        ],
      },
      {
        cells: [
          'Date of Celebration',
          new Date(celebration.createdAt).toLocaleDateString(),
        ],
      },
      {
        cells: ['ID', celebration.idempotencyKey],
      },
    ])}
    
    ${emailUtils.createInfoBox(
      `
      <strong>Important:</strong> Your celebration will be delivered if/when the bill is brought to the House floor for a vote.
    `,
      'warning'
    )}
    
    ${emailUtils.createParagraph(
      'Thank you for your Celebration and for being part of our extraordinary community.'
    )}
  `;

  return createEmailTemplate(content);
};

// Example 6: Minimal email without logo/footer
const createMinimalEmail = (content) => {
  return createEmailTemplate(content, {
    showLogo: false,
    showFooter: false,
  });
};

module.exports = {
  createAlertEmail,
  createMinimalEmail,
  createReceiptEmail,
  createWelcomeEmail,
  createDonationEmail,
  createPasswordResetEmail,
};
