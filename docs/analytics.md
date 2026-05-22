# Analytics (GA4 Event Tracking)

## Overview

POWERBACK uses a thin analytics utility to send Google Analytics 4 events from the client. Most event calls go through `client/src/utils/analytics/analytics.ts`, which exports `trackGoogleAnalyticsEvent()` and extends the global `Window` type for `gtag`. See [Client Utils](./utils.md) for the full utils catalog.

## Why a central utility

- **Single call site**: One module checks runtime GA availability and fires events. Feature code stays free of GA branching and type casts.
- **Consistent API**: Callers use `trackGoogleAnalyticsEvent(name, params)` instead of ad‑hoc `window.gtag('event', ...)`.
- **Safe when GA is absent**: If the GA script fails to load or is blocked, the utility no-ops instead of throwing.

## Why extend the global Window interface

`gtag` is injected by the Google tag script in `client/public/index.html`, not by a TypeScript/JS module. Without a declaration, TypeScript does not know `window.gtag` exists. Extending `interface Window` in the analytics module gives the app typed access to `gtag` wherever the analytics module is in the build, and keeps the declaration next to the code that uses it.

## How to use

```typescript
import { trackGoogleAnalyticsEvent } from '@Utils';

// Minimal: event name only
trackGoogleAnalyticsEvent('button_clicked');

// With parameters (GA4 custom dimensions / event params)
trackGoogleAnalyticsEvent('limit_validation_failed', {
  limit_type: 'per-donation',
  attempted_amount: 100,
});
```

- **eventName**: string, e.g. `'limit_validation_failed'`, `'modal_opened'`. Use snake_case.
- **params**: optional object. Only include data that is useful for product/UX analysis. Do not send PII.

The function no-ops when `window` is undefined (SSR), when `window.gtag` is missing, or when the app is not running on an allowed production hostname.

## Runtime gating and host policy

- GA is enabled only for production hostnames: `powerback.us` and `www.powerback.us`.
- GA script loading in `client/public/index.html` is also gated to those hostnames.
- `trackGoogleAnalyticsEvent()` and link-click tracking share the same hostname gate to avoid accidental non-prod traffic.

## What we track

We track **high-value engagement points only**: events that directly inform product and compliance behavior (e.g. limit validation failures, key funnel steps, external link usage). We do **not** track every click, scroll, or hover. Prefer a small set of meaningful events over broad instrumentation.

External link clicks and UTM attribution are handled by the [Link Tracking](./link-tracking.md) system (`linkTracking.ts`), not by `trackGoogleAnalyticsEvent`.

## Current GA consumers and contracts

- `campaign_path_seen` (`client/src/App.tsx`)
  - Fires once per tab session for short-link entry paths (`/r/`, `/bsky/`, `/x/`, `/li/`).
  - Params: `campaign_path`.
- `auth_modal_path_switched` (`client/src/components/interactive/Logio/Logio.tsx`)
  - Fires when auth path toggles inside credentials modal or tour modal context.
  - Params: `auth_modal_source`, `from_path`, `to_path`.
- `auth_splash_path_switched` (`client/src/components/interactive/Logio/Logio.tsx`)
  - Fires when auth path toggles on splash auth screens.
  - Params: `auth_modal_source`, `from_path`, `to_path`.
- `auth_modal_shown` (`client/src/pages/Funnel/TabContents/TabContents.tsx`)
  - Fires when celebrate flow is blocked and credentials modal is presented.
  - Params: `auth_modal_source`.
- `pol_search_submitted` (`client/src/components/search/PolCombobox/PolCombobox.tsx`)
  - Fires only on committed search actions (selection, Enter submit, or Find click), not on keystrokes.
  - Params: `search_type`, `search_query_length`, `search_query_normalized`, `matched_entity_type`, `matched_pol_id`, `matched_pol_name`, `matched_state`, `matched_district`, `result_count`, `search_location`.
  - Privacy: `search_query_normalized` is `null` unless query is safely normalized to known name fragment, state code, or district pattern.
