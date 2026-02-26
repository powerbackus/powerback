# Email System Documentation

## Overview

The POWERBACK email system handles all outgoing communications to users, including receipts, notifications, alerts, and account-related messages. The system has been refactored to use a clean, maintainable architecture with consistent interfaces.

## Architecture

### Core Components

- **`sendEmail`** - Main email transport function
- **Email Templates** - Individual template functions in `controller/comms/emails/`
- **Address Management** - Email address mapping in `controller/comms/addresses.js`
- **Email topics and unsubscribe** - Topic-based preferences, filtering (`filterUnsubscribed`), and one-click unsubscribe links; see [Email topics and unsubscribe](#email-topics-and-unsubscribe)

### Email Addresses

The system uses 7 different email addresses, organized by usage frequency:

```javascript
addresses = [
  'info-noreply', // 0 - most frequently used (6 times)
  'account-security-noreply', // 1 - frequently used (4 times)
  'jonathan', // 2 - frequently used (3 times)
  'alerts-noreply', // 3 - frequently used (3 times)
  'error-reporter', // 4 - occasionally used (1 time)
  'outreach', // 5 - occasionally used (1 time)
  'support', // 6 - occasionally used (1 time)
];
```

## Usage

### Basic Email Sending

```javascript
const { sendEmail } = require('../comms');
const { emails } = require('../comms/emails');

// Send a receipt email
await sendEmail(user.email, emails.Receipt, celebration, user.firstName);

// Send a promotion notification
await sendEmail(user.email, emails.Promoted, user.firstName, 'compliant');
```

### Template Interface

All email templates follow a consistent interface:

```javascript
const TemplateName = (param1, param2, ...) => {
  // Template logic here
  return [
    fromIndex,    // Email address index (0-6)
    subject,      // Email subject line
    html,         // Rendered HTML content
    topic         // Optional: email topic key for unsubscribe link injection (e.g. EMAIL_TOPICS.billUpdates)
  ];
};
```

Templates that include the optional fourth element (`topic`) get an unsubscribe link injected into the email footer (see [Email topics and unsubscribe](#email-topics-and-unsubscribe)).

## Email Templates

### Account Management

- **`JoiningUp`** - Welcome email with activation link
- **`JoinedUp`** - Account activation confirmation
- **`Promoted`** - Compliance tier upgrade notification
- **`Quitter`** - Account deletion confirmation

### Password Management

- **`Forgot`** - Password reset request
- **`Reset`** - Password reset confirmation
- **`Change`** - Password change confirmation
- **`Locked`** - Account locked due to suspicious activity

### Donation Management

- **`New`** - New celebration confirmation
- **`Receipt`** - Celebration receipt
- **`Update`** - Donation update notification

### Alerts & Notifications

- **`PacLimitReached`** - PAC limit reached notification
- **`DefunctCelebrationNotification`** - Celebrations became defunct (non-refundable policy)
- **`DefunctCelebrationWarning`** - Session ending warning
- **`ElectionDateChanged`** - Election date change alert
- **`ChallengerAppeared`** - New challenger alert
- **`Hjres54BillUpdated`** - H.J.Res.54 (We The People Amendment) bill activity alert
- **`ChallengerDisappeared`** - Challenger left race
- **`ChallengerReappeared`** - Challenger returned
- **`IncumbentDroppedOut`** - Incumbent no longer seeking re-election

### System

- **`Image`** - Image loading error notification
- **`Test`** - System test email

## Template Categories

### By Email Address

#### info-noreply@powerback.us (Index 0)

- New celebration confirmations
- Receipt emails
- Donation updates
- Promotion notifications
- Test emails

#### account-security-noreply@powerback.us (Index 1)

- Password reset requests
- Password change confirmations
- Account activation emails
- Security lock notifications

#### jonathan@powerback.us (Index 2)

- PAC limit reached notifications
- Account activation confirmations
- Account deletion confirmations
- Election date notifications

#### alerts-noreply@powerback.us (Index 3)

- Challenger alerts
- Defunct celebration notifications
- Election date change alerts
- H.J.Res.54 bill update alerts

#### error-reporter@powerback.us (Index 4)

- Image loading errors

#### outreach@powerback.us (Index 5)

- Congressional session warnings

#### support@powerback.us (Index 6)

- Challenger disappeared notifications

## Email topics and unsubscribe

Topic-based emails (e.g. challenger alerts, election date changes, bill updates) respect user preferences and include a one-click unsubscribe link. The system is designed so senders filter by topic before sending and templates declare their topic so the correct link can be injected.

### Topic definitions

The single source of truth is **`shared/emailTopics.js`**:

- **`EMAIL_TOPICS`** – Object of topic keys (camelCase) used in code, e.g. `electionUpdates`, `districtUpdates`, `celebrationUpdates`, `billUpdates`.
- **`EMAIL_TOPIC_NAMES`** – Display names for each topic (shown in account settings and in unsubscribe links).
- **`EMAIL_TOPICS_ARRAY`** – Ordered array of topic keys for UI iteration.

Current topics:

| Key                  | Display name                       |
| -------------------- | ---------------------------------- |
| `districtUpdates`    | District Challenger Alerts         |
| `electionUpdates`    | Election Date Updates              |
| `celebrationUpdates` | Celebration Status Updates         |
| `billUpdates`        | We The People (H.J.Res.54) Updates |

Topic keys are stored and compared as-is (camelCase). Do not use snake_case in new code.

### Storing preferences

- User preferences live in **`User.settings.unsubscribedFrom`** (array of topic strings).
- If the array contains a topic key, the user is unsubscribed from that topic.
- Missing or empty `settings.unsubscribedFrom` means the user is subscribed to all topics.
- Users manage these in **Account → Settings → Preferences** (checkboxes per topic).

### Sending: filter then send

Before sending a topic-based email to a list of users:

1. **Filter** the list with **`filterUnsubscribed(users, topic)`** from `controller/comms`. It returns only users who are not unsubscribed from that topic (batch MongoDB query).
2. **Send** to each filtered user via **`sendEmail(to, template, ...args)`**.
3. The **template** must return a 4-element array including the **topic** (fourth element) so `sendEmail` can inject the unsubscribe link.

Example (e.g. in a job):

```javascript
const { sendEmail, filterUnsubscribed } = require('../controller/comms');
const { EMAIL_TOPICS } = require('../constants');
const Hjres54BillUpdated =
  require('../controller/comms/emails/alerts/Hjres54BillUpdated').Hjres54BillUpdated;

const users = await User.find()
  .select('email username firstName settings.unsubscribedFrom')
  .lean();
const subscribed = await filterUnsubscribed(users, EMAIL_TOPICS.billUpdates);
for (const user of subscribed) {
  const to = (user.email || user.username || '').trim();
  if (!to) continue;
  await sendEmail(to, Hjres54BillUpdated, user.firstName, changeSummary);
}
```

For a single-user check, use **`isUnsubscribed(userId, topic)`** from `controller/comms` instead of filtering a list.

### Unsubscribe link injection

- When a template returns a **topic** (4th element), `sendEmail` looks up the recipient user and generates a signed unsubscribe link.
- The link is inserted by replacing **`<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->`** in the HTML. The default footer from **`createEmailTemplate()`** in `controller/comms/emails/template.js` already contains this placeholder.
- Link format: `{PROD_URL}/unsubscribe/{hash}?topic={topic}`. The hash is created/retrieved via **`controller/users/account/utils/unsubscribe`** (`getOrInitiate`).
- If the user is not found or MongoDB is unavailable, the placeholder is removed and the email is sent without an unsubscribe link (fail-open).

### One-click unsubscribe flow

1. User clicks the link in the email: **GET** `/unsubscribe/:hash?topic=...` (frontend route; app calls **GET** `/api/users/unsubscribe/:hash` to verify the hash).
2. Frontend shows a confirmation page (e.g. “Unsubscribe from [Topic name]?”).
3. User confirms: **POST** `/api/users/unsubscribe` with `{ hash, topic }`. Backend adds `topic` to `user.settings.unsubscribedFrom` and responds.
4. Hash is one-time-use for that topic; verification can return `isExpired` if the link was already used or expired.

See **`routes/api/users.js`** (routes `/unsubscribe/:hash` and `/unsubscribe`) and **`controller/users/account/utils/unsubscribe`** (verify, confirm).

### Account settings UI

In **Account → Settings → Preferences**, users can toggle each topic (subscribed vs unsubscribed). The UI uses **`EMAIL_TOPICS_ARRAY`** and **`EMAIL_TOPIC_NAMES`** from the shared constants (via frontend constants). Updates are persisted via the account update API (`settings.unsubscribedFrom`).

### Fail-open behavior

- **`filterUnsubscribed`** and **`isUnsubscribed`**: If MongoDB is not connected (e.g. in some tests), they assume users are subscribed and do not block sending.
- **Unsubscribe link injection**: If the user cannot be found or an error occurs, the placeholder is removed and the email is sent without the link; sending is not aborted.

### Adding a new topic

1. Add the key and display name to **`shared/emailTopics.js`** (`EMAIL_TOPICS`, `EMAIL_TOPIC_NAMES`, and `EMAIL_TOPICS_ARRAY`).
2. Ensure any template that sends for this topic returns the topic as the 4th element and uses **`createEmailTemplate()`** so the footer (with `<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->`) is present.
3. Call **`filterUnsubscribed(users, EMAIL_TOPICS.newTopic)`** (or **`isUnsubscribed(userId, ...)`**) before sending.
4. No backend route changes are needed; the existing unsubscribe routes are topic-agnostic.

## Development

### Adding New Templates

1. Create template function in appropriate category folder
2. Follow the standard interface: `(params...) => [fromIndex, subject, html]` or `[fromIndex, subject, html, topic]` for topic-based emails (see [Email topics and unsubscribe](#email-topics-and-unsubscribe))
3. Add template to `controller/comms/emails/index.js` if it is exported from the emails barrel
4. Use in code: `sendEmail(user.email, emails.NewTemplate, ...args)`; for topic-based sends, filter recipients with `filterUnsubscribed(users, topic)` first

### Template Structure

```javascript
const { createEmailTemplate, emailUtils } = require('../template');

const NewTemplate = (param1, param2) => {
  const content = `
    ${emailUtils.createHeading('Template Title', 1)}
    ${emailUtils.createParagraph('Template content...')}
  `;

  return [
    0, // info-noreply@powerback.us
    'Email Subject',
    createEmailTemplate(content),
    // EMAIL_TOPICS.someTopic  // optional 4th element for unsubscribe link
  ];
};
```

### Email Utilities

The `emailUtils` object provides helper functions for common email elements:

- `createHeading(text, level)` - Styled headings
- `createParagraph(text, options)` - Styled paragraphs
- `createButton(text, href, options)` - Call-to-action buttons
- `createInfoBox(content, type)` - Information boxes
- `createTable(rows, options)` - Data tables
- `createLink(text, href)` - Styled links
- `createDivider()` - Section dividers
- `createSignature(type)` - Email signatures

## Migration Notes

### From Old System

The email system was refactored from a complex switch statement to a clean function-based approach:

**Before:**

```javascript
// Complex switch statement with inconsistent signatures
await sendEmail(user.email, payload, 'Receipt', firstName);
await sendEmail(user.email, null, 'Promoted', firstName, tier);
```

**After:**

```javascript
// Clean, consistent interface
await sendEmail(user.email, emails.Receipt, payload, firstName);
await sendEmail(user.email, emails.Promoted, firstName, tier);
```

### Benefits

- **90+ lines reduced to ~15 lines** in `sendEmail` function
- **Consistent interface** across all templates
- **Easy maintenance** - no switch statement updates needed
- **Type safety** - each template defines its own parameters
- **Single responsibility** - templates handle logic, `sendEmail` handles transport

## Testing

The email system can be tested by calling template functions directly:

```javascript
const { emails } = require('../comms/emails');

// Test template output
const result = emails.Receipt(mockCelebration, 'John');
console.log(result); // [0, 'Subject', '<html>...</html>']
```

## Configuration

Email configuration is handled in `controller/comms/sendEmail.js`:

```javascript
const CONFIG = {
  auth: {
    pass: process.env.EMAIL_JONATHAN_PASS,
    user: process.env.EMAIL_JONATHAN_USER,
  },
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ?? 465,
  secure: true,
  tls: {
    rejectUnauthorized: false, // For SSL certificate mismatches
  },
};
```

### Environment Variables Required:

- `EMAIL_HOST` - SMTP server hostname (e.g., `mail.powerback.us`)
- `EMAIL_DOMAIN` - Email domain for addresses (e.g., `powerback.us`)
- `EMAIL_JONATHAN_USER` - Email service username
- `EMAIL_JONATHAN_PASS` - Email service password
- `EMAIL_NO_REPLY_PASS` - No-reply email password
- `EMAIL_PORT` - SMTP port (default: 465)

### SSL Certificate Issues:

If you encounter SSL certificate errors like:

```
Hostname/IP does not match certificate's altnames: Host: localhost
```

**Solutions:**

1. **Use correct SMTP host** that matches your SSL certificate
2. **Add TLS configuration** to bypass certificate validation:
   ```javascript
   tls: {
     rejectUnauthorized: false;
   }
   ```
3. **Use port 587 with STARTTLS** instead of port 465 with SSL

### Production Email Setup:

For production, ensure your SSL certificate includes the email server domain in its altnames, or use the TLS bypass configuration shown above.

## Related Documentation

- [Background Jobs](./background-jobs.md) - Jobs that send emails
- [Defunct Celebrations System](./defunct-celebrations-system.md) - Defunct notification emails
- [Election Date Notifications](./election-dates.md) - Election date change emails
- [Link Tracking](./link-tracking.md) - Email link tracking
- [FEC Compliance Guide](./fec-compliance-guide.md) - FEC disclaimer requirements
