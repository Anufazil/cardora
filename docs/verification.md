# Verification report

Verified on 13 October 2026, using Node.js 24 on Windows. These results refer to real executed checks, not assumed coverage.

## Results

| Check | Result |
|---|---|
| Production Vite build | Passed |
| Backend integration suite against a real isolated MongoDB | 16 passed |
| React/component suite | 10 passed |
| Playwright full user journey | Passed |
| Playwright desktop/mobile marketing and route refresh | Passed |
| Production dependency audit after updates | 0 known vulnerabilities reported |

The browser suite runs with an isolated MongoDB database and local disk media/mail adapters. No production provider calls, real payments or external emails were made.

## End-to-end journey exercised

Registration → verification from local email → profile-image upload → contact and social details → template selection/live preview → saved draft → anonymous draft denial → publication → visitor contact links → saved draft isolation → republishing without changing the URL → QR PNG download → published portfolio project → real analytics → mobile/desktop layout checks → unpublish → anonymous profile denial → deletion.

Backend checks also cover unauthorized access, role self-assignment, weak passwords, duplicate email, reserved/duplicate slugs, free-plan limits, CSRF and foreign origins, unsafe URLs, forged image MIME types, cross-owner image references, portfolio ownership, single-use token handling, password-reset session invalidation, logout, analytics ownership/deduplication and DNT suppression.

Frontend checks exercise authentication validation/error states, all three public templates, conditional sections, vCard escaping, live editing, template changes, save-before-publish sequencing and retry/loading states.

## Stage record

| Stage | Implementation and files | Verification / remaining scope |
|---|---|---|
| 1. Setup | Root package/lockfile, client/server structure, environment configuration, dev runner | Build and isolated MongoDB startup passed. Development files persist in work/database. |
| 2. Design | styles.css, common/layout components, marketing screens | Desktop 1440px and mobile 390px browser checks and visual review. |
| 3. Authentication | User/Session/ActionToken models, auth routes/context/forms | Registration, login, restoration, logout, verification/reset and security integration tests passed. Live SMTP remains unverified. |
| 4. Cards | Card schema, card services/routes, dashboard/editor/public components | Draft/public separation, template editing, ownership and stable URL journey passed. |
| 5. Sharing | Media route, SharePanel, vCard utilities | Image validation/upload, QR PNG download and vCard escaping passed. Cloudinary credentials/provider verification remain deployment tasks. |
| 6. Portfolio | Portfolio model/routes/manager | Ownership and public-visibility checks passed. Services and appointments deferred under the MVP priority allowance. |
| 7. Analytics | Event model/routes, reporting/dashboard charts | Real event collection, deduplication, owner scoping, date filters and UI journey passed. No unique-person claim. |
| 8. Payments | Free-entitlement endpoint and Billing screen | Paid checkout explicitly unavailable. Razorpay and subscription lifecycle deferred; no payment acceptance claim. |
| 9. Administration | Role guard, overview/users/status API and UI, admin provisioning command | Non-admin rejection verified. Advanced moderation/reporting deferred. |
| 10. Verification | Integration/component/browser tests, deployment/API/security docs | Executed checks above passed; see operational boundaries below. |

## Environment issues resolved or bounded

- Windows workspace symlink restrictions: dependencies install at the monorepo root without workspace links.
- Vite realpath restrictions: preserveSymlinks is enabled.
- MongoDB's sandbox temporary directory could not support required file renames: test databases use a dedicated workspace directory.
- An existing unrelated app occupied port 3001: Cardora uses 4380/4381; isolated browser tests use 4382/4383.
- Sandboxed preview processes are not reliably reachable from separate tool/browser sessions. The self-contained browser runner successfully connects and verifies the app. Start `npm run dev` from a normal local terminal for interactive use. An externally reachable or hosted deployment is not claimed.
- Label helper text was included in accessible field names: labels and helper text were separated and the browser journey rerun.
- Mobile sidebar and small/low-contrast dashboard text were corrected and visually rechecked.
- Nodemailer and Sharp were upgraded after an audit flagged older versions. The subsequent production audit returned zero known advisories.

## Not verified / not production-ready claims

Live Cloudinary/SMTP delivery, public HTTPS hosting, multi-instance coordination, backups, load/capacity, broad browser/device coverage, a full WCAG audit, legally reviewed terms and external penetration testing remain outside the performed checks. Paid plans, appointments and service workflows are not implemented and have no claimed acceptance tests. See `security.md` for remaining application limitations.