- `external_link_click` (`client/src/utils/tracking/linkTracking.ts`)
  - Direct `gtag` event for external link usage.
  - Params: `event_category`, `event_label`, `link_url`, `transport_type`.
- Additional tracked events currently in use:
  - `account_created`, `celebrate_click`, `celebration_completed`, `celebrate_auth_blocked`, `carousel_interaction`, `enter_lobby`, `search_used`, `limit_validation_failed`.

## Rally and share-link events

Rally instrumentation lives in [`Rally.tsx`](../client/src/pages/Rally/Rally.tsx) and [`recordShareLinkVisit.ts`](../client/src/utils/app/recordShareLinkVisit.ts). Product rules: [`specs/rally-page.md`](../specs/rally-page.md) §7; overview: [Rally and share links](./rally-share-links.md).

| Event | When | Params |
| ----- | ---- | ------ |
| `rally_page_seen` | Rally mount (once per session) | `entry`: `splash` \| `share` (boolean session flag only) |
| `rally_manual_share_seen` | Manual share section first seen/interaction | — |
| `share_link_generated` | Successful `POST /api/share-links` after explicit generate | — |
| `share_link_copied` | User copies public URL or claim code | `target`: `url` \| `claim` |
| `share_link_visited` | Inbound visit API success | `has_share_param: true`, `entry: share_link` |
| `rally_email_signup_started` | Email field focus or submit on Rally | — |
| `rally_continue_to_lobby_click` | Continue to Lobby CTA | — |

**Prohibited in Rally-related custom params:** `publicCode`, `claimCode`, email, full share URLs.

### Automatic `page_location` and `?share=`

gtag loads in [`client/public/index.html`](../client/public/index.html) before React. The initial `gtag('config')` sets `page_path` and `page_location` **without** the `share` query param so the default `page_view` does not include the referral code. The app still reads `?share=` for the visit API, then [`stripShareQueryFromUrl()`](../client/src/utils/app/recordShareLinkVisit.ts) removes it from the address bar.

**Residual risk:** the browser URL may briefly show `?share=` before strip; third-party tools or future SPA `gtag('config')` calls could observe the full URL. Follow-up: audit any added client-side page-view tracking.

## Remote GA consumer changes (last several `origin/main` commits)

Reviewed recent remote history and reflected GA-impacting changes below.

- `dd38943` - Restrict GA tracking to production hostnames
  - Added shared hostname allowlist gate in analytics utility.
  - Gated `external_link_click` tracking via `shouldEnableGoogleAnalytics()`.
  - Gated GA script bootstrap in `client/public/index.html`.
- `6d97a67` - Align auth path tracking params with GA definitions
  - Renamed auth path event params from `from_auth_modal_path` / `to_auth_modal_path` to `from_path` / `to_path`.
  - Kept `auth_modal_source`.
- `7a08f4c` - Track auth modal path switching in GA
  - Added/established auth path switch events in `Logio`.
- `afa0ded` - Track campaign path landing events
  - Added `campaign_path_seen` event in `App` with `campaign_path` param and session dedupe.
- `8cf2dd2` - Type Joyride GA tracking parameters
  - Tightened GA parameter typing in funnel tour tracking path.

## What we do not use

- **Advertising features** – no ad personalization or ad-related data.
- **User-provided data uploads** – no uploading of PII or custom user data to GA.
- **Remarketing** – no audiences built from GA data for ads.
- **Behavioral targeting** – no use of GA data to target users elsewhere.

Analytics is used for aggregate, non-PII insights only.

## Do not over-instrument

- Add a new event only when it answers a clear product or compliance question.
- Reuse existing event names and parameters where possible.
- Avoid tracking for “nice to have” or speculative dashboards.

> **Related:** [Link Tracking](./link-tracking.md) – UTM parameters and external-link click events.  
> **Related:** [Rally and share links](./rally-share-links.md) – share-first funnel and inbound visit flow.
