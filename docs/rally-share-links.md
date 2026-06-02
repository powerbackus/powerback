# Rally and Anonymous Share Links

POWERBACK’s **Rally** step sits between [Splash](../client/src/pages/Splash/) and the guest [Lobby / Celebration funnel](../client/src/pages/Funnel/). It prioritizes **sharing and reach** over donations. **Anonymous share links** track inbound visits and optional signup attribution without storing PII on `ShareLink` documents.

**Product spec (authoritative behavior):** [`specs/rally-page.md`](../specs/rally-page.md)

## Quick navigation

| Topic                             | Document / code                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Product requirements & acceptance | [`specs/rally-page.md`](../specs/rally-page.md)                                                                      |
| API endpoints                     | [API — Share links](./API.md#share-links-rally)                                                                      |
| GA events & `page_location`       | [Analytics — Rally events](./analytics.md#rally-and-share-link-events)                                               |
| Client storage keys               | [Utils — Rally storage](./utils.md#rally-share-link-storage)                                                         |
| Inbound `?share=` bootstrap       | [`recordShareLinkVisit.ts`](../client/src/utils/app/recordShareLinkVisit.ts), [`App.tsx`](../client/src/App.tsx)     |
| Rally UI                          | [`client/src/pages/Rally/`](../client/src/pages/Rally/)                                                              |
| Backend model                     | [`models/ShareLink.js`](../models/ShareLink.js)                                                                      |
| Signup attribution                | [`create.js`](../controller/users/account/create.js), [`activate.js`](../controller/users/account/utils/activate.js) |

## Guest funnel flow

```text
Splash (primary CTA) → Rally → optional share / email / account
                              → Take me to the Lobby (Tour + pb:guestAccess)
```

Logged-in users are **not** forced through Rally; see the spec §2.

## Two storage keys (do not confuse)

| Key               | Purpose                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pb:shareLink`    | **Outbound** link this visitor generated (`publicCode`, `claimCode`, `shareUrl`). Set only after explicit **Generate** on Rally.                                                  |
| `pb:refShareCode` | **Inbound** referral that brought this visitor (`publicCode` + `storedAt`, 30-day TTL). Set only after successful visit API. Sent on signup; cleared after successful activation. |

Session helpers: `pb:shareVisit:{code}` (visit dedupe), `pb:rallyShareInbound` (GA entry enum only).

## Public URL vs API

| Use                     | URL                                        |
| ----------------------- | ------------------------------------------ |
| Share with others       | `https://powerback.us/?share={publicCode}` |
| Record visit (app only) | `GET /api/share-links/:publicCode`         |

Recipients must never be asked to copy `/api/share-links/...`.

## Inbound visit (`?share=`)

1. User opens `/?share={publicCode}`.
2. [`App.tsx`](../client/src/App.tsx) runs `recordShareLinkVisitFromQuery()` then `stripShareQueryFromUrl()`.
3. On successful `GET /api/share-links/:publicCode`: increment `visit_count`, set `pb:refShareCode`, fire `share_link_visited` (no code in GA params).
4. Initial gtag `page_location` omits `?share=` via [`client/public/index.html`](../client/public/index.html); see [Analytics](./analytics.md#rally-and-share-link-events).

Rally does **not** `POST /api/share-links` on mount.

## Signup attribution

**Flow:** inbound visit → `pb:refShareCode` → `POST /api/users` with optional `refShareCode` → `Applicant.ref_share_code` → activation reads Applicant only → `$addToSet` on `ShareLink.referred_users`.

- No `User.referred_by_share_link` field.
- No `?refShareCode=` on activate URLs (avoids access-log leakage).
- Attribution is **best-effort**; signup and activation succeed if it fails.
- Not used for money, credits, or compliance tiers.

## Privacy and logging

- **MongoDB:** visit counters and timestamps only; no IP/UA/referrer on `ShareLink`.
- **Logs:** claim codes and emails are not logged in share-link controllers; attribution logs `publicCodeLength` only.
- **GA custom events:** no `publicCode`, `claimCode`, emails, or full share URLs in event params.

## Rate limits

- **Create:** `shareLinkCreate` — 10/hour/IP (`POST /api/share-links` only).
- **Visit:** general API limiter on `GET /api/share-links/:publicCode`.

See [`services/utils/rateLimitHelpers.js`](../services/utils/rateLimitHelpers.js).

## Deferred (v1)

- Claim-code redemption API
- Email waitlist backend on Rally
- Rewards tied to referral counts

Listed in [`specs/rally-page.md` §9](../specs/rally-page.md#9-deferred-items).
