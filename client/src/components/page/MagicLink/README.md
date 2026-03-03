# MagicLink Component

A shared wrapper component for hash-based magic link pages (password reset, unsubscribe, etc.).

## Purpose

This component abstracts the common functionality shared between Reset and Unsub pages:
- Hash verification using `useHashVerification` hook
- Loading state management
- Automatic redirect on invalid/expired links
- Shared UI structure (Container, Row, Col, Card)

## Usage

### Basic Example

```tsx
import { MagicLink } from '@Components/page';
import API from '@API';

<MagicLink
  routeType="reset"
  verifyHash={(hash) => API.confirmResetPasswordHash(hash)}
  onValid={(data) => setUserIsAssumedValid(data.isHashConfirmed)}
  onExpired={(data) => setLinkIsExpired(data.isLinkExpired)}
  homeLinkRedirect={homeLinkRedirect}
  containerId="reset-container"
>
  {({ hash, isValid, isExpired, loading }) => {
    if (!hash || !isValid) return null;
    return <ResetForm hash={hash} />;
  }}
</MagicLink>
```

### With Custom Redirect Logic

```tsx
<MagicLink
  routeType="unsubscribe"
  verifyHash={(hash) => API.verifyUnsubscribeHash(hash)}
  homeLinkRedirect={homeLinkRedirect}
  containerId="unsubscribe-container"
  cardBodyClassName="text-center"
  shouldRedirect={({ isValid, isExpired, hash }) => {
    // Custom redirect logic: also redirect if topic is missing
    const topic = new URLSearchParams(window.location.search).get('topic');
    return !isValid || isExpired || !topic;
  }}
>
  {({ hash, isValid }) => {
    const topic = new URLSearchParams(window.location.search).get('topic');
    return <UnsubscribeConfirmation hash={hash} topic={topic} />;
  }}
</MagicLink>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `routeType` | `'reset' \| 'unsubscribe' \| 'activate'` | Yes | Route type for hash verification |
| `verifyHash` | `(hash: string) => Promise<AxiosResponse>` | Yes | API function to verify hash |
| `onValid` | `(data) => void` | No | Callback when hash is valid |
| `onExpired` | `(data) => void` | No | Callback when hash is expired |
| `onInvalid` | `() => void` | No | Callback when hash is invalid |
| `onError` | `() => void` | No | Callback when verification fails |
| `homeLinkRedirect` | `() => void` | Yes | Function to redirect to home |
| `containerId` | `string` | Yes | Container ID for CSS targeting |
| `cardBodyClassName` | `string` | No | Additional CSS classes for Card.Body |
| `children` | `(props) => ReactNode` | Yes | Render function receiving hash state |
| `shouldRedirect` | `(props) => boolean` | No | Custom redirect condition |

## Children Render Props

The `children` function receives an object with:

- `hash: string | null` - Verified hash string or null
- `isValid: boolean` - Whether hash is valid
- `isExpired: boolean` - Whether hash is expired
- `loading: boolean` - Whether verification is in progress

## Current Usage

**Reset.tsx** and **Unsub.tsx** have been migrated to use MagicLink. Both pages now use this shared component for consistent hash verification, loading states, and error handling.

**Account activation** does not use MagicLink as it's an automatic process that doesn't require user interaction. Activation links redirect to home and show a success alert.

## Notes

- Account activation (`activate` route type) is supported in the hook but not used for page rendering, as activation is automatic and redirects to home with an alert
- The component handles both `/activate/:hash` and legacy `/join/:hash` URLs for account activation

