# POWERBACK.us Email Template System

This directory contains a comprehensive email template system that provides consistent branding and styling across all POWERBACK.us communications.

## Overview

The email template system consists of:

- **`template.js`** - Core template engine with styling utilities
- **`template-examples.js`** - Example implementations for different email types
- **Updated email files** - Existing emails updated to use the new template

## Key Features

### 🎨 Consistent Branding
- Uses POWERBACK.us's color scheme from `App.css`
- Incorporates the POWERBACK.us logo
- Maintains the monospace font preference
- Responsive design for mobile and desktop

### 🛠️ Utility Functions
- `createEmailTemplate()` - Main template wrapper
- `emailUtils.createButton()` - Styled call-to-action buttons
- `emailUtils.createTable()` - Data tables with consistent styling
- `emailUtils.createInfoBox()` - Highlighted information boxes
- `emailUtils.createHeading()` - Typography hierarchy
- `emailUtils.createParagraph()` - Styled text blocks
- `emailUtils.createLink()` - Branded links
- `emailUtils.createDivider()` - Visual separators
- `emailUtils.createSignature()` - Standardized email signatures

### 🎯 Email-Safe Styling
- Inline CSS for maximum email client compatibility
- Fallback fonts and colors
- Mobile-responsive design
- Accessible color contrast

## Usage

### Basic Template Usage

```javascript
const { createEmailTemplate, emailUtils } = require('./template');

const content = `
  ${emailUtils.createHeading('Welcome to POWERBACK.us!', 1)}
  
  ${emailUtils.createParagraph('Dear User,')}
  
  ${emailUtils.createParagraph('Welcome to our platform...')}
  
  ${emailUtils.createButton('Get Started', 'https://powerback.us')}
`;

const html = createEmailTemplate(content, { priority: 2 });
```

### Template Options

```javascript
createEmailTemplate(content, {
  showLogo: true,           // Show/hide POWERBACK.us logo
  showFooter: true,         // Show/hide standard footer
  customHeader: null,       // Custom header HTML
  customFooter: null,       // Custom footer HTML
  priority: 2              // Email priority level
});
```

### Utility Functions

#### Buttons
```javascript
emailUtils.createButton('Click Here', 'https://example.com', {
  backgroundColor: '#fc9',
  textColor: '#000000',
  borderColor: '#080808'
});
```

#### Tables
```javascript
emailUtils.createTable([
  {
    isHeader: true,
    cells: ['Column 1', 'Column 2']
  },
  {
    cells: ['Data 1', 'Data 2']
  }
]);
```

#### Info Boxes
```javascript
emailUtils.createInfoBox('Important information here', 'warning');
// Types: 'info', 'warning', 'error', 'success'
```

#### Links
```javascript
emailUtils.createLink('POWERBACK.us', 'https://powerback.us', {
  color: '#6da7f9',
  underline: false
});
```

#### FEC Compliance Disclaimer
```javascript
emailUtils.createFecDisclaimer();        // Creates FEC-compliant disclaimer
```

#### Signatures
```javascript
emailUtils.createSignature('secure');     // Formal, from Jonathan Alpart
emailUtils.createSignature('jonathan');   // Personal, from Jonathan
emailUtils.createSignature('casual');     // Team signature (default)
emailUtils.createSignature('official');   // Support team signature
```

## Color Scheme

The template uses POWERBACK.us's brand colors:

- **Primary**: `#fc9` (Orange)
- **Secondary**: `#f9c` (Pink)
- **Background**: `#1b1b1b` (Dark gray)
- **Text**: `#ccc` (Light gray)
- **Accent**: `#9bad97` (Muted green)
- **Links**: `#6da7f9` (Blue)
- **Buttons**: `#c9f` (Purple)

## Email Types

### 1. Account Emails
- Welcome emails
- Account activation
- Password resets
- Compliance updates

### 2. Transaction Emails
- Donation confirmations
- Payment receipts
- Celebration notifications

### 3. Alert Emails
- Challenger notifications
- Election date changes
- System updates

### 4. Marketing Emails
- Newsletter updates
- Feature announcements
- Community updates

### Template Differences

#### `New` Template
- Used for automatic receipts sent immediately after celebration creation
- Language: "You've just made a Celebration..."
- Emphasizes the recent action and immediate impact

#### `Receipt` Template  
- Used for manual receipt requests from users
- Language: "Here's your receipt for the Celebration you made..."
- Emphasizes the past action and provides documentation
- Uses "Date of Celebration" instead of "Time of celebration"

## Migration Guide

To update existing emails to use the new template:

1. **Import the template utilities**:
   ```javascript
   const { createEmailTemplate, emailUtils } = require('../template');
   ```

2. **Replace raw HTML with utility functions**:
   ```javascript
   // Old
   const html = `<p>Hello ${firstName}</p>`;
   
   // New
   const content = emailUtils.createParagraph(`Hello ${firstName}`);
   const html = createEmailTemplate(content);
   ```

3. **Update link styling**:
   ```javascript
   // Old
   const link = `<a href="${url}">${text}</a>`;
   
   // New
   const link = emailUtils.createLink(text, url);
   ```

4. **Add structured content**:
   ```javascript
   const content = `
     ${emailUtils.createHeading('Title', 1)}
     ${emailUtils.createParagraph('Content')}
     ${emailUtils.createButton('Action', url)}
   `;
   ```

## FEC Compliance

All POWERBACK.us email communications automatically include the required Federal Election Commission (FEC) disclaimer:

> "Paid for by POWERBACK.us. Not authorized by any candidate or candidate's committee."

### Compliance Features
- **Always Included**: All emails automatically include the FEC disclaimer
- **Non-Configurable**: Disclaimer cannot be disabled (ensures compliance)
- **Consistent Styling**: Disclaimer uses POWERBACK.us brand colors and styling
- **Email-Safe**: Inline CSS ensures compatibility across email clients

### Usage
```javascript
// All emails automatically include FEC disclaimer
const html = createEmailTemplate(content);

// Custom options while maintaining compliance
const html = createEmailTemplate(content, { 
  showFooter: false,
  customHeader: customHeaderContent
});
```

## Best Practices

### Content Structure
- Use headings for hierarchy (H1 for main title, H2-H4 for sections)
- Keep paragraphs concise and scannable
- Use info boxes for important information
- Include clear call-to-action buttons

### Styling
- Use the provided color scheme consistently
- Maintain monospace font for technical content
- Use dividers to separate sections
- Keep mobile responsiveness in mind

### Accessibility
- Ensure sufficient color contrast
- Use semantic HTML structure
- Provide alt text for images
- Test with screen readers

## Testing

To test email templates:

1. **Preview in browser**: Save HTML output and open in browser
2. **Email client testing**: Send test emails to various clients
3. **Mobile testing**: Check responsive behavior on mobile devices
4. **Accessibility testing**: Verify with accessibility tools

## File Structure

```
emails/
├── template.js              # Core template engine
├── template-examples.js     # Usage examples
├── README.md               # This documentation
├── account/                # Account-related emails
├── alerts/                 # Alert notifications
├── info/                   # Information emails
├── password/               # Password-related emails
└── style.js               # Legacy style definitions
```

## Support

For questions or issues with the email template system:

1. Check the examples in `template-examples.js`
2. Review existing email implementations
3. Consult the color scheme and utility documentation
4. Test thoroughly in target email clients
