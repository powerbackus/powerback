const fs = require('fs');
const path = require('path');

const PB_URL = process.env.PROD_URL,
  SUPPORT_EMAIL = process.env.REACT_APP_EMAIL_SUPPORT_USER;

// Load logo image as base64 data URI
const LOGO_BASE64 = (() => {
  try {
    const logoPath = path.join(__dirname, '../../../client/public/logo192.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    return null;
  }
})();

// POWERBACK.us logo SVG (simplified for email compatibility; width allows full "us")
const POWERBACK_LOGO = `
<svg width="240" height="40" viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="28" font-family="Oswald, Arial, sans-serif" font-size="24" font-weight="bold" fill="#fc9" text-anchor="start">
    POWERBACK.us
  </text>
</svg>
`;

// Email-safe color variables (aligned with app theme: --btn, --text-black, --btn-border)
const COLORS = {
  background: '#1b1b1b',
  text: '#ccc',
  primary: '#fc9',
  secondary: '#f9c',
  secondaryDarkMode: '#ff69b4', // More vibrant pink for dark mode
  accent: '#9bad97',
  success: '#20cf9d',
  error: '#ff9a98',
  shoeBlack: '#080808',
  link: '#9cf',
  linkHover: '#6da7f9',
  linkActive: '#8bbbfd',
  button: '#c9f', // same as app --btn (#cc99ff)
  btnText: '#171717', // same as app --text-black; use for CTA button label
  btnBorder: '#6f42c1', // same as app --btn-border
  hardAccent: '#cfc',
  buttonHover: '#c48aff',
  buttonActive: '#d1a3ff',
};

// Base email template structure
const createEmailTemplate = (content, options = {}) => {
  const {
    showLogo = true,
    showFooter = true,
    customFooter = null,
    customHeader = null,
  } = options;

  const header =
    customHeader ??
    `
    <div style="
      background: linear-gradient(135deg, ${COLORS.background} 0%, ${
        COLORS.shoeBlack
      } 100%);
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid ${COLORS.primary};
    ">
      ${
        showLogo
          ? `
        <div style="margin-bottom: 15px;">
          <a href="${PB_URL}" style="text-decoration: none;">
            ${POWERBACK_LOGO}
          </a>
        </div>
      `
          : ''
      }
      <div style="
        font-family: 'Oswald', Arial, sans-serif;
        font-size: 14px;
        color: ${COLORS.text};
        letter-spacing: 1px;
        font-style: italic;
      ">
        ${process.env.REACT_APP_TAGLINE}
      </div>
    </div>
  `;

  const footer =
    customFooter ??
    `
    <div style="
      background: ${COLORS.shoeBlack};
      padding: 20px;
      text-align: center;
      border-top: 2px solid ${COLORS.primary};
      margin-top: 30px;
    ">
      <div style="
        font-family: 'Inconsolata', monospace;
        font-size: 12px;
        color: ${COLORS.text};
        line-height: 1.6;
      ">
        <div style="margin-bottom: 10px;">
          <strong style="color: ${
            COLORS.primary
          };">POWERBACK.us</strong> - The only online conduit that serves the People, <em>not</em> the politicians
        </div>
        <div style="margin-bottom: 15px;">
          <a href="${PB_URL}" style="
            color: ${COLORS.link};
            text-decoration: none;
            font-weight: bold;
          ">${PB_URL}</a>
        </div>
        <div style="margin-bottom: 15px;">
          <a href="${PB_URL}" style="text-decoration: none;">
            <img src="${LOGO_BASE64 || `${PB_URL}/logo192.png`}" alt="POWERBACK.us" width="48" height="48" style="
              display: block;
              margin: 0 auto;
              border: 0;
              outline: none;
              text-decoration: none;
              filter: invert(1);
            " />
          </a>
        </div>
        <div style="
          font-size: 10px;
          color: #888;
          border-top: 1px solid #333;
          padding-top: 10px;
        ">
          Questions? Call us or email ${emailUtils.createLink(
            SUPPORT_EMAIL,
            `mailto:${SUPPORT_EMAIL}`
          )}
        </div>
        <!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>POWERBACK.us</title>
      <style>
        @media (prefers-color-scheme: dark) {
          .heading-secondary {
            color: ${COLORS.secondaryDarkMode} !important;
            -webkit-text-fill-color: ${COLORS.secondaryDarkMode} !important;
          }
        }
        /* Force color for email clients that ignore media queries */
        .heading-secondary {
          color: ${COLORS.secondary} !important;
          -webkit-text-fill-color: ${COLORS.secondary} !important;
        }
      </style>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      background-color: ${COLORS.background};
      font-family: 'Inconsolata', 'Courier New', monospace;
      line-height: 1.6;
    ">
      <div style="
        max-width: 600px;             
        color: ${COLORS.text};
        margin: 0 auto;
        background-color: ${COLORS.background};
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        ${header}
        
        <div style="
          padding: 30px;
          background-color: ${COLORS.background};
          min-height: 300px;
          color: ${COLORS.text};
        ">
          ${content}
        </div>
        
        ${showFooter ? footer : ''}
        ${emailUtils.createFecDisclaimer()}
      </div>
    </body>
    </html>
  `;
};

// Utility functions for common email elements
const emailUtils = {
  // Create a styled button (default: theme CTA - purple bg, dark text, matches app --btn)
  createButton: (text, href, options = {}) => {
    const {
      backgroundColor = COLORS.button,
      textColor = COLORS.btnText,
      borderColor = COLORS.btnBorder,
    } = options;

    return `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${href}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: ${backgroundColor};
          color: ${textColor};
          text-decoration: none;
          font-family: 'Oswald', Arial, sans-serif;
          font-weight: bold;
          border: 2px solid ${borderColor};
          border-radius: 4px;
          box-shadow: 4px 6px 0px ${COLORS.shoeBlack};
          transition: all 0.2s ease;
        ">${text}</a>
      </div>
    `;
  },

  // Create a styled section divider
  createDivider: () => `
    <div style="
      height: 2px;
      background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent});
      margin: 25px 0;
      border-radius: 1px;
    "></div>
  `,

  // Create a styled info box
  // info = neutral gray (generic info); success = green (good news); warning = amber (procedural); error = red (security only)
  createInfoBox: (content, type = 'info') => {
    const colors = {
      info: { bg: '#1e1e1e', border: '#6b7280' },
      success: { bg: '#1a2a1a', border: COLORS.success },
      warning: { bg: '#2a281a', border: COLORS.primary },
      error: { bg: '#2a1a1a', border: COLORS.error },
    };

    const style = colors[type] ?? colors.info;

    return `
      <div style="
        background-color: ${style.bg};
        border-left: 4px solid ${style.border};
        padding: 15px;
        margin: 20px 0;
        border-radius: 0 4px 4px 0;
      ">
        ${content}
      </div>
    `;
  },

  // Create a styled table
  createTable: (rows, options = {}) => {
    const {
      width = '100%',
      headerBg = COLORS.shoeBlack,
      borderColor = '#333',
    } = options;

    const tableRows = rows
      .map((row) => {
        if (row.isHeader) {
          return `
          <tr style="background-color: ${headerBg};">
            ${row.cells
              .map(
                (cell) => `
              <td style="
                padding: 12px;
                border: 1px solid ${borderColor};
                font-weight: bold;
                color: ${COLORS.primary};
              ">${cell}</td>
            `
              )
              .join('')}
          </tr>
        `;
        } else {
          return `
          <tr>
            ${row.cells
              .map(
                (cell) => `
              <td style="
                padding: 12px;
                border: 1px solid ${borderColor};
              ">${cell}</td>
            `
              )
              .join('')}
          </tr>
        `;
        }
      })
      .join('');

    return `
      <table style="
        width: ${width};
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
      ">
        ${tableRows}
      </table>
    `;
  },

  // Create a styled heading
  createHeading: (text, level = 2) => {
    const sizes = { 1: '28px', 2: '24px', 3: '20px', 4: '18px' };
    const size = sizes[level] ?? '20px';

    return `
      <h${level} class="heading-secondary" style="
        color: ${COLORS.secondary} !important;
        font-family: 'Oswald', Arial, sans-serif;
        font-size: ${size};
        margin: 25px 0 15px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: bold;
        display: block;
        background-color: transparent !important;
        -webkit-text-fill-color: ${COLORS.secondary} !important;
        -webkit-font-smoothing: antialiased;
        text-shadow: 0 0 1px ${COLORS.secondary};
      ">${text}</h${level}>
    `;
  },

  // Create a styled paragraph
  createParagraph: (text, options = {}) => {
    const {
      fontSize = '14px',
      margin = '15px 0',
      textAlign = 'left',
    } = options;

    // Handle array of strings - create multiple paragraphs
    if (Array.isArray(text)) {
      return text
        .map(
          (paragraph) => `
        <p style="
          font-size: ${fontSize};
          margin: ${margin};
          text-align: ${textAlign};
          line-height: 1.6;
        ">${paragraph}</p>
      `
        )
        .join('');
    }

    // Handle single string (existing behavior)
    return `
      <p style="
        font-size: ${fontSize};
        margin: ${margin};
        text-align: ${textAlign};
        line-height: 1.6;
      ">${text}</p>
    `;
  },

  // Create a styled link
  createLink: (text, href, options = {}) => {
    const { color = COLORS.link, underline = false } = options;

    //   return `
    //     <a href="${href}" style="
    //       color: ${color};
    //       text-decoration: ${underline ? 'underline' : 'none'};
    //       font-weight: bold;
    //     ">${text}</a>
    //   `;
    // },

    return `<a href="${href}" style="
        color: ${color};
        text-decoration: ${underline ? 'underline' : 'none'};
        font-weight: bold;
      ">${text}</a>`;
  },

  // Create FEC compliance disclaimer
  createFecDisclaimer: () => `
    <div style="
      background-color: ${COLORS.shoeBlack};
      border: 2px solid ${COLORS.primary};
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
      font-family: 'Inconsolata', 'Courier New', monospace;
      font-size: 12px;
      color: ${COLORS.text};
      line-height: 1.4;
    ">
      <strong style="color: ${COLORS.primary};">FEC Compliance Notice:</strong><br/>
      Paid for by POWERBACK.us. Not authorized by any candidate or candidate's committee.
    </div>
  `,

  // Create a styled signature
  createSignature: (type = 'casual', options = {}) => {
    const { signatures } = require('./signatures');
    const signatureText = signatures[type] ?? signatures.casual;

    return emailUtils.createParagraph(signatureText, {
      textAlign: 'center',
      margin: '25px 0 15px 0',
      ...options,
    });
  },
};

module.exports = {
  createEmailTemplate,
  POWERBACK_LOGO,
  emailUtils,
  COLORS,
};
