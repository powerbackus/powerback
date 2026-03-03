# Analytics (GA4 Event Tracking)

## Overview

POWERBACK uses a thin analytics utility to send Google Analytics 4 events from the client. All GA event calls go through `client/src/utils/analytics.ts`, which exports a single function and extends the global `Window` type for `gtag`. See [Client Utils](./utils.md) for the full utils catalog.

## Why a central utility

- **Single call site**: One module checks for `window.gtag` and fires events. Feature code stays free of GA branching and type casts.
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

The function no-ops when `window` is undefined (SSR) or when `window.gtag` is missing.

## What we track

We track **high-value engagement points only**: events that directly inform product and compliance behavior (e.g. limit validation failures, key funnel steps, external link usage). We do **not** track every click, scroll, or hover. Prefer a small set of meaningful events over broad instrumentation.

External link clicks and UTM attribution are handled by the [Link Tracking](./link-tracking.md) system (`linkTracking.ts`), not by `trackGoogleAnalyticsEvent`.

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
