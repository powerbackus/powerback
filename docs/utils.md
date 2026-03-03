# Client Utils Documentation

This document describes the `client/src/utils` directory: utility functions and helpers used across the React front end. The root `index.ts` re-exports from subdirectory barrels; import from `@Utils` (or the barrel) rather than from individual files.

> **Related documentation:**
>
> - [Project Overview](./overview.md) – front end structure (utils directory placement)
> - [Client Storage Policy](../.cursor/rules/20-client-storage.mdc) – what may be stored and how (see **storage** and **app**)
> - [Analytics](./analytics.md) – analytics events and usage
> - [Link Tracking](./link-tracking.md) – tracked links and citation visits
> - [Contexts](./contexts.md) – contexts use `logError` / `logWarn` from **logging**

## Directory layout

| Subdirectory | Purpose                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `analytics`  | Google Analytics event tracking                                                                 |
| `app`        | App-level helpers: user load/update, donation failure, activation, election dates, localStorage |
| `campaign`   | Election campaign cycle and cutoff helpers                                                      |
| `export`     | Export celebrations to CSV and download                                                         |
| `fec`        | FEC tier info and citation helpers                                                              |
| `formatting` | Text/number formatting (commafy, titleize, capitalCaseify, dollarsAndCents)                     |
| `ids`        | ID generation (Mongo-style, password, shuffle)                                                  |
| `logging`    | Client-side logging, error reporting, status message tuples                                     |
| `misc`       | Public asset paths, URI regex, standard deviation                                               |
| `payment`    | Stripe key loading and initialization                                                           |
| `storage`    | Prefixed, JSON-encoded storage utility (see storage policy)                                     |
| `tracking`   | Link tracking, visit citation, tweet donation                                                   |
| `ui`         | Keyboard handling, scroll behavior, simulated click                                             |

---

## Subdirectories and exports

### analytics

- **`trackGoogleAnalyticsEvent`** – send a named event to Google Analytics.

See [Analytics](./analytics.md) for usage and conventions.

### app

Application-level helpers: user data, donation validation messaging, activation, election dates, and namespaced local storage.

- **User and session**
  - `loadUser` – load user data (e.g. after auth).
  - `updateUser` – update user data (e.g. after profile/celebration changes).
  - `activation` – activation flow helper.
- **Donation flow**
  - `donationFailure` – build donation-failure/rejection messaging from validation response.
  - `transformPolData` – transform politician data for forms/display.
- **Election dates**
  - `loadBundledElectionDates` – load bundled read-only election dates snapshot.
  - `fetchAndCacheElectionDates` – fetch from server and cache in memory (no persistent write).
  - Types: `ElectionDatesResult`, `DonationFailureProps`.
- **Local storage (namespaced)**
  - `storeLocally`, `retrieveLocal`, `removeLocal`, `clearLocalMap`, `storeMapLocally` – key/value and map storage.
  - `getCachedElectionDates`, `setCachedElectionDates` – in-memory/session election date cache only (per storage policy).

Storage usage must follow the [Client Storage Policy](../.cursor/rules/20-client-storage.mdc) (no tokens/PII, `pb:` prefix via storage utility where applicable).

### campaign

Election cycle and cutoff helpers used for compliance and UI (e.g. cycle labels, cutoff dates).

- **`thisCampaign`** – current campaign/cycle.
- **`cycle`** – cycle value/display.
- **`cutoff`** – cutoff date logic.
- **`nextStart`**, **`nextEnd`** – next cycle start/end (from `campaign/next`).

See [Election Dates](../.cursor/rules/21-election-dates.mdc) and [Donation Limits](./donation-limits.md) for authority and fallbacks.

### export

- **`celebrationsToCSV`** – turn celebrations data into CSV content.
- **`downloadCSV`** – trigger CSV download in the browser.

### fec

FEC compliance tier and citation helpers.

- **`getFECTierInfo`** – tier info for display/logic.
- **`getGlobalCitations`**, **`shouldShowCitation`** – citation content and visibility.
- Types: `FECTierInfo`, `FECCitation`, `FECCitationContext`.

### formatting

Plain formatting functions (no React).

- **`commafy`** – number with thousands separators.
- **`titleize`** – title-case string.
- **`capitalCaseify`** – capital-case string.
- **`dollarsAndCents`** – currency-style string (e.g. dollars and cents).

### ids

- **`mongoObjIdGen`** – MongoDB-style object ID generation.
- **`passGen`** – password/random string generation.
- **`shuffle`** – array shuffle.

### logging

Client-side logging and error handling. Used by contexts and components; avoids dumping raw errors or API payloads in production.

- **`logError`**, **`logWarn`** – log with level; production strips stacks and sensitive payloads.
- **`reportClientError`** – report to client error reporting (e.g. external service).
- **`getErrorTupleForStatus`**, **`getStatusErrorMessage`** – map HTTP status to error tuple/message (aligned with `tuples/errors.js`).

See [Contexts](./contexts.md) for logging conventions in providers.

### misc

- **`publicAsset`** – path to a public asset (e.g. in `public/`).
- **`regexMatchURI`** – match URI against a pattern.
- **`getStandardDeviation`** – standard deviation of a numeric array.

### payment

Stripe client setup.

- **`loadStripeKey`** – load Stripe publishable key (e.g. from config).
- **`initializeStripe`** – initialize Stripe instance for the client.

See [Payment Processing](./payment-processing.md) for the full flow.

### storage

Single storage utility: prefix (`pb:`), JSON encoding, and optional TTL/size checks. All persistent client storage should go through this (or the app localStorage helpers that respect the same policy).

- **`storage`** – object with `set`, `get`, `clear` (and any other exposed methods).

See [Client Storage Policy](../.cursor/rules/20-client-storage.mdc) for what may be stored and naming/size/clear-on-logout rules.

### tracking

Link tracking, citation visits, and tweet donation.

- **`getTrackedLink`**, **`trackLinkClick`**, **`addTrackingParams`**, **`createTrackedLinkHandler`** – tracked link creation and click handling.
- **`visitCitation`** – record citation visit.
- **`tweetDonation`** – open/share tweet for donation.
- Type: `TrackingConfig`.

See [Link Tracking](./link-tracking.md) for usage.

### ui

- **`handleKeyDown`** – keyboard event handler (e.g. Enter/Escape).
- **`simulateMouseClick`** – programmatic click simulation.
- **`getScrollBehavior`** – scroll behavior for containers or document.

---

## Import pattern

Prefer importing from the barrel so that refactors to internal paths don’t affect call sites:

```typescript
import {
  trackGoogleAnalyticsEvent,
  commafy,
  dollarsAndCents,
  logError,
  storage,
  loadUser,
  getFECTierInfo,
  handleKeyDown,
} from '@Utils';
```

Use subpath imports only when you need to avoid circular dependencies or need a specific submodule (e.g. `@Utils/logging`).
