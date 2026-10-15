# Cardora

**Your Identity. One Link.** A working MERN digital business card and portfolio MVP.

## Start locally

Requires Node.js 22.12+ (tested on Node 24), npm, and internet access for the first dependency/MongoDB binary download.

```sh
npm install
npm run dev
```

Open **http://localhost:4380**. API: **http://localhost:4381/api/v1/health**.

The development runner creates an ignored `.env` with cryptographically random secrets. It starts a real MongoDB server with durable WiredTiger storage in `work/database`, Express and Vite. `mongodb-memory-server` supplies the binary; the development database is **persistent**, not a mock API. Stop with Ctrl+C. Do not run multiple development instances against the same database directory. `work/` must remain private.

**Email verification in local development:** Register, then open the matching JSON message under `work/mail/` and follow the verification URL. These private files substitute for an SMTP inbox and contain sensitive, expiring links. They are excluded from source archives and Git. Nothing sends real email until SMTP is configured. Resend verification from Account settings if needed.

**Image uploads:** JPEG, PNG and WebP up to 5 MB. Local development writes processed WebP files under `work/media`. Production requires Cloudinary and never uses ephemeral disk storage for uploads.

To use your own MongoDB instead of the bundled local development process, configure `MONGODB_URI` in `.env`, run `node server/src/server.js`, and run `npm --prefix client run dev` in a second terminal.

## Included

- React/Vite/JavaScript client, Tailwind and shared design tokens, responsive marketing site and dashboard.
- Express/Mongoose backend, MongoDB models and indexes, strict Zod validation.
- Registration, login, logout, session restoration, verification, password reset and session revocation.
- HttpOnly cookie JWTs, CSRF/origin checks, restricted CORS, password hashing, rate limits and ownership enforcement.
- One free digital card per account; three functional templates; light/dark, accent, photo shape, button style and section order.
- Split live editor, image upload, contact/social links, social reordering, vCard export.
- Separate draft and published snapshots; fixed slugs; publish, republish, unpublish and delete.
- PNG/SVG QR downloads, copy link and native sharing with clipboard fallback.
- Five portfolio projects per account; edit, delete, visibility, featured layout and numeric display ordering.
- Real view/contact/social analytics, 7/30/90-day filters, QR attribution, deduplication and 100-day retention.
- Basic administrator overview, account list, account suspension and controlled role provisioning.
- Production frontend serving with route refresh support and profile sharing metadata.

## Explicitly deferred

Paid subscriptions and Razorpay checkout/webhooks, services, appointment requests, custom domains, teams, advanced visitor analytics, reported-profile moderation, self-service account deletion/data export and extensive administration are **not implemented**. They are not sold or represented as available. Pro/Business pricing is labeled proposed. The shipped entitlement is Free only, with one card, five projects and 20 image uploads. There are no simulated payments or hardcoded account metrics.

Cloudinary and SMTP adapters are implemented but require your credentials and provider-level verification before launch. Marketing examples are labeled demonstration profiles. Support details and legal pages are explicitly deployment placeholders.

## Commands

```sh
npm run setup                     # Create .env without overwriting an existing one
npm run dev                       # Persistent local MongoDB + API + Vite
npm run build                     # Production frontend
npm start                         # Express API + built frontend; uses configured MongoDB
npm test                          # Backend integration + React component tests
node scripts/verify-browser.mjs    # Isolated app/database + Playwright smoke tests (Chrome)
npm run test:e2e                   # Smoke tests against an already-running dev app
node server/scripts/admin.js verified-account@example.com
```

The root installs dependencies for both folders without workspace symlinks, for compatibility with restricted Windows environments. `package-lock.json` is committed with the source. Use `npm ci` for reproducible deployment. Test data and database files stay under ignored `work/` directories.

## First card walkthrough

1. Register and verify your email.
2. Create your card; upload a photo and enter a profile address.
3. Add contact details and social URLs on the Links tab.
4. Pick Studio, Minimal or Editorial and customize the Design tab.
5. Save a draft. Preview changes before publishing.
6. Publish, open the public page and download its QR code from Share & QR.
7. Add projects from Portfolio and enable their public visibility.
8. View real engagement in Analytics. Save subsequent card changes as drafts and republish when ready.

Card detail edits need republishing. Portfolio edits have independent visibility and update the live portfolio immediately. This distinction is explained in the editor. Slugs cannot be changed, ensuring stable QR destinations.

See [architecture](docs/architecture.md), [API](docs/api.md), [deployment](docs/deployment.md), [security limitations](docs/security.md) and [verification report](docs/verification.md).
