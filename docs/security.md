# Security and release boundaries

## Implemented controls

- bcrypt password hashing, 12-character strength policy and 128-character upper bound.
- HS256 JWT algorithm allowlist, issuer/audience validation, seven-day expiry, hashed server-side session identifiers, logout revocation and reset invalidation.
- HttpOnly session cookies; Secure in production; SameSite=Lax; same-origin architecture.
- Exact allowed Origin and double-submit CSRF checks on every mutation, restricted CORS and Helmet headers.
- Auth/public/API rate limits, 100 KB JSON limit, 5 MB upload limit, magic-byte validation, bounded image decoding and re-encoding.
- Strict schemas, no user-provided Mongo query objects, validated ObjectIds, resource ownership checks and explicit admin allowlists.
- Unique indexes for email/slug/token/deduplication. Action tokens are random, hashed, expiring and consumed once.
- Immutable slugs, inaccessible drafts/unpublished cards, separate public snapshots, suspended-account public blocking.
- URL scheme allowlist, React text escaping, escaped vCards/metadata, external-link rel attributes.
- Analytics owner binding, bounded reports, signed event token, request deduplication, GPC/DNT handling and automatic retention expiry.
- Safe error responses and no tokens, passwords or provider secrets in logs.

## Known limitations before commercial launch

1. **Single process.** Rate limits and per-owner quota serialization are in memory. Use a shared rate-limit store and transactional/atomic quota reservations before horizontal scaling. Deletion of card-related collections is not a multi-document transaction.
2. **Analytics are estimates.** Shared networks may be deduplicated together and determined bots can inflate counts. No claim of unique people or verified physical QR scans is made. `source=qr` is URL attribution.
3. **Media lifecycle.** A card/project deletion removes its database records but does not automatically delete media from Cloudinary or disk. Replacing an image consumes another upload slot. Add orphan cleanup and user deletion/export workflows before public launch. Uploaded URLs can be accessed by anyone who knows them, even if a card is a draft.
4. **Email delivery.** File delivery is local-only. Production SMTP/Cloudinary need real credentials and integration verification. Reset request responses intentionally hide whether an email exists or a delivery failed; use provider monitoring. Token consumption and user changes are not a replica-set transaction.
5. **Authentication scope.** No MFA, OAuth, refresh-token rotation or per-device session-management UI. Sessions can be invalidated by password reset or account suspension. Add abuse/CAPTCHA measures if registration traffic requires them.
6. **Operational/legal readiness.** Support contact, operator identity, legally reviewed terms/privacy, backups and incident response are deployment responsibilities. The included pages disclose their draft status.
7. **Administration.** The MVP provides basic account suspension and API pagination/exact email lookup. The UI shows the first 25 users. Reports, detailed moderation, audit trails and billing administration are deferred.
8. **Preview versus production.** Development HTTP/local storage are unsuitable for public deployment. Startup rejects those adapters under NODE_ENV=production. Do not expose the unauthenticated local mongod or work/mail directory externally.

No security claim here substitutes for an independent production review.

Implementation references: [Express production security](https://expressjs.com/en/advanced/best-practice-security.html), [Mongoose connections](https://mongoosejs.com/docs/connections.html), [MongoDB TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/), [Cloudinary Node uploads](https://cloudinary.com/documentation/node_image_and_video_upload).
