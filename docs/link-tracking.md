# Link Tracking System

## Overview

POWERBACK uses a link tracking system to monitor external link clicks and attribute traffic through UTM parameters. This helps track backlinks, measure user engagement with external resources, and understand how users discover and interact with external platforms.

> **📖 Related Documentation:**
> - [Email System](./email-system.md) - Email link tracking
> - [Design System](./design-system.md) - UI components

## How It Works

The link tracking system consists of two main components:

1. **UTM Parameter Injection**: Adds tracking parameters to external URLs for attribution
2. **Google Analytics Event Tracking**: Sends click events to Google Analytics for analytics

## Implementation

The tracking system is implemented in `client/src/utils/linkTracking.ts` and provides several utility functions:

### Core Functions

#### `addTrackingParams(url, config, linkText?)`

Adds UTM parameters to external URLs. Only processes URLs starting with `http://` or `https://` (skips relative paths and `mailto:` links).

**Parameters:**
- `url` - The URL to add tracking to
- `config` - Tracking configuration object
  - `medium` (required) - Context identifier (e.g., 'faq', 'footer', 'support', 'sidenav')
  - `source` (optional) - Source identifier (default: 'powerback')
  - `campaign` (optional) - Campaign identifier (default: 'backlink')
  - `content` (optional) - Content identifier (auto-generated from linkText if not provided)
- `linkText` (optional) - Link text used to generate content parameter

**Example:**
```typescript
const trackedUrl = addTrackingParams(
  'https://github.com/powerbackus/powerback',
  { medium: 'faq' },
  'GitHub'
);
// Returns: 'https://github.com/...?utm_source=powerback&utm_medium=faq&utm_campaign=backlink&utm_content=github'
```

#### `trackLinkClick(url, linkText, config)`

Sends a Google Analytics event when an external link is clicked. Only tracks if `gtag` is available and user has consented to analytics.

**Parameters:**
- `url` - The URL that was clicked
- `linkText` - The text of the link
- `config` - Tracking configuration for event metadata

**Event Details:**
- Event name: `external_link_click`
- Event category: `config.medium`
- Event label: `linkText`
- Custom parameter: `link_url`

#### `getTrackedLink(url, config, linkText?)`

Convenience function that returns both the tracked URL and click handler. Most commonly used function.

**Returns:**
```typescript
{
  trackedUrl: string,  // URL with UTM parameters
  onClick: () => void   // Click handler for tracking
}
```

**Example:**
```typescript
const { trackedUrl, onClick } = getTrackedLink(
  'https://github.com/powerbackus/powerback',
  { medium: 'faq' },
  'GitHub'
);

<a href={trackedUrl} onClick={onClick}>GitHub</a>
```

## Usage Locations

### FAQ Links

FAQ answers can include HTML `<a>` tags that are automatically parsed and tracked. The tracking medium is `'faq'`.

**Location:** `client/src/components/page/navs/modals/FAQ/subcomps/body/QAccordian/QAccordian.tsx`

**Implementation:**
- FAQ answers in `client/src/tuples/faq.js` can include HTML links
- The `parseFAQAnswer` function automatically:
  - Parses `<a>` tags from FAQ text
  - Adds UTM tracking parameters
  - Attaches click event handlers
  - Applies `natural-link` CSS class

**Example FAQ answer:**
```javascript
a: `Check out our code on <a href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>`
```

### Side Navigation Links

External links in the side navigation panel are tracked with medium `'sidenav'`.

**Location:** `client/src/components/page/navs/SideNav/Panel/Panel.tsx`

**Implementation:**
- GitHub and Discord links use `SideLink` component
- `SideLink` accepts `trackingMedium` prop
- Automatically applies tracking to external `href` values

### Footer Citations

Citation links in the footer are tracked with medium `'footer'`.

**Location:** `client/src/utils/visitCitation.js`

**Implementation:**
- Uses `addTrackingParams` and `trackLinkClick` directly
- Applied to all citation links in the footer

### Confirmation Page Links

Patreon and Discord links on the Confirmation (post-donation) page are tracked with medium `'confirmation'`.

**Location:** `client/src/pages/Funnel/TabContents/Confirmation/content/HelpAsk/HelpAsk.tsx`

**Implementation:**
- Uses `getTrackedLink` for Patreon and Discord links
- Applied in the `HelpAsk` component (Confirmation tab content lives in `Confirmation/content/` subdirs)

## Tracking Mediums

The following mediums are used throughout the application:

- `'faq'` - Links in FAQ answers
- `'footer'` - Citation links in footer
- `'sidenav'` - Links in side navigation panel
- `'support'` - Links on Confirmation page

## UTM Parameter Structure

All tracked links include the following UTM parameters:

- `utm_source=powerback` - Identifies POWERBACK as the source
- `utm_medium={medium}` - Context where the link appears (faq, footer, etc.)
- `utm_campaign=backlink` - Identifies these as backlinks
- `utm_content={content}` - Auto-generated from link text (lowercase, hyphenated, max 50 chars)

## Google Analytics Events

When a tracked link is clicked, a Google Analytics event is sent:

```javascript
gtag('event', 'external_link_click', {
  event_category: '{medium}',
  event_label: '{linkText}',
  link_url: '{url}',
  transport_type: 'beacon'
});
```

This allows tracking:
- Which links are clicked most often
- Which contexts (mediums) drive the most external clicks
- User engagement with external resources

## Adding Tracking to New Links

### In React Components

Use `getTrackedLink` for the simplest approach:

```typescript
import { getTrackedLink } from '@Utils';

const { trackedUrl, onClick } = getTrackedLink(
  'https://example.com',
  { medium: 'your-context' },
  'Link Text'
);

<a href={trackedUrl} onClick={onClick}>Link Text</a>
```

### In FAQ Answers

Simply include HTML `<a>` tags in FAQ answer strings. The FAQ component automatically applies tracking:

```javascript
a: `Check out <a href="${URL}" target="_blank" rel="noopener noreferrer">this link</a>`
```

### Manual Implementation

For more control, use the functions directly:

```typescript
import { addTrackingParams, trackLinkClick } from '@Utils';

const handleClick = () => {
  trackLinkClick(originalUrl, 'Link Text', { medium: 'context' });
};

<a
  href={addTrackingParams(originalUrl, { medium: 'context' }, 'Link Text')}
  onClick={handleClick}
>
  Link Text
</a>
```

## Best Practices

1. **Always use tracking for external links** - Helps measure engagement and attribution
2. **Choose appropriate mediums** - Use descriptive medium names that indicate context
3. **Include link text** - Helps generate meaningful `utm_content` parameters
4. **Test tracking** - Verify UTM parameters appear in URLs and events fire in Google Analytics
5. **Respect user privacy** - Tracking only works if user has consented to analytics (handled by CookieConsent)

## Technical Notes

- Tracking only applies to external URLs (`http://` or `https://`)
- Relative paths and `mailto:` links are not tracked
- UTM parameters are preserved if already present in URLs
- Google Analytics events only fire if `window.gtag` is available
- Click tracking uses `transport_type: 'beacon'` for reliable delivery
