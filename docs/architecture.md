# Architecture

The browser talks only to `/api/v1` on its own origin. Vite proxies API/media requests in development; Express serves the built client in production. This same-origin architecture allows HttpOnly Secure SameSite=Lax cookies without third-party cookie dependencies. A separately hosted frontend must proxy `/api` to the backend; direct cross-site cookies are not supported by this configuration.

## Source map

| Area | Location |
|---|---|
| React router and lazy screen boundaries | `client/src/App.jsx` |
| Shared components and design system | `client/src/components`, `client/src/styles.css` |
| Authentication state and Axios/CSRF transport | `client/src/contexts`, `client/src/services` |
| Feature screens | `client/src/pages` |
| Mongo schemas/indexes | `server/src/models/index.js` |
| Strict request validation | `server/src/validators/index.js` |
| Authentication, CSRF and errors | `server/src/middleware/security.js` |
| HTTP resource groups | `server/src/routes` |
| Mail and card ownership/quota services | `server/src/services` |
| Environment validation and startup | `server/src/config`, `server/src/server.js` |
| Development and test runners | `scripts` |

## Data

- User: unique normalized email, password hash excluded from normal reads, verification, role, active/suspended status, session version, free plan.
- Session: owner, hashed JWT identifier, indexed expiry. Logout deletes the current session; password reset invalidates all sessions. TTL is cleanup only; request validation checks expiry directly.
- ActionToken: hashed random single-use verification/reset token, owner, purpose and expiry. Reset links expire in 30 minutes, verification links in 24 hours.
- BusinessCard: indexed owner, unique immutable slug, editable draft, published snapshot, publication status and timestamps. Public serialization omits owner/account information.
- PortfolioItem: owner and card references, project metadata, ordered index, visibility and featured flag. Public response is limited to five visible projects.
- Media: owner, processed asset URL and provider asset ID. Referencing another user's uploaded image is rejected.
- AnalyticsEvent: indexed owner/card/time, type, direct/QR source, keyed duplicate-prevention digest, 100-day TTL.

The full business model intentionally excludes service, appointment, payment and subscription collections until those workflows are implemented. Do not activate a paid entitlement by editing frontend state or adding a dummy checkout redirect.

## Publication semantics

Saving a card edits `draft`. Publishing copies it to `snapshot`. Unpublishing immediately makes the public API return 404. A suspended owner's public cards are also unavailable. The slug is fixed at creation. Portfolio projects are separate resources; their publish switches affect public visibility immediately, independently of the card detail snapshot.

## Analytics

A public-profile response contains a signed, one-hour, card-bound event token. Event writes also require the normal origin/CSRF checks and pass rate limits. Events are deduplicated per card, event type and 30-minute request fingerprint window. Only an HMAC digest is persisted; raw IP/user-agent data is not stored. Views are engagement events, not reliable counts of individual people. A `source=qr` view is attributed to the QR URL, but this parameter is not proof of a physical camera scan. Downloads never increment visits. GPC and DNT suppress event collection.

All reporting matches the authenticated owner, is restricted to 7/30/90 days, limits top cards and activity rows, and uses indexed lookups/aggregation. No unbounded event array is embedded in a card document.

## External services

Media processing verifies file signatures, decodes images with a 24-million-pixel cap, strips metadata by re-encoding, and resizes to a maximum 1400px WebP. Cloudinary receives server-side uploads only. SMTP credentials stay on the server. Development disk adapters are explicitly prohibited when NODE_ENV=production.
